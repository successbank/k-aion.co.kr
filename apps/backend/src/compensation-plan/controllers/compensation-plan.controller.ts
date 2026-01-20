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
    const bonusTypes: BonusTypeInfo[] = [
      {
        type: 'SALES',
        name: '판매 보너스',
        amount: '500,000원',
        condition: '본인이 직접 판매 시',
        description: '회원이 직접 제품을 판매했을 때 지급되는 보너스입니다.',
      },
      {
        type: 'SALES_MANAGEMENT',
        name: '판매 관리 보너스',
        amount: '150,000원',
        condition: '하위 회원 판매 시',
        description: '추천하거나 후원한 하위 회원이 판매했을 때 지급됩니다.',
      },
      {
        type: 'LICENSE',
        name: '판권 보너스',
        amount: '100,000~240,000원',
        condition: '하위 회원 승급 시',
        description: '하위 회원을 육성하여 승급시켰을 때 등급별로 차등 지급됩니다.',
      },
      {
        type: 'LICENSE_MANAGEMENT',
        name: '판권 관리 보너스',
        amount: '30,000~50,000원',
        condition: '하위 회원의 육성 실적',
        description: '하위 회원이 다른 회원을 육성했을 때 상위 회원에게 지급됩니다.',
      },
      {
        type: 'SHARING',
        name: '공유 보너스',
        amount: '20,000원',
        condition: '매니저 이상 자격 충족',
        description: '매니저 이상 등급에서 조건 충족 시 지급됩니다.',
      },
      {
        type: 'BRANCH_OPERATION',
        name: '지점 운영 보너스',
        amount: '50,000원',
        condition: '세미나 개최 및 승인',
        description: '세미나를 개최하고 승인받았을 때 지급되는 운영 지원금입니다.',
      },
    ];

    const gradeSystem: GradeInfo[] = [
      {
        grade: 'MEMBER',
        name: '회원',
        requirements: '가입 후 기본 등급',
        benefits: ['제품 구매', '판매 보너스 수령'],
      },
      {
        grade: 'AGENT',
        name: '에이전트',
        requirements: '일정 판매 실적 달성',
        benefits: ['판매 보너스', '판매 관리 보너스'],
      },
      {
        grade: 'MANAGER',
        name: '매니저',
        requirements: '하위 에이전트 3명 이상 육성',
        benefits: ['판매 보너스', '판매 관리 보너스', '판권 보너스', '공유 보너스'],
      },
      {
        grade: 'BRANCH_CHIEF',
        name: '지부장',
        requirements: '하위 매니저 5명 이상 육성',
        benefits: ['모든 보너스', '판권 보너스 증액', '지점 운영 보너스 자격'],
      },
      {
        grade: 'DIVISION_CHIEF',
        name: '본부장',
        requirements: '하위 지부장 3명 이상 육성',
        benefits: ['최고 등급 모든 혜택', '판권 보너스 최대 금액'],
      },
    ];

    const settlementSchedule: SettlementScheduleInfo = {
      cycle: '주간 정산',
      closeDay: '매주 일요일~월요일',
      paymentDay: '다음 주 수요일',
      description:
        '매주 일요일부터 월요일까지 정산이 마감되며, 다음 주 수요일에 보너스가 지급됩니다.',
    };

    return {
      bonusTypes,
      gradeSystem,
      settlementSchedule,
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
