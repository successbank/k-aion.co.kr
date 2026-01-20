import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenealogyService } from '../../members/genealogy.service';
import { CommissionRatesService } from '../../commission-rates/commission-rates.service';
import { RecognizedSalesService } from '../../recognized-sales/recognized-sales.service';
import { BonusType, MemberGrade } from '@prisma/client';
import {
  BonusSimulationRequestDto,
  BonusSimulationResponseDto,
  SimulatedBonus,
  TeamQualificationResponseDto,
  QualificationCheck,
  CommissionRateSummaryDto,
} from '../dto/bonus-simulation.dto';

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

// 등급 한글명
const GRADE_NAMES: Record<MemberGrade, string> = {
  [MemberGrade.MEMBER]: '회원',
  [MemberGrade.AGENT]: '에이전트',
  [MemberGrade.MANAGER]: '매니저',
  [MemberGrade.BRANCH_CHIEF]: '지부장',
  [MemberGrade.DIVISION_CHIEF]: '본부장',
  [MemberGrade.CENTER]: '센터',
  [MemberGrade.ADMIN]: '관리자',
};

// 보너스 타입 한글명
const BONUS_TYPE_NAMES: Record<BonusType, string> = {
  [BonusType.SALES]: '판매 보너스',
  [BonusType.SALES_MANAGEMENT]: '판매 관리 보너스',
  [BonusType.LICENSE]: '판권 보너스',
  [BonusType.LICENSE_MANAGEMENT]: '판권 관리 보너스',
  [BonusType.SHARING]: '공유 보너스',
  [BonusType.BRANCH_OPERATION]: '센터 운영 보너스',
};

/**
 * 보너스 시뮬레이션 서비스
 * 실제 DB 저장 없이 보너스 계산 결과를 미리 확인
 */
@Injectable()
export class BonusSimulatorService {
  private readonly logger = new Logger(BonusSimulatorService.name);

  constructor(
    private prisma: PrismaService,
    private genealogyService: GenealogyService,
    private commissionRatesService: CommissionRatesService,
    private recognizedSalesService: RecognizedSalesService,
  ) {}

  /**
   * 판매 시뮬레이션 - 6가지 보너스 계산
   */
  async simulateSale(dto: BonusSimulationRequestDto): Promise<BonusSimulationResponseDto> {
    // 1. 판매자 정보 조회
    const seller = await this.prisma.member.findUnique({
      where: { id: dto.sellerId },
      include: {
        sponsor: true,
        recommender: true,
      },
    });

    if (!seller) {
      throw new NotFoundException(`판매자 ID ${dto.sellerId}를 찾을 수 없습니다`);
    }

    // 2. 제품 정보 조회
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`제품 ID ${dto.productId}를 찾을 수 없습니다`);
    }

    // 3. 유효 등급 조회 (인정매출 반영)
    const effectiveGrade = await this.recognizedSalesService.getEffectiveGrade(dto.sellerId);

    // 4. 6가지 보너스 시뮬레이션
    const bonuses: SimulatedBonus[] = [];

    // 4.1 판매 보너스 (SALES)
    bonuses.push(await this.simulateSalesBonus(seller));

    // 4.2 판매 관리 보너스 (SALES_MANAGEMENT)
    bonuses.push(await this.simulateSalesManagementBonus(seller));

    // 4.3 판권 보너스 (LICENSE) - 판매 시뮬레이션에서는 해당 없음 (육성 시 발생)
    bonuses.push({
      type: BonusType.LICENSE,
      typeName: BONUS_TYPE_NAMES[BonusType.LICENSE],
      recipient: null,
      amount: 0,
      qualified: false,
      qualificationReason: '판권 보너스는 하위 회원 승급 시 발생 (판매 시 해당 없음)',
    });

    // 4.4 판권 관리 보너스 (LICENSE_MANAGEMENT) - 판매 시뮬레이션에서는 해당 없음
    bonuses.push({
      type: BonusType.LICENSE_MANAGEMENT,
      typeName: BONUS_TYPE_NAMES[BonusType.LICENSE_MANAGEMENT],
      recipient: null,
      amount: 0,
      qualified: false,
      qualificationReason: '판권 관리 보너스는 하위 회원 육성 시 발생 (판매 시 해당 없음)',
    });

    // 4.5 공유 보너스 (SHARING)
    bonuses.push(await this.simulateSharingBonus(seller, effectiveGrade));

    // 4.6 센터 운영 보너스 (BRANCH_OPERATION) - 센터 소속 회원 매출 시 발생
    bonuses.push(await this.simulateCenterOperationBonus(seller));

    // 5. 총 보너스 계산
    const totalBonus = bonuses.reduce((sum, b) => sum + b.amount, 0);

    return {
      seller: {
        id: seller.id,
        name: seller.name,
        username: seller.username,
        actualGrade: seller.grade,
        effectiveGrade,
        cumulativePv: seller.cumulativePv,
      },
      product: {
        id: product.id,
        name: product.name,
        code: product.code,
        price: product.price,
        pv: product.pv,
      },
      quantity: dto.quantity,
      totalPrice: product.price * dto.quantity,
      totalPv: product.pv * dto.quantity,
      bonuses,
      totalBonus,
    };
  }

  /**
   * 판매 보너스 시뮬레이션
   */
  private async simulateSalesBonus(
    seller: any,
  ): Promise<SimulatedBonus> {
    // ADMIN은 보너스 수령 불가
    if (seller.grade === MemberGrade.ADMIN) {
      return {
        type: BonusType.SALES,
        typeName: BONUS_TYPE_NAMES[BonusType.SALES],
        recipient: null,
        amount: 0,
        qualified: false,
        qualificationReason: 'ADMIN 계정은 판매 보너스를 받을 수 없습니다',
      };
    }

    const rateConfig = await this.commissionRatesService.findActiveByBonusType(BonusType.SALES);
    const amount = rateConfig?.baseAmount || 500000;

    return {
      type: BonusType.SALES,
      typeName: BONUS_TYPE_NAMES[BonusType.SALES],
      recipient: {
        id: seller.id,
        name: seller.name,
        grade: seller.grade,
        relation: '본인 (판매자)',
      },
      amount,
      qualified: true,
    };
  }

  /**
   * 판매 관리 보너스 시뮬레이션
   */
  private async simulateSalesManagementBonus(
    seller: any,
  ): Promise<SimulatedBonus> {
    // 후원인이 없는 경우
    if (!seller.sponsorId || !seller.sponsor) {
      return {
        type: BonusType.SALES_MANAGEMENT,
        typeName: BONUS_TYPE_NAMES[BonusType.SALES_MANAGEMENT],
        recipient: null,
        amount: 0,
        qualified: false,
        qualificationReason: '후원인이 없습니다',
      };
    }

    // 후원인이 ADMIN인 경우
    if (seller.sponsor.grade === MemberGrade.ADMIN) {
      return {
        type: BonusType.SALES_MANAGEMENT,
        typeName: BONUS_TYPE_NAMES[BonusType.SALES_MANAGEMENT],
        recipient: null,
        amount: 0,
        qualified: false,
        qualificationReason: 'ADMIN 계정은 판매 관리 보너스를 받을 수 없습니다',
      };
    }

    const rateConfig = await this.commissionRatesService.findActiveByBonusType(
      BonusType.SALES_MANAGEMENT,
    );
    const amount = rateConfig?.baseAmount || 150000;

    return {
      type: BonusType.SALES_MANAGEMENT,
      typeName: BONUS_TYPE_NAMES[BonusType.SALES_MANAGEMENT],
      recipient: {
        id: seller.sponsor.id,
        name: seller.sponsor.name,
        grade: seller.sponsor.grade,
        relation: '후원인',
      },
      amount,
      qualified: true,
    };
  }

  /**
   * 공유 보너스 시뮬레이션
   */
  private async simulateSharingBonus(
    seller: any,
    effectiveGrade: MemberGrade,
  ): Promise<SimulatedBonus> {
    const eligibleGrades: MemberGrade[] = [
      MemberGrade.MANAGER,
      MemberGrade.BRANCH_CHIEF,
      MemberGrade.DIVISION_CHIEF,
    ];

    if (!eligibleGrades.includes(effectiveGrade)) {
      return {
        type: BonusType.SHARING,
        typeName: BONUS_TYPE_NAMES[BonusType.SHARING],
        recipient: null,
        amount: 0,
        qualified: false,
        qualificationReason: `공유 보너스는 매니저 이상만 받을 수 있습니다 (현재 유효 등급: ${GRADE_NAMES[effectiveGrade]})`,
      };
    }

    const rateConfig = await this.commissionRatesService.findActiveByBonusType(BonusType.SHARING);
    const amount = rateConfig?.baseAmount || 20000;

    return {
      type: BonusType.SHARING,
      typeName: BONUS_TYPE_NAMES[BonusType.SHARING],
      recipient: {
        id: seller.id,
        name: seller.name,
        grade: seller.grade,
        relation: '본인',
      },
      amount,
      qualified: true,
    };
  }

  /**
   * 센터 운영 보너스 시뮬레이션
   * 센터 소속 회원이 판매할 때 해당 센터에 지급되는 보너스
   */
  private async simulateCenterOperationBonus(
    seller: any,
  ): Promise<SimulatedBonus> {
    // 판매자의 센터 소속 확인
    if (!seller.centerName) {
      return {
        type: BonusType.BRANCH_OPERATION,
        typeName: BONUS_TYPE_NAMES[BonusType.BRANCH_OPERATION],
        recipient: null,
        amount: 0,
        qualified: false,
        qualificationReason: '판매자가 센터에 소속되어 있지 않습니다',
      };
    }

    // 센터 조회
    const center = await this.prisma.member.findFirst({
      where: {
        grade: MemberGrade.CENTER,
        name: seller.centerName,
        isActive: true,
      },
    });

    if (!center) {
      return {
        type: BonusType.BRANCH_OPERATION,
        typeName: BONUS_TYPE_NAMES[BonusType.BRANCH_OPERATION],
        recipient: null,
        amount: 0,
        qualified: false,
        qualificationReason: `센터 "${seller.centerName}"를 찾을 수 없습니다`,
      };
    }

    // 수당률 설정 확인
    const rateConfig = await this.commissionRatesService.findActiveByBonusType(
      BonusType.BRANCH_OPERATION,
    );

    if (!rateConfig?.isActive) {
      return {
        type: BonusType.BRANCH_OPERATION,
        typeName: BONUS_TYPE_NAMES[BonusType.BRANCH_OPERATION],
        recipient: null,
        amount: 0,
        qualified: false,
        qualificationReason: '센터 운영 보너스 설정이 비활성화 상태입니다',
      };
    }

    const amount = rateConfig.baseAmount || 50000;

    return {
      type: BonusType.BRANCH_OPERATION,
      typeName: BONUS_TYPE_NAMES[BonusType.BRANCH_OPERATION],
      recipient: {
        id: center.id,
        name: center.name,
        grade: center.grade,
        relation: `소속 센터`,
      },
      amount,
      qualified: true,
      qualificationReason: `센터 "${center.name}" 소속 회원 매출로 지급`,
    };
  }

  /**
   * 팀 자격 조건 조회
   */
  async getTeamQualification(memberId: number): Promise<TeamQualificationResponseDto> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException(`회원 ID ${memberId}를 찾을 수 없습니다`);
    }

    // 유효 등급 조회
    const effectiveGrade = await this.recognizedSalesService.getEffectiveGrade(memberId);

    // 팀 통계 조회
    const stats = await this.genealogyService.getTeamGradeStatisticsForQualification(memberId);

    // 자격 조건 체크
    const qualifications = {
      managerCultivation: this.checkManagerQualification(stats),
      branchChiefCultivation: this.checkBranchChiefQualification(stats),
      divisionChiefCultivation: this.checkDivisionChiefQualification(stats),
    };

    return {
      memberId,
      memberName: member.name,
      memberGrade: member.grade,
      effectiveGrade,
      teamStats: {
        teams: stats.teams.map((t) => ({
          ...t,
          totalCount:
            t.agentCount + t.managerCount + t.branchChiefCount + t.divisionChiefCount,
        })),
        totals: {
          ...stats.totals,
          totalCount:
            stats.totals.agentCount +
            stats.totals.managerCount +
            stats.totals.branchChiefCount +
            stats.totals.divisionChiefCount,
        },
      },
      qualifications,
    };
  }

  /**
   * 매니저 육성 자격 체크
   */
  private checkManagerQualification(stats: any): QualificationCheck {
    const activeTeamCount = stats.teams.filter(
      (t: any) => t.agentCount + t.managerCount + t.branchChiefCount + t.divisionChiefCount > 0,
    ).length;

    const hasThreeTeams = activeTeamCount >= 3;
    const has15Agents = stats.totals.agentCount >= 15;

    return {
      targetGrade: MemberGrade.MANAGER,
      required: '3팀 에이전트 합 15명 이상',
      current: `${activeTeamCount}팀, 에이전트 ${stats.totals.agentCount}명`,
      qualified: hasThreeTeams && has15Agents,
      details: !hasThreeTeams
        ? `3팀 필요 (현재 ${activeTeamCount}팀)`
        : !has15Agents
          ? `에이전트 15명 필요 (현재 ${stats.totals.agentCount}명)`
          : undefined,
    };
  }

  /**
   * 지부장 육성 자격 체크
   */
  private checkBranchChiefQualification(stats: any): QualificationCheck {
    const teamsWithManager = stats.teams.filter((t: any) => t.managerCount >= 1).length;
    const totalManagers = stats.totals.managerCount;

    const hasManagerInEachTeam = teamsWithManager >= 3;
    const has4Managers = totalManagers >= 4;

    return {
      targetGrade: MemberGrade.BRANCH_CHIEF,
      required: '3팀 각팀 매니저 1명 이상 + 합 4명 이상',
      current: `매니저 보유팀 ${teamsWithManager}팀, 매니저 합 ${totalManagers}명`,
      qualified: hasManagerInEachTeam && has4Managers,
      details: !hasManagerInEachTeam
        ? `3팀 각팀 매니저 필요 (현재 ${teamsWithManager}팀에 매니저 있음)`
        : !has4Managers
          ? `매니저 합 4명 필요 (현재 ${totalManagers}명)`
          : undefined,
    };
  }

  /**
   * 본부장 육성 자격 체크
   */
  private checkDivisionChiefQualification(stats: any): QualificationCheck {
    const teamsWithBranchChief = stats.teams.filter((t: any) => t.branchChiefCount >= 1).length;
    const totalBranchChiefs = stats.totals.branchChiefCount;

    const hasBranchChiefInEachTeam = teamsWithBranchChief >= 3;
    const has5BranchChiefs = totalBranchChiefs >= 5;

    return {
      targetGrade: MemberGrade.DIVISION_CHIEF,
      required: '3팀 각팀 지부장 1명 이상 + 합 5명 이상',
      current: `지부장 보유팀 ${teamsWithBranchChief}팀, 지부장 합 ${totalBranchChiefs}명`,
      qualified: hasBranchChiefInEachTeam && has5BranchChiefs,
      details: !hasBranchChiefInEachTeam
        ? `3팀 각팀 지부장 필요 (현재 ${teamsWithBranchChief}팀에 지부장 있음)`
        : !has5BranchChiefs
          ? `지부장 합 5명 필요 (현재 ${totalBranchChiefs}명)`
          : undefined,
    };
  }

  /**
   * 활성 수당률 요약 조회
   */
  async getCommissionRateSummary(): Promise<CommissionRateSummaryDto> {
    const bonusTypes: BonusType[] = [
      BonusType.SALES,
      BonusType.SALES_MANAGEMENT,
      BonusType.LICENSE,
      BonusType.LICENSE_MANAGEMENT,
      BonusType.SHARING,
      BonusType.BRANCH_OPERATION,
    ];

    const rates = await Promise.all(
      bonusTypes.map(async (type) => {
        const config = await this.commissionRatesService.findActiveByBonusType(type);

        return {
          bonusType: type,
          bonusTypeName: BONUS_TYPE_NAMES[type],
          isGradeTiered: config?.isGradeTiered || false,
          baseAmount: config?.baseAmount || this.getDefaultAmount(type),
          tiers: config?.isGradeTiered && config.tiers
            ? config.tiers.map((t) => ({
                grade: t.applicableGrade,
                gradeName: GRADE_NAMES[t.applicableGrade],
                amount: t.amount || 0,
              }))
            : undefined,
          description: config?.description || this.getDefaultDescription(type),
        };
      }),
    );

    return { rates };
  }

  /**
   * 기본 보너스 금액 (수당률 설정 없을 때)
   */
  private getDefaultAmount(type: BonusType): number {
    const defaults: Record<BonusType, number> = {
      [BonusType.SALES]: 500000,
      [BonusType.SALES_MANAGEMENT]: 150000,
      [BonusType.LICENSE]: 100000,
      [BonusType.LICENSE_MANAGEMENT]: 30000,
      [BonusType.SHARING]: 20000,
      [BonusType.BRANCH_OPERATION]: 50000,
    };
    return defaults[type] || 0;
  }

  /**
   * 기본 보너스 설명
   */
  private getDefaultDescription(type: BonusType): string {
    const descriptions: Record<BonusType, string> = {
      [BonusType.SALES]: '본인이 직접 판매 시 지급',
      [BonusType.SALES_MANAGEMENT]: '후원계보 상위 회원에게 지급',
      [BonusType.LICENSE]: '하위 회원 승급 시 등급별 차등 지급',
      [BonusType.LICENSE_MANAGEMENT]: '추천계보 상위 회원에게 지급',
      [BonusType.SHARING]: '매니저 이상 등급에게 지급',
      [BonusType.BRANCH_OPERATION]: '세미나 개최 및 승인 시 지급',
    };
    return descriptions[type] || '';
  }
}
