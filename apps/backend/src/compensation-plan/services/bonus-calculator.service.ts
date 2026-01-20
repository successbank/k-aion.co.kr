import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenealogyService } from '../../members/genealogy.service';
import { CommissionRatesService } from '../../commission-rates/commission-rates.service';
import { RecognizedSalesService } from '../../recognized-sales/recognized-sales.service';
import { Bonus, BonusType, CenterBonusMode, MemberGrade, TreeType } from '@prisma/client';

// 등급 계층 순서 (낮은 인덱스 = 높은 등급)
const GRADE_ORDER: MemberGrade[] = [
  MemberGrade.ADMIN,
  MemberGrade.CENTER,
  MemberGrade.DIVISION_CHIEF,
  MemberGrade.BRANCH_CHIEF,
  MemberGrade.MANAGER,
  MemberGrade.AGENT,
  MemberGrade.MEMBER,
];

/**
 * 보상플랜 보너스 계산 서비스
 *
 * 6가지 보너스 유형:
 * 1. SALES - 판매 보너스 (500,000원)
 * 2. SALES_MANAGEMENT - 판매 관리 보너스 (150,000원)
 * 3. LICENSE - 판권 보너스 (100,000~240,000원)
 * 4. LICENSE_MANAGEMENT - 판권 관리 보너스 (30,000~50,000원)
 * 5. SHARING - 공유 보너스 (20,000원)
 * 6. BRANCH_OPERATION - 지점 운영 보너스 (50,000원)
 *
 * 인정매출 기능:
 * - ADMIN이 회원에게 등급을 "인정"하여 정상적인 승급 조건을 무시하고 보너스 자격을 부여
 * - 실제 등급과 인정 등급 중 높은 것을 유효 등급으로 사용
 * - 인정만으로는 보너스가 발생하지 않으며, 실제 활동(매출/추천)이 있어야 보너스 지급
 */
@Injectable()
export class BonusCalculatorService {
  private readonly logger = new Logger(BonusCalculatorService.name);

  constructor(
    private prisma: PrismaService,
    private genealogyService: GenealogyService,
    private commissionRatesService: CommissionRatesService,
    private recognizedSalesService: RecognizedSalesService,
  ) {}

  /**
   * 회원의 유효 등급 조회 (실제 등급과 인정 등급 중 높은 것)
   * 인정매출 기능을 통해 조건 미달 회원도 보너스 자격을 얻을 수 있음
   *
   * @param memberId 회원 ID
   * @returns 유효 등급 (MemberGrade)
   */
  private async getEffectiveGrade(memberId: number): Promise<MemberGrade> {
    return this.recognizedSalesService.getEffectiveGrade(memberId);
  }

  /**
   * 등급이 특정 기준 이상인지 확인
   *
   * @param grade 확인할 등급
   * @param minGrade 최소 등급
   * @returns 기준 이상이면 true
   */
  private isGradeAtLeast(grade: MemberGrade, minGrade: MemberGrade): boolean {
    const gradeIndex = GRADE_ORDER.indexOf(grade);
    const minGradeIndex = GRADE_ORDER.indexOf(minGrade);
    return gradeIndex <= minGradeIndex; // 인덱스가 작을수록 높은 등급
  }

  /**
   * 판매 보너스 계산 (SALES)
   * 조건: 본인이 직접 판매 시 500,000원 지급
   *
   * @param saleId 판매 ID
   * @returns 생성된 보너스 레코드
   */
  async calculateSalesBonus(saleId: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { seller: true },
    });

    if (!sale) {
      throw new Error(`Sale with ID ${saleId} not found`);
    }

    // ✅ 시스템 계정(ADMIN)은 보너스 수령 불가
    if (sale.seller.grade === MemberGrade.ADMIN) {
      this.logger.log(`ADMIN 계정(ID: ${sale.sellerId})은 판매 보너스를 받을 수 없습니다.`);
      return null;
    }

    // 주차 코드 생성 (예: "2025-W01")
    const weekCode = this.getWeekCode(sale.soldAt);

    // DB에서 활성 수당률 설정 조회 (fallback: 500,000원)
    const rateConfig = await this.commissionRatesService.findActiveByBonusType(BonusType.SALES);
    const amount = rateConfig?.baseAmount || 500000;

    // 보너스 생성
    const bonus = await this.prisma.bonus.create({
      data: {
        memberId: sale.sellerId,
        saleId: sale.id,
        bonusType: BonusType.SALES,
        amount,
        description: `판매 보너스 - 판매코드: ${sale.saleCode}`,
        weekCode,
        status: 'PENDING',
      },
    });

    return bonus;
  }

  /**
   * 판매 관리 보너스 계산 (SALES_MANAGEMENT)
   * 조건: 후원계보(스폰서) 상위 회원이 하위 회원 판매 시 150,000원 지급
   * ⚠️ 추천계보(추천인)가 아닌 후원계보(스폰서)에만 지급
   *
   * @param saleId 판매 ID
   * @returns 생성된 보너스 레코드들
   */
  async calculateSalesManagementBonus(saleId: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        seller: {
          include: {
            sponsor: true,
          },
        },
      },
    });

    if (!sale) {
      throw new Error(`Sale with ID ${saleId} not found`);
    }

    const weekCode = this.getWeekCode(sale.soldAt);
    const bonuses: Bonus[] = [];

    // ✅ 후원계보(스폰서)에만 판매 관리 보너스 지급
    if (sale.seller.sponsorId && sale.seller.sponsor) {
      // ✅ 후원인이 ADMIN인 경우 보너스 지급 안 함
      if (sale.seller.sponsor.grade === MemberGrade.ADMIN) {
        this.logger.log(
          `ADMIN 계정은 판매 관리 보너스를 받을 수 없습니다. (판매자: ${sale.seller.name})`,
        );
        return bonuses;
      }

      // DB에서 활성 수당률 설정 조회 (fallback: 150,000원)
      const rateConfig = await this.commissionRatesService.findActiveByBonusType(
        BonusType.SALES_MANAGEMENT,
      );
      const amount = rateConfig?.baseAmount || 150000;

      const bonus = await this.prisma.bonus.create({
        data: {
          memberId: sale.seller.sponsorId,
          saleId: sale.id,
          bonusType: BonusType.SALES_MANAGEMENT,
          amount,
          description: `판매 관리 보너스 (후원계보) - 판매자: ${sale.seller.name}`,
          weekCode,
          status: 'PENDING',
        },
      });
      bonuses.push(bonus);
    }

    return bonuses;
  }

  /**
   * 판권 보너스 계산 (LICENSE)
   * 조건:
   * - ✅ 후원계보(SPONSOR) 기준
   * - ✅ 3팀 이상 구성 필요
   * - 매니저 육성: 3팀 에이전트 합 15명 이상 → 150,000원
   * - 지부장 육성: 3팀 각팀 매니저 1명 이상 + 합 4명 이상 → 200,000원
   * - 본부장 육성: 3팀 각팀 지부장 1명 이상 + 합 5명 이상 → 240,000원
   * - 에이전트 육성: 100,000원 (팀 조건 없음)
   *
   * @param cultivationRecordId 육성 실적 ID
   * @returns 생성된 보너스 레코드
   */
  async calculateLicenseBonus(cultivationRecordId: number) {
    const record = await this.prisma.cultivationRecord.findUnique({
      where: { id: cultivationRecordId },
      include: {
        cultivator: true,
        cultivatedMember: true,
      },
    });

    if (!record) {
      throw new Error(`CultivationRecord with ID ${cultivationRecordId} not found`);
    }

    // ✅ 후원계보(SPONSOR)에만 판권 보너스 지급
    if (record.treeType !== TreeType.SPONSOR) {
      throw new Error(
        `판권 보너스는 후원계보(SPONSOR) 육성만 해당됩니다. (현재: ${record.treeType})`,
      );
    }

    // ✅ 양성자가 ADMIN인 경우 보너스 지급 안 함
    if (record.cultivator.grade === MemberGrade.ADMIN) {
      this.logger.log(
        `ADMIN 계정은 판권 보너스를 받을 수 없습니다. (양성자: ${record.cultivator.name})`,
      );
      return null;
    }

    // ✅ 매니저 이상 등급 육성 시 팀 기반 자격 조건 검증
    if (
      record.achievedGrade === MemberGrade.MANAGER ||
      record.achievedGrade === MemberGrade.BRANCH_CHIEF ||
      record.achievedGrade === MemberGrade.DIVISION_CHIEF
    ) {
      const qualification = await this.checkLicenseBonusQualification(
        record.cultivatorId,
        record.achievedGrade,
      );

      if (!qualification.qualified) {
        this.logger.log(
          `판권 보너스 자격 미달: ${record.cultivator.name}님 - ${qualification.reason}`,
        );
        throw new Error(`판권 보너스 자격 조건 미달: ${qualification.reason}`);
      }
    }

    // DB에서 활성 수당률 설정 조회
    const rateConfig = await this.commissionRatesService.findActiveByBonusType(BonusType.LICENSE);

    // 등급별 기본 보너스 금액 (fallback)
    const defaultBonusAmounts: Record<MemberGrade, number> = {
      [MemberGrade.MEMBER]: 0,
      [MemberGrade.AGENT]: 100000,
      [MemberGrade.MANAGER]: 150000,
      [MemberGrade.BRANCH_CHIEF]: 200000,
      [MemberGrade.DIVISION_CHIEF]: 240000,
      [MemberGrade.CENTER]: 0,
      [MemberGrade.ADMIN]: 0,
    };

    let amount: number;

    // DB 설정이 등급별 차등인 경우
    if (rateConfig?.isGradeTiered && rateConfig.tiers && rateConfig.tiers.length > 0) {
      const tier = rateConfig.tiers.find((t) => t.applicableGrade === record.achievedGrade);
      amount = tier?.amount || defaultBonusAmounts[record.achievedGrade];
    } else {
      // 단일 금액 또는 설정 없음 -> fallback
      amount = rateConfig?.baseAmount || defaultBonusAmounts[record.achievedGrade];
    }

    if (!amount) {
      throw new Error(`No license bonus for grade ${record.achievedGrade}`);
    }

    const weekCode = this.getWeekCode(record.achievedAt);

    const bonus = await this.prisma.bonus.create({
      data: {
        memberId: record.cultivatorId,
        bonusType: BonusType.LICENSE,
        amount,
        description: `판권 보너스 (후원계보) - ${record.cultivatedMember.name}님 ${this.getGradeKorean(record.achievedGrade)} 승급`,
        weekCode,
        status: 'PENDING',
        calculationBasis: JSON.stringify({
          cultivatedMemberId: record.cultivatedMemberId,
          achievedGrade: record.achievedGrade,
          teamNumber: record.teamNumber,
          treeType: record.treeType,
        }),
      },
    });

    return bonus;
  }

  /**
   * 판권 보너스 자격 검증
   * 후원계보 기준 3팀 분포 및 등급별 조건 확인
   * 인정판권이 있는 경우 팀 조건 우회
   *
   * @param cultivatorId 육성자 ID
   * @param achievedGrade 달성 등급
   * @returns 자격 충족 여부 및 미달 사유
   */
  private async checkLicenseBonusQualification(
    cultivatorId: number,
    achievedGrade: MemberGrade,
  ): Promise<{ qualified: boolean; reason?: string }> {
    // ✅ 인정판권 확인 - 조건 충족 시 팀 검증 우회
    const hasLicenseRecognition = await this.recognizedSalesService.hasActiveLicenseRecognition(
      cultivatorId,
      achievedGrade,
    );

    if (hasLicenseRecognition) {
      this.logger.log(`인정판권 적용: 회원 ID ${cultivatorId}, 등급 ${achievedGrade} - 팀 조건 우회`);
      return { qualified: true };
    }

    // 기존 팀 조건 검증 로직
    const stats = await this.genealogyService.getTeamGradeStatisticsForQualification(cultivatorId);

    // 3팀 모두 회원이 있어야 함
    const activeTeamCount = stats.teams.filter(
      (t) => t.agentCount + t.managerCount + t.branchChiefCount + t.divisionChiefCount > 0,
    ).length;

    if (activeTeamCount < 3) {
      return { qualified: false, reason: `3팀 이상 필요 (현재: ${activeTeamCount}팀)` };
    }

    switch (achievedGrade) {
      case MemberGrade.MANAGER:
        // 3팀의 에이전트 합 15명 이상
        if (stats.totals.agentCount < 15) {
          return {
            qualified: false,
            reason: `에이전트 합 15명 이상 필요 (현재: ${stats.totals.agentCount}명)`,
          };
        }
        break;

      case MemberGrade.BRANCH_CHIEF: {
        // 3팀 각팀별 매니저 1명 이상 + 합 4명 이상
        const teamsWithManager = stats.teams.filter((t) => t.managerCount >= 1).length;
        if (teamsWithManager < 3) {
          return {
            qualified: false,
            reason: `3팀 각팀 매니저 1명 이상 필요 (현재: ${teamsWithManager}팀)`,
          };
        }
        if (stats.totals.managerCount < 4) {
          return {
            qualified: false,
            reason: `매니저 합 4명 이상 필요 (현재: ${stats.totals.managerCount}명)`,
          };
        }
        break;
      }

      case MemberGrade.DIVISION_CHIEF: {
        // 3팀 각팀 지부장 1명 이상 + 합 5명 이상
        const teamsWithBranchChief = stats.teams.filter((t) => t.branchChiefCount >= 1).length;
        if (teamsWithBranchChief < 3) {
          return {
            qualified: false,
            reason: `3팀 각팀 지부장 1명 이상 필요 (현재: ${teamsWithBranchChief}팀)`,
          };
        }
        if (stats.totals.branchChiefCount < 5) {
          return {
            qualified: false,
            reason: `지부장 합 5명 이상 필요 (현재: ${stats.totals.branchChiefCount}명)`,
          };
        }
        break;
      }
    }

    return { qualified: true };
  }

  /**
   * 판권 관리 보너스 계산 (LICENSE_MANAGEMENT)
   * 조건:
   * - ⚠️ 추천계보(RECOMMENDER) 육성만 해당 (후원계보 제외)
   * - 하위 회원이 에이전트/매니저를 육성했을 때
   * - 에이전트 육성: 30,000원
   * - 매니저 육성: 50,000원
   *
   * @param cultivationRecordId 육성 실적 ID
   * @returns 생성된 보너스 레코드들
   */
  async calculateLicenseManagementBonus(cultivationRecordId: number) {
    const record = await this.prisma.cultivationRecord.findUnique({
      where: { id: cultivationRecordId },
      include: {
        cultivator: {
          include: {
            recommender: true,
          },
        },
        cultivatedMember: true,
      },
    });

    if (!record) {
      throw new Error(`CultivationRecord with ID ${cultivationRecordId} not found`);
    }

    // ✅ 추천계보(RECOMMENDER)에만 판권 관리 보너스 지급
    if (record.treeType !== TreeType.RECOMMENDER) {
      return [];
    }

    // 에이전트/매니저 육성에만 관리 보너스 지급
    if (
      record.achievedGrade !== MemberGrade.AGENT &&
      record.achievedGrade !== MemberGrade.MANAGER
    ) {
      return [];
    }

    // DB에서 활성 수당률 설정 조회
    const rateConfig = await this.commissionRatesService.findActiveByBonusType(
      BonusType.LICENSE_MANAGEMENT,
    );

    // 등급별 기본 보너스 금액 (fallback)
    const defaultBonusAmounts: Record<string, number> = {
      [MemberGrade.AGENT]: 30000,
      [MemberGrade.MANAGER]: 50000,
    };

    let amount: number;

    // DB 설정이 등급별 차등인 경우
    if (rateConfig?.isGradeTiered && rateConfig.tiers && rateConfig.tiers.length > 0) {
      const tier = rateConfig.tiers.find((t) => t.applicableGrade === record.achievedGrade);
      amount = tier?.amount || defaultBonusAmounts[record.achievedGrade];
    } else {
      // 단일 금액 또는 설정 없음 -> fallback
      amount = rateConfig?.baseAmount || defaultBonusAmounts[record.achievedGrade];
    }

    const weekCode = this.getWeekCode(record.achievedAt);
    const bonuses: Bonus[] = [];

    // 육성자의 추천인(상위 회원)에게 지급
    if (record.cultivator.recommenderId && record.cultivator.recommender) {
      // ✅ 추천인이 ADMIN인 경우 보너스 지급 안 함
      if (record.cultivator.recommender.grade === MemberGrade.ADMIN) {
        this.logger.log(
          `ADMIN 계정은 판권 관리 보너스를 받을 수 없습니다. (육성자: ${record.cultivator.name})`,
        );
        return bonuses;
      }

      const bonus = await this.prisma.bonus.create({
        data: {
          memberId: record.cultivator.recommenderId,
          bonusType: BonusType.LICENSE_MANAGEMENT,
          amount,
          description: `판권 관리 보너스 (추천계보) - ${record.cultivator.name}님이 ${record.cultivatedMember.name}님 ${this.getGradeKorean(record.achievedGrade)} 육성`,
          weekCode,
          status: 'PENDING',
        },
      });
      bonuses.push(bonus);
    }

    return bonuses;
  }

  /**
   * 공유 보너스 계산 (SHARING)
   * 조건: 매니저 이상 등급의 회원이 일정 조건 충족 시 20,000원 지급
   * 인정매출: 유효 등급(실제 등급 또는 인정 등급 중 높은 것) 기준으로 자격 판단
   *
   * @param memberId 회원 ID
   * @param weekCode 주차 코드
   * @returns 생성된 보너스 레코드
   */
  async calculateSharingBonus(memberId: number, weekCode: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new Error(`Member with ID ${memberId} not found`);
    }

    // 유효 등급 조회 (인정매출 반영)
    const effectiveGrade = await this.getEffectiveGrade(memberId);

    // 매니저 이상만 자격 (유효 등급 기준)
    const eligibleGrades: MemberGrade[] = [
      MemberGrade.MANAGER,
      MemberGrade.BRANCH_CHIEF,
      MemberGrade.DIVISION_CHIEF,
    ];

    if (!eligibleGrades.includes(effectiveGrade)) {
      throw new Error('공유 보너스는 매니저 이상만 받을 수 있습니다 (인정 등급 포함)');
    }

    // DB에서 활성 수당률 설정 조회 (fallback: 20,000원)
    const rateConfig = await this.commissionRatesService.findActiveByBonusType(BonusType.SHARING);
    const amount = rateConfig?.baseAmount || 20000;

    const bonus = await this.prisma.bonus.create({
      data: {
        memberId,
        bonusType: BonusType.SHARING,
        amount,
        description: '공유 보너스',
        weekCode,
        status: 'PENDING',
      },
    });

    return bonus;
  }

  /**
   * 지점 운영 보너스 계산 (BRANCH_OPERATION) - 세미나 기반 (레거시)
   * 조건: 세미나 개최 및 승인 시 50,000원 지급
   *
   * @param seminarId 세미나 ID
   * @returns 생성된 보너스 레코드
   */
  async calculateBranchOperationBonus(seminarId: number) {
    const seminar = await this.prisma.seminar.findUnique({
      where: { id: seminarId },
      include: { host: true },
    });

    if (!seminar) {
      throw new Error(`Seminar with ID ${seminarId} not found`);
    }

    if (!seminar.isApproved) {
      throw new Error('승인되지 않은 세미나입니다');
    }

    // ✅ ADMIN은 지점 운영 보너스를 받을 수 없음
    if (seminar.host.grade === MemberGrade.ADMIN) {
      this.logger.log(
        `ADMIN 계정은 지점 운영 보너스를 받을 수 없습니다. (세미나 주최자: ${seminar.host.name})`,
      );
      return null;
    }

    const weekCode = this.getWeekCode(seminar.heldAt);

    // DB에서 활성 수당률 설정 조회 (fallback: 50,000원)
    const rateConfig = await this.commissionRatesService.findActiveByBonusType(
      BonusType.BRANCH_OPERATION,
    );
    const amount = rateConfig?.baseAmount || 50000;

    const bonus = await this.prisma.bonus.create({
      data: {
        memberId: seminar.hostId,
        seminarId: seminar.id,
        bonusType: BonusType.BRANCH_OPERATION,
        amount,
        description: `지점 운영 보너스 - 세미나: ${seminar.title}`,
        weekCode,
        status: 'PENDING',
      },
    });

    return bonus;
  }

  /**
   * 센터 운영 보너스 계산 (BRANCH_OPERATION) - 판매 기반
   * 조건: 센터 소속 회원이 매출 발생 시 센터에 보너스 지급
   *
   * 동작 방식:
   * - 판매자의 centerName으로 해당 센터(CENTER 등급 회원) 찾기
   * - 수당 설정의 centerBonusMode에 따라 건별/월별 지급
   *
   * @param saleId 판매 ID
   * @returns 생성된 보너스 레코드 (없으면 null)
   */
  async calculateCenterOperationBonus(saleId: number): Promise<Bonus | null> {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { seller: true },
    });

    if (!sale) {
      this.logger.warn(`센터 운영 보너스: 판매 ID ${saleId}를 찾을 수 없음`);
      return null;
    }

    // 판매자의 센터명 확인
    const sellerCenterName = sale.seller.centerName;
    if (!sellerCenterName) {
      this.logger.debug(`판매자 ID ${sale.sellerId}는 센터에 소속되지 않음`);
      return null;
    }

    // 해당 센터(CENTER 등급 회원) 찾기
    const center = await this.prisma.member.findFirst({
      where: {
        grade: MemberGrade.CENTER,
        name: sellerCenterName,
        isActive: true,
      },
    });

    if (!center) {
      this.logger.debug(`센터 "${sellerCenterName}"를 찾을 수 없음`);
      return null;
    }

    // 수당률 설정 확인
    const rateConfig = await this.commissionRatesService.findActiveByBonusType(
      BonusType.BRANCH_OPERATION,
    );

    if (!rateConfig?.isActive) {
      this.logger.debug('센터 운영 보너스 설정이 활성화되지 않음');
      return null;
    }

    const centerBonusMode = rateConfig.centerBonusMode || CenterBonusMode.PER_SALE;
    const weekCode = this.getWeekCode(sale.soldAt);

    // 월별 모드인 경우 이번 달 중복 체크 (날짜 범위 비교)
    if (centerBonusMode === CenterBonusMode.MONTHLY) {
      const monthCode = this.getMonthCode(sale.soldAt);
      const monthStart = new Date(sale.soldAt.getFullYear(), sale.soldAt.getMonth(), 1);
      const monthEnd = new Date(sale.soldAt.getFullYear(), sale.soldAt.getMonth() + 1, 0, 23, 59, 59, 999);

      const existing = await this.prisma.bonus.findFirst({
        where: {
          memberId: center.id,
          bonusType: BonusType.BRANCH_OPERATION,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      if (existing) {
        this.logger.debug(
          `센터 "${center.name}": 이번 달(${monthCode}) 보너스 이미 지급됨 (ID: ${existing.id})`,
        );
        return null;
      }
    }

    const amount = rateConfig.baseAmount || 50000;

    const bonus = await this.prisma.bonus.create({
      data: {
        memberId: center.id,
        saleId: sale.id,
        bonusType: BonusType.BRANCH_OPERATION,
        amount,
        description: `센터 운영 보너스 - ${sale.seller.name}님 매출`,
        weekCode,
        status: 'PENDING',
        calculationBasis: JSON.stringify({
          sellerId: sale.sellerId,
          sellerName: sale.seller.name,
          centerName: center.name,
          mode: centerBonusMode,
          saleCode: sale.saleCode,
        }),
      },
    });

    this.logger.log(
      `센터 운영 보너스 생성: 센터 "${center.name}" ← ${sale.seller.name}님 매출 (${amount.toLocaleString()}원, ${centerBonusMode})`,
    );

    return bonus;
  }

  /**
   * 날짜를 월 코드로 변환 (예: "2025-01")
   */
  private getMonthCode(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * 판매 발생 시 모든 관련 보너스 자동 계산
   *
   * @param saleId 판매 ID
   * @returns 생성된 모든 보너스 레코드
   */
  async processSaleBonuses(saleId: number) {
    const bonuses: Bonus[] = [];

    // ✅ 인정매출 여부 확인 - 인정매출은 보너스 계산에서 제외
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      select: { isRecognizedSale: true, saleCode: true },
    });

    if (sale?.isRecognizedSale) {
      this.logger.log(`인정매출(ID: ${saleId}, ${sale.saleCode})은 보너스 계산에서 제외됩니다.`);
      return [];
    }

    try {
      // 1. 판매 보너스 (판매자)
      const salesBonus = await this.calculateSalesBonus(saleId);
      if (salesBonus) {
        bonuses.push(salesBonus);
      }

      // 2. 판매 관리 보너스 (상위 회원)
      const managementBonuses = await this.calculateSalesManagementBonus(saleId);
      bonuses.push(...managementBonuses);

      // 3. 센터 운영 보너스 (센터 소속 회원 매출 시)
      const centerBonus = await this.calculateCenterOperationBonus(saleId);
      if (centerBonus) {
        bonuses.push(centerBonus);
      }

      return bonuses;
    } catch (error) {
      console.error('Error processing sale bonuses:', error);
      throw error;
    }
  }

  /**
   * 판매 보너스 계산 (트랜잭션 컨텍스트 전용)
   * ✅ 외부 트랜잭션 내에서 호출 시 사용
   *
   * @param tx Prisma 트랜잭션 컨텍스트
   * @param saleId 판매 ID
   * @returns 생성된 모든 보너스 레코드
   */
  async processSaleBonusesInTx(
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
    saleId: number,
  ): Promise<Bonus[]> {
    const bonuses: Bonus[] = [];

    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      include: {
        seller: {
          include: { sponsor: true },
        },
      },
    });

    if (!sale) {
      throw new Error(`Sale with ID ${saleId} not found`);
    }

    // 1. 판매 보너스 (판매자)
    if (sale.seller.grade !== MemberGrade.ADMIN) {
      const weekCode = this.getWeekCode(sale.soldAt);
      const rateConfig = await this.commissionRatesService.findActiveByBonusType(BonusType.SALES);
      const amount = rateConfig?.baseAmount || 500000;

      const salesBonus = await tx.bonus.create({
        data: {
          memberId: sale.sellerId,
          saleId: sale.id,
          bonusType: BonusType.SALES,
          amount,
          description: `판매 보너스 - 판매코드: ${sale.saleCode}`,
          weekCode,
          status: 'PENDING',
        },
      });
      bonuses.push(salesBonus);
    }

    // 2. 판매 관리 보너스 (후원계보 상위 회원)
    if (sale.seller.sponsorId && sale.seller.sponsor) {
      if (sale.seller.sponsor.grade !== MemberGrade.ADMIN) {
        const weekCode = this.getWeekCode(sale.soldAt);
        const rateConfig = await this.commissionRatesService.findActiveByBonusType(
          BonusType.SALES_MANAGEMENT,
        );
        const amount = rateConfig?.baseAmount || 150000;

        const managementBonus = await tx.bonus.create({
          data: {
            memberId: sale.seller.sponsorId,
            saleId: sale.id,
            bonusType: BonusType.SALES_MANAGEMENT,
            amount,
            description: `판매 관리 보너스 (후원계보) - 판매자: ${sale.seller.name}`,
            weekCode,
            status: 'PENDING',
          },
        });
        bonuses.push(managementBonus);
      }
    }

    return bonuses;
  }

  /**
   * 날짜를 주차 코드로 변환 (예: "2025-W01")
   */
  private getWeekCode(date: Date): string {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  /**
   * 등급을 한글로 변환
   */
  private getGradeKorean(grade: MemberGrade): string {
    const gradeNames = {
      [MemberGrade.MEMBER]: '회원',
      [MemberGrade.AGENT]: '에이전트',
      [MemberGrade.MANAGER]: '매니저',
      [MemberGrade.BRANCH_CHIEF]: '지부장',
      [MemberGrade.DIVISION_CHIEF]: '본부장',
      [MemberGrade.CENTER]: '센터',
      [MemberGrade.ADMIN]: '관리자',
    };
    return gradeNames[grade] || grade;
  }

  /**
   * 보너스 유형을 한글로 변환
   */
  private getBonusTypeKorean(type: BonusType): string {
    const typeNames = {
      [BonusType.SALES]: '판매 보너스',
      [BonusType.SALES_MANAGEMENT]: '판매 관리 보너스',
      [BonusType.LICENSE]: '판권 보너스',
      [BonusType.LICENSE_MANAGEMENT]: '판권 관리 보너스',
      [BonusType.SHARING]: '공유 보너스',
      [BonusType.BRANCH_OPERATION]: '센터 운영 보너스',
    };
    return typeNames[type] || type;
  }

  /**
   * 판매 보너스 미리보기 (실제 생성 없이 계산만)
   * 판매 등록 전 예상 보너스 금액을 보여줌
   *
   * @param sellerId 판매자 ID
   * @param productId 제품 ID
   * @param quantity 수량
   * @returns 예상 보너스 목록
   */
  async previewSaleBonuses(sellerId: number, productId: number, quantity: number): Promise<{
    totalPrice: number;
    totalPv: number;
    bonuses: Array<{
      type: string;
      typeKorean: string;
      recipientId: number;
      recipientName: string;
      amount: number;
      description: string;
    }>;
    totalBonus: number;
  }> {
    // 판매자 조회
    const seller = await this.prisma.member.findUnique({
      where: { id: sellerId },
      include: {
        sponsor: true,
      },
    });

    if (!seller) {
      throw new Error(`판매자 ID ${sellerId}를 찾을 수 없습니다.`);
    }

    // 제품 조회
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`제품 ID ${productId}를 찾을 수 없습니다.`);
    }

    const totalPrice = product.price * quantity;
    const totalPv = product.pv * quantity;
    const bonuses: Array<{
      type: string;
      typeKorean: string;
      recipientId: number;
      recipientName: string;
      amount: number;
      description: string;
    }> = [];

    // 1. 판매 보너스 (판매자 본인) - ADMIN 제외
    if (seller.grade !== MemberGrade.ADMIN) {
      const salesRateConfig = await this.commissionRatesService.findActiveByBonusType(BonusType.SALES);
      const salesAmount = salesRateConfig?.baseAmount || 500000;

      bonuses.push({
        type: BonusType.SALES,
        typeKorean: this.getBonusTypeKorean(BonusType.SALES),
        recipientId: seller.id,
        recipientName: seller.name,
        amount: salesAmount,
        description: `직접 판매에 대한 보너스 (${this.getGradeKorean(seller.grade)})`,
      });
    }

    // 2. 판매 관리 보너스 (후원계보 상위 회원) - ADMIN 제외
    if (seller.sponsorId && seller.sponsor && seller.sponsor.grade !== MemberGrade.ADMIN) {
      const managementRateConfig = await this.commissionRatesService.findActiveByBonusType(
        BonusType.SALES_MANAGEMENT,
      );
      const managementAmount = managementRateConfig?.baseAmount || 150000;

      bonuses.push({
        type: BonusType.SALES_MANAGEMENT,
        typeKorean: this.getBonusTypeKorean(BonusType.SALES_MANAGEMENT),
        recipientId: seller.sponsor.id,
        recipientName: seller.sponsor.name,
        amount: managementAmount,
        description: `후원계보 하위 회원(${seller.name}) 판매에 대한 관리 보너스`,
      });
    }

    // 3. 센터 운영 보너스 (센터 소속 회원 매출 시) - ADMIN 제외
    if (seller.centerName) {
      const center = await this.prisma.member.findFirst({
        where: {
          grade: MemberGrade.CENTER,
          name: seller.centerName,
          isActive: true,
        },
      });

      if (center) {
        const centerRateConfig = await this.commissionRatesService.findActiveByBonusType(
          BonusType.BRANCH_OPERATION,
        );

        if (centerRateConfig?.isActive) {
          const centerAmount = centerRateConfig.baseAmount || 50000;

          bonuses.push({
            type: BonusType.BRANCH_OPERATION,
            typeKorean: this.getBonusTypeKorean(BonusType.BRANCH_OPERATION),
            recipientId: center.id,
            recipientName: center.name,
            amount: centerAmount,
            description: `소속 회원(${seller.name}) 매출에 대한 센터 운영 보너스`,
          });
        }
      }
    }

    const totalBonus = bonuses.reduce((sum, b) => sum + b.amount, 0);

    return {
      totalPrice,
      totalPv,
      bonuses,
      totalBonus,
    };
  }
}
