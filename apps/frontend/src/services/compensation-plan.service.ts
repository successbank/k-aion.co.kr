import api from '@/lib/api';
import { BonusType, BonusStatus } from '@/types/bonuses';

// ============================================================================
// 타입 정의
// ============================================================================

export interface BonusTypeInfo {
  type: string;
  name: string;
  amount: string;
  condition: string;
  description: string;
}

export interface GradeInfo {
  grade: string;
  name: string;
  requirements: string;
  benefits: string[];
}

export interface SettlementScheduleInfo {
  cycle: string;
  closeDay: string;
  paymentDay: string;
  description: string;
}

export interface CompensationOverviewDto {
  bonusTypes: BonusTypeInfo[];
  gradeSystem: GradeInfo[];
  settlementSchedule: SettlementScheduleInfo;
}

export interface BonusResponseDto {
  id: number;
  memberId: number;
  memberName?: string;
  bonusType: BonusType;
  bonusTypeName: string;
  amount: number;
  description: string;
  weekCode: string;
  status: BonusStatus;
  statusName: string;
  calculatedAt: Date;
  approvedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
}

export interface BonusSummaryDto {
  totalAmount: number;
  totalCount: number;
  byType: Array<{
    bonusType: BonusType;
    amount: number;
    count: number;
  }>;
  byStatus: Array<{
    status: BonusStatus;
    amount: number;
    count: number;
  }>;
}

export interface BonusListParams {
  memberId: number;
  weekCode?: string;
  status?: BonusStatus;
  bonusType?: BonusType;
}

export interface BonusSummaryParams {
  memberId: number;
  weekCode?: string;
}

// ============================================================================
// API 서비스
// ============================================================================

export const compensationPlanService = {
  /**
   * GET /v1/compensation-plan/overview
   * 보상플랜 전체 개요 조회
   */
  async getOverview(): Promise<CompensationOverviewDto> {
    const { data } = await api.get('/v1/compensation-plan/overview');
    return data;
  },

  /**
   * GET /v1/compensation-plan/bonuses/my
   * 내 보너스 내역 조회
   */
  async getMyBonuses(params: BonusListParams): Promise<BonusResponseDto[]> {
    const { data } = await api.get('/v1/compensation-plan/bonuses/my', {
      params,
    });
    return data;
  },

  /**
   * GET /v1/compensation-plan/bonuses/:id
   * 특정 보너스 상세 조회
   */
  async getBonusById(id: number): Promise<BonusResponseDto> {
    const { data } = await api.get(`/v1/compensation-plan/bonuses/${id}`);
    return data;
  },

  /**
   * GET /v1/compensation-plan/bonuses/summary
   * 보너스 요약 통계
   */
  async getBonusSummary(params: BonusSummaryParams): Promise<BonusSummaryDto> {
    const { data } = await api.get('/v1/compensation-plan/bonuses/summary', {
      params,
    });
    return data;
  },
};

export default compensationPlanService;
