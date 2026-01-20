export class CompensationOverviewDto {
  /** 보너스 유형 정보 */
  bonusTypes: BonusTypeInfo[];

  /** 등급 체계 */
  gradeSystem: GradeInfo[];

  /** 정산 주기 정보 */
  settlementSchedule: SettlementScheduleInfo;

  /** 제품별 수수료 테이블 */
  commissionTable: ProductCommissionInfo[];
}

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

export interface ProductCommissionInfo {
  productName: string;
  productCategory: string;
  salespersonCommission: number;
  teamLeaderCommission: number;
  branchManagerCommission: number;
  centerCommission: number;
  salePrice: number;
}
