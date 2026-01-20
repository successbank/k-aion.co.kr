import api from '@/lib/api';
import { BonusType, BonusStatus } from '@/types/bonuses';

export interface BonusResponseDto {
  id: number;
  memberId: number;
  saleId?: number | null;
  bonusType: BonusType;
  amount: number;
  description?: string | null;
  weekCode: string;
  settlementId?: number | null;
  status: BonusStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface BonusSummary {
  totalBonus: number;
  bonusByType: Record<BonusType, number>;
  bonusByStatus: Record<BonusStatus, number>;
}

export interface BonusListParams {
  page?: number;
  limit?: number;
  memberId?: number;
  weekCode?: string;
  status?: BonusStatus;
  bonusType?: BonusType;
}

export interface BonusListResponse {
  data: BonusResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BonusPreview {
  totalBonus: number;
  bonuses: Array<{
    type: BonusType;
    recipient: string;
    amount: number;
    description: string;
  }>;
}

export const bonusesService = {
  /**
   * 보너스 목록 조회
   */
  async findAll(params: BonusListParams = {}): Promise<BonusListResponse> {
    const { data } = await api.get('/v1/bonuses', { params });
    return data;
  },

  /**
   * 보너스 상세 조회
   */
  async findOne(id: number): Promise<BonusResponseDto> {
    const { data } = await api.get(`/v1/bonuses/${id}`);
    return data;
  },

  /**
   * 회원별 보너스 통계
   */
  async getMemberSummary(memberId: number, weekCode?: string): Promise<BonusSummary> {
    const params = weekCode ? { weekCode } : {};
    const { data } = await api.get(`/v1/bonuses/members/${memberId}/summary`, { params });
    return data;
  },

  /**
   * 판매 기준 보너스 미리보기
   */
  async previewBonuses(sellerId: number, saleAmount: number): Promise<BonusPreview> {
    const { data } = await api.get(`/v1/bonuses/preview/${sellerId}`, {
      params: { saleAmount },
    });
    return data;
  },

  /**
   * 판매 발생 시 보너스 계산 (관리자 전용)
   */
  async calculateBonuses(saleId: number): Promise<void> {
    await api.post(`/v1/bonuses/calculate/${saleId}`);
  },
};

export default bonusesService;
