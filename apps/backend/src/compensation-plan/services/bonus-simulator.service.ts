import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenealogyService } from '../../members/genealogy.service';
import { BonusType, MemberGrade } from '@prisma/client';
import {
  BonusSimulationRequestDto,
  BonusSimulationResponseDto,
  SimulatedBonus,
  TeamQualificationResponseDto,
  QualificationCheck,
  CommissionRateSummaryDto,
} from '../dto/bonus-simulation.dto';

// 등급 계층 순서 (신규 등급 체계, 낮은 인덱스 = 높은 등급)
const GRADE_ORDER: MemberGrade[] = [
  MemberGrade.ADMIN,
  MemberGrade.CENTER,
  MemberGrade.BRANCH_MANAGER,
  MemberGrade.TEAM_LEADER,
  MemberGrade.SALESPERSON,
];

// 등급 한글명 (신규 등급 체계)
const GRADE_NAMES: Record<MemberGrade, string> = {
  [MemberGrade.SALESPERSON]: '판매원',
  [MemberGrade.TEAM_LEADER]: '팀장',
  [MemberGrade.BRANCH_MANAGER]: '지사장',
  [MemberGrade.CENTER]: '센터',
  [MemberGrade.ADMIN]: '관리자',
};

// 보너스 타입 한글명 (신규 수당 체계)
const BONUS_TYPE_NAMES: Record<BonusType, string> = {
  [BonusType.SALES_COMMISSION]: '판매 수수료',
  [BonusType.EDUCATION_MANAGEMENT]: '교육 관리 수수료',
};

/**
 * 보너스 시뮬레이션 서비스 (신규 수당 체계)
 * 실제 DB 저장 없이 보너스 계산 결과를 미리 확인
 *
 * 신규 수당 체계:
 * - SALES_COMMISSION: 판매 수수료 (판매원, 팀장)
 * - EDUCATION_MANAGEMENT: 교육 관리 수수료 (지사장, 센터)
 *
 * 제품별 고정 수당율 (ProductCommissionRate 테이블 참조)
 */
@Injectable()
export class BonusSimulatorService {
  private readonly logger = new Logger(BonusSimulatorService.name);

  constructor(
    private prisma: PrismaService,
    private genealogyService: GenealogyService,
  ) {}

  /**
   * 판매 시뮬레이션 - 신규 수당 체계
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

    // 3. 보너스 시뮬레이션
    const bonuses: SimulatedBonus[] = [];

    // 3.1 본인 수수료
    const sellerBonus = await this.simulateSellerBonus(seller, product.id);
    if (sellerBonus) {
      bonuses.push(sellerBonus);
    }

    // 3.2 상위 라인 수수료 (추천계보)
    const uplineBonuses = await this.simulateUplineBonuses(seller.id, product.id);
    bonuses.push(...uplineBonuses);

    // 4. 총 보너스 계산
    const totalBonus = bonuses.reduce((sum, b) => sum + b.amount, 0);

    return {
      seller: {
        id: seller.id,
        name: seller.name,
        username: seller.username,
        actualGrade: seller.grade,
        effectiveGrade: seller.grade,
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
      totalBonus: totalBonus * dto.quantity,
    };
  }

  /**
   * 판매자 본인 수수료 시뮬레이션
   */
  private async simulateSellerBonus(
    seller: any,
    productId: number,
  ): Promise<SimulatedBonus | null> {
    // ADMIN은 보너스 수령 불가
    if (seller.grade === MemberGrade.ADMIN) {
      return null;
    }

    // 제품별 등급별 수당 조회
    const rate = await this.prisma.productCommissionRate.findUnique({
      where: {
        productId_recipientGrade: {
          productId,
          recipientGrade: seller.grade,
        },
      },
    });

    if (!rate || rate.amount === 0) {
      return null;
    }

    const bonusType = this.getBonusTypeForGrade(seller.grade);

    return {
      type: bonusType,
      typeName: BONUS_TYPE_NAMES[bonusType],
      recipient: {
        id: seller.id,
        name: seller.name,
        grade: seller.grade,
        relation: '본인 (판매자)',
      },
      amount: rate.amount,
      qualified: true,
    };
  }

  /**
   * 상위 라인 수수료 시뮬레이션 (추천계보)
   */
  private async simulateUplineBonuses(
    sellerId: number,
    productId: number,
  ): Promise<SimulatedBonus[]> {
    const bonuses: SimulatedBonus[] = [];
    const upline = await this.genealogyService.getUpline(sellerId, 100, 'recommender');

    for (const ancestor of upline) {
      // ADMIN은 수수료 대상 제외
      if (ancestor.grade === MemberGrade.ADMIN) continue;
      // 판매원은 자신의 직접 판매만 수수료 대상
      if (ancestor.grade === MemberGrade.SALESPERSON) continue;

      const rate = await this.prisma.productCommissionRate.findUnique({
        where: {
          productId_recipientGrade: {
            productId,
            recipientGrade: ancestor.grade,
          },
        },
      });

      if (rate && rate.amount > 0) {
        const bonusType = this.getBonusTypeForGrade(ancestor.grade);
        bonuses.push({
          type: bonusType,
          typeName: BONUS_TYPE_NAMES[bonusType],
          recipient: {
            id: ancestor.id,
            name: ancestor.name,
            grade: ancestor.grade,
            relation: `상위 ${ancestor.level}단계`,
          },
          amount: rate.amount,
          qualified: true,
        });
      }
    }

    return bonuses;
  }

  /**
   * 등급에 따른 보너스 유형 결정
   */
  private getBonusTypeForGrade(grade: MemberGrade): BonusType {
    // 판매원, 팀장 → SALES_COMMISSION
    // 지사장, 센터 → EDUCATION_MANAGEMENT
    if (grade === MemberGrade.SALESPERSON || grade === MemberGrade.TEAM_LEADER) {
      return BonusType.SALES_COMMISSION;
    }
    return BonusType.EDUCATION_MANAGEMENT;
  }

  /**
   * 팀 자격 조건 조회 (신규 등급 체계)
   */
  async getTeamQualification(memberId: number): Promise<TeamQualificationResponseDto> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException(`회원 ID ${memberId}를 찾을 수 없습니다`);
    }

    // 팀 통계 조회
    const stats = await this.genealogyService.getTeamGradeStatisticsForQualification(memberId);

    // 자격 조건 체크 (신규 등급 체계)
    const qualifications = {
      teamLeaderPromotion: this.checkTeamLeaderQualification(stats),
      branchManagerPromotion: this.checkBranchManagerQualification(stats),
    };

    return {
      memberId,
      memberName: member.name,
      memberGrade: member.grade,
      effectiveGrade: member.grade,
      teamStats: {
        teams: stats.teams.map((t) => ({
          teamLine: t.teamLine,
          salespersonCount: t.salespersonCount,
          teamLeaderCount: t.teamLeaderCount,
          branchManagerCount: t.branchManagerCount,
          centerCount: t.centerCount,
          totalCount:
            t.salespersonCount + t.teamLeaderCount + t.branchManagerCount + t.centerCount,
        })),
        totals: {
          salespersonCount: stats.totals.salespersonCount,
          teamLeaderCount: stats.totals.teamLeaderCount,
          branchManagerCount: stats.totals.branchManagerCount,
          centerCount: stats.totals.centerCount,
          totalCount:
            stats.totals.salespersonCount +
            stats.totals.teamLeaderCount +
            stats.totals.branchManagerCount +
            stats.totals.centerCount,
        },
      },
      qualifications,
    };
  }

  /**
   * 팀장 승급 자격 체크 (판매원 3/10명 소개)
   */
  private checkTeamLeaderQualification(stats: any): QualificationCheck {
    // 한시적 조건: 3명 (정상: 10명)
    const required = 3;
    const current = stats.totals.salespersonCount;

    return {
      targetGrade: MemberGrade.TEAM_LEADER,
      required: `판매원 ${required}명 소개 (한시적 조건)`,
      current: `판매원 ${current}명 소개`,
      qualified: current >= required,
      details: current < required
        ? `판매원 ${required - current}명 추가 필요`
        : undefined,
    };
  }

  /**
   * 지사장 승급 자격 체크 (팀장 3/10명 소개)
   */
  private checkBranchManagerQualification(stats: any): QualificationCheck {
    // 한시적 조건: 3명 (정상: 10명)
    const required = 3;
    const current = stats.totals.teamLeaderCount;

    return {
      targetGrade: MemberGrade.BRANCH_MANAGER,
      required: `팀장 ${required}명 소개 (한시적 조건)`,
      current: `팀장 ${current}명 소개`,
      qualified: current >= required,
      details: current < required
        ? `팀장 ${required - current}명 추가 필요`
        : undefined,
    };
  }

  /**
   * 활성 수당률 요약 조회 (신규 수당 체계)
   */
  async getCommissionRateSummary(): Promise<CommissionRateSummaryDto> {
    // 제품별 수당율 조회
    const products = await this.prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        commissionRates: {
          where: { isActive: true },
          orderBy: { recipientGrade: 'asc' },
        },
      },
    });

    const rates = products.map((product) => ({
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      price: product.price,
      commissions: product.commissionRates.map((rate) => ({
        grade: rate.recipientGrade,
        gradeName: GRADE_NAMES[rate.recipientGrade],
        amount: rate.amount,
        bonusType: this.getBonusTypeForGrade(rate.recipientGrade),
        bonusTypeName: BONUS_TYPE_NAMES[this.getBonusTypeForGrade(rate.recipientGrade)],
      })),
    }));

    return { rates };
  }
}
