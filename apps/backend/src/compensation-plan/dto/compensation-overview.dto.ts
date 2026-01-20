export class CompensationOverviewDto {
  /** 6가지 보너스 유형 정보 */
  bonusTypes: BonusTypeInfo[];

  /** 5단계 등급 체계 */
  gradeSystem: GradeInfo[];

  /** 정산 주기 정보 */
  settlementSchedule: SettlementScheduleInfo;
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
