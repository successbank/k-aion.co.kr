import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { BonusCalculatorService } from '../services/bonus-calculator.service';
import { BonusSimulatorService } from '../services/bonus-simulator.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BonusResponseDto } from '../dto/bonus-response.dto';
import {
  CompensationOverviewDto,
  BonusTypeInfo,
  GradeInfo,
  SettlementScheduleInfo,
  ProductCommissionInfo,
} from '../dto/compensation-overview.dto';
import { BonusSimulationRequestDto } from '../dto/bonus-simulation.dto';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('v1/compensation-plan')
export class CompensationPlanController {
  constructor(
    private bonusCalculator: BonusCalculatorService,
    private bonusSimulator: BonusSimulatorService,
    private prisma: PrismaService,
  ) {}

  /**
   * GET /v1/compensation-plan/overview
   * 보상플랜 전체 개요 조회 (Public - 인증 불필요)
   */
  @Public()
  @Get('overview')
  async getOverview(): Promise<CompensationOverviewDto> {
    // 신규 수당 체계 (2가지)
    const bonusTypes: BonusTypeInfo[] = [
      {
        type: 'SALES_COMMISSION',
        name: '판매 수수료',
        amount: '제품별 고정금액',
        condition: '판매원/팀장 등급',
        description: '판매원과 팀장 등급이 제품 판매 시 지급되는 수수료입니다. 제품별 고정 금액이 적용됩니다.',
      },
      {
        type: 'EDUCATION_MANAGEMENT',
        name: '교육 관리 수수료',
        amount: '제품별 고정금액',
        condition: '지사장/센터 등급',
        description: '지사장과 센터 등급이 하위 회원 판매 시 지급되는 수수료입니다. 제품별 고정 금액이 적용됩니다.',
      },
    ];

    // 신규 등급 체계 (4등급 + ADMIN)
    const gradeSystem: GradeInfo[] = [
      {
        grade: 'SALESPERSON',
        name: '판매원',
        requirements: '제품 1세트 판매 후 자격 취득',
        benefits: ['직접 판매 수수료 수령'],
      },
      {
        grade: 'TEAM_LEADER',
        name: '팀장',
        requirements: '판매원 10명 소개 (한시적 3명)',
        benefits: ['직접 판매 수수료', '하위 판매원 판매 시 팀장 수수료'],
      },
      {
        grade: 'BRANCH_MANAGER',
        name: '지사장',
        requirements: '팀장 10명 소개 (한시적 3명)',
        benefits: ['교육 관리 수수료'],
      },
      {
        grade: 'CENTER',
        name: '센터',
        requirements: '관리자 지정 (지역본부장)',
        benefits: ['교육 관리 수수료', '센터 운영 지원'],
      },
    ];

    const settlementSchedule: SettlementScheduleInfo = {
      cycle: '주간 정산',
      closeDay: '매주 일요일~월요일',
      paymentDay: '다음 주 수요일',
      description:
        '매주 일요일부터 월요일까지 정산이 마감되며, 다음 주 수요일에 보너스가 지급됩니다.',
    };

    // 제품별 수수료 테이블 (이미지 기준)
    const commissionTable: ProductCommissionInfo[] = [
      {
        productName: '고주파(온 체)',
        productCategory: '의료기기',
        salespersonCommission: 500000, // 50만원
        teamLeaderCommission: 1000000, // 100만원
        branchManagerCommission: 200000, // 20만원
        centerCommission: 50000, // 5만원
        salePrice: 2860000, // 286만원
      },
      {
        productName: '펄스온(저주파)',
        productCategory: '의료기기',
        salespersonCommission: 400000, // 40만원
        teamLeaderCommission: 800000, // 80만원
        branchManagerCommission: 150000, // 15만원
        centerCommission: 50000, // 5만원
        salePrice: 2490000, // 249만원
      },
      {
        productName: '제트5(초음파)',
        productCategory: '의료기기',
        salespersonCommission: 250000, // 25만원
        teamLeaderCommission: 500000, // 50만원
        branchManagerCommission: 50000, // 5만원
        centerCommission: 50000, // 5만원
        salePrice: 1500000, // 150만원
      },
      {
        productName: '통증 패치',
        productCategory: '소모품',
        salespersonCommission: 0, // 없음
        teamLeaderCommission: 20000, // 2만원
        branchManagerCommission: 4800, // 4천8백원
        centerCommission: 2400, // 2천4백원
        salePrice: 48000, // 4만8천원
      },
      {
        productName: '전용젤',
        productCategory: '소모품',
        salespersonCommission: 0, // 없음
        teamLeaderCommission: 15000, // 1만5천원
        branchManagerCommission: 3000, // 3천원
        centerCommission: 1500, // 1천5백원
        salePrice: 30000, // 3만원
      },
    ];

    return {
      bonusTypes,
      gradeSystem,
      settlementSchedule,
      commissionTable,
    };
  }

  /**
   * GET /v1/bonuses/my
   * 내 보너스 내역 조회
   */
  @Public()
  @Get('/bonuses/my')
  async getMyBonuses(
    @Query('memberId') memberId: string,
    @Query('weekCode') weekCode?: string,
    @Query('status') status?: string,
    @Query('bonusType') bonusType?: string,
  ): Promise<BonusResponseDto[]> {
    const where: any = {
      memberId: parseInt(memberId),
    };

    if (weekCode) {
      where.weekCode = weekCode;
    }

    if (status) {
      where.status = status;
    }

    if (bonusType) {
      where.bonusType = bonusType;
    }

    const bonuses = await this.prisma.bonus.findMany({
      where,
      include: {
        member: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return bonuses.map((bonus) => BonusResponseDto.fromBonus(bonus));
  }

  /**
   * GET /v1/bonuses/:id
   * 특정 보너스 상세 조회
   */
  @Public()
  @Get('/bonuses/:id')
  async getBonusById(@Param('id') id: string): Promise<BonusResponseDto> {
    const bonus = await this.prisma.bonus.findUnique({
      where: { id: parseInt(id) },
      include: {
        member: true,
        sale: {
          include: {
            product: true,
          },
        },
        seminar: true,
      },
    });

    if (!bonus) {
      throw new Error(`Bonus with ID ${id} not found`);
    }

    return BonusResponseDto.fromBonus(bonus);
  }

  /**
   * GET /v1/bonuses/summary
   * 보너스 요약 통계
   */
  @Public()
  @Get('/bonuses/summary')
  async getBonusSummary(@Query('memberId') memberId: string, @Query('weekCode') weekCode?: string) {
    const where: any = {
      memberId: parseInt(memberId),
    };

    if (weekCode) {
      where.weekCode = weekCode;
    }

    // 보너스 타입별 집계
    const bonusesByType = await this.prisma.bonus.groupBy({
      by: ['bonusType'],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // 상태별 집계
    const bonusesByStatus = await this.prisma.bonus.groupBy({
      by: ['status'],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // 전체 합계
    const totalAmount = bonusesByType.reduce((sum, item) => sum + (item._sum.amount || 0), 0);
    const totalCount = bonusesByType.reduce((sum, item) => sum + item._count.id, 0);

    return {
      totalAmount,
      totalCount,
      byType: bonusesByType.map((item) => ({
        bonusType: item.bonusType,
        amount: item._sum.amount || 0,
        count: item._count.id,
      })),
      byStatus: bonusesByStatus.map((item) => ({
        status: item.status,
        amount: item._sum.amount || 0,
        count: item._count.id,
      })),
    };
  }

  // ============================================
  // 보너스 시뮬레이션 API
  // ============================================

  /**
   * POST /v1/bonuses/simulate
   * 판매 시뮬레이션 - 6가지 보너스 계산 (DB 저장 없음)
   */
  @Public()
  @Post('/bonuses/simulate')
  async simulateSale(@Body() dto: BonusSimulationRequestDto) {
    return this.bonusSimulator.simulateSale(dto);
  }

  /**
   * GET /v1/members/:id/team-qualification
   * 회원의 팀 자격 조건 조회
   */
  @Public()
  @Get('/members/:id/team-qualification')
  async getTeamQualification(@Param('id') id: string) {
    return this.bonusSimulator.getTeamQualification(parseInt(id));
  }

  /**
   * GET /v1/commission-rates/active-summary
   * 활성 수당률 요약 조회
   */
  @Public()
  @Get('/commission-rates/active-summary')
  async getCommissionRateSummary() {
    return this.bonusSimulator.getCommissionRateSummary();
  }
}
