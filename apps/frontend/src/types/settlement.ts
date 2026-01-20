export enum SettlementStatus {
  OPEN = 'OPEN',
  CALCULATING = 'CALCULATING',
  CALCULATED = 'CALCULATED',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  CLOSED = 'CLOSED',
}

export enum BonusType {
  SALES = 'SALES',
  SALES_MANAGEMENT = 'SALES_MANAGEMENT',
  LICENSE = 'LICENSE',
  LICENSE_MANAGEMENT = 'LICENSE_MANAGEMENT',
  SHARING = 'SHARING',
  BRANCH_OPERATION = 'BRANCH_OPERATION',
}

export interface MemberBasic {
  id: number;
  name: string;
  email: string;
  grade: string;
}

export interface BonusByType {
  bonusType: BonusType;
  totalAmount: number;
  count: number;
}

export interface Settlement {
  id: number;
  weekCode: string;
  startDate: string;
  endDate: string;
  totalSales: number;
  totalPv: number;
  totalBonuses: number;
  status: SettlementStatus;
  calculatedAt?: string;
  confirmedAt?: string;
  paidAt?: string;
  confirmedBy?: number;
  createdAt: string;
  updatedAt: string;
  confirmer?: MemberBasic;
  bonusesByType?: BonusByType[];
}

export interface SettlementListResponse {
  data: Settlement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateSettlementDto {
  weekCode: string;
  startDate: string;
  endDate: string;
}

export interface SettlementQuery {
  page?: number;
  limit?: number;
  status?: SettlementStatus;
  startDate?: string;
  endDate?: string;
}

// Helper function to get Korean label for status
export function getStatusKorean(status: SettlementStatus): string {
  const statusMap = {
    [SettlementStatus.OPEN]: '진행 중',
    [SettlementStatus.CALCULATING]: '계산 중',
    [SettlementStatus.CALCULATED]: '계산 완료',
    [SettlementStatus.CONFIRMED]: '확정됨',
    [SettlementStatus.PAID]: '지급 완료',
    [SettlementStatus.CLOSED]: '마감',
  };
  return statusMap[status] || status;
}

// Helper function to get Korean label for bonus type
export function getBonusTypeKorean(bonusType: BonusType): string {
  const bonusTypeMap = {
    [BonusType.SALES]: '판매 보너스',
    [BonusType.SALES_MANAGEMENT]: '판매 관리 보너스',
    [BonusType.LICENSE]: '판권 보너스',
    [BonusType.LICENSE_MANAGEMENT]: '판권 관리 보너스',
    [BonusType.SHARING]: '공유 보너스',
    [BonusType.BRANCH_OPERATION]: '센터 운영 보너스',
  };
  return bonusTypeMap[bonusType] || bonusType;
}

// Color mapping for settlement status
export const SETTLEMENT_STATUS_COLORS = {
  [SettlementStatus.OPEN]: 'blue',
  [SettlementStatus.CALCULATING]: 'orange',
  [SettlementStatus.CALCULATED]: 'purple',
  [SettlementStatus.CONFIRMED]: 'green',
  [SettlementStatus.PAID]: 'default',
  [SettlementStatus.CLOSED]: 'default',
} as const;
