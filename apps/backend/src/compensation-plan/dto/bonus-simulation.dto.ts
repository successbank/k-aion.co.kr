import { IsNumber, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BonusType, MemberGrade } from '@prisma/client';

/**
 * 보너스 시뮬레이션 요청 DTO
 */
export class BonusSimulationRequestDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  sellerId: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  productId: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

/**
 * 보너스 수령자 정보
 */
export interface BonusRecipient {
  id: number;
  name: string;
  grade: MemberGrade;
  relation: string; // '본인', '후원인', '추천인' 등
}

/**
 * 개별 보너스 시뮬레이션 결과
 */
export interface SimulatedBonus {
  type: BonusType;
  typeName: string;
  recipient: BonusRecipient | null;
  amount: number;
  qualified: boolean;
  qualificationReason?: string;
}

/**
 * 보너스 시뮬레이션 응답 DTO
 */
export interface BonusSimulationResponseDto {
  seller: {
    id: number;
    name: string;
    username: string;
    actualGrade: MemberGrade;
    effectiveGrade: MemberGrade;
    cumulativePv: number;
  };
  product: {
    id: number;
    name: string;
    code: string;
    price: number;
    pv: number;
  };
  quantity: number;
  totalPrice: number;
  totalPv: number;
  bonuses: SimulatedBonus[];
  totalBonus: number;
}

/**
 * 팀 자격 조건 응답 DTO (신규 등급 체계)
 */
export interface TeamQualificationResponseDto {
  memberId: number;
  memberName: string;
  memberGrade: MemberGrade;
  effectiveGrade: MemberGrade;
  teamStats: {
    teams: Array<{
      teamLine: number;
      salespersonCount: number;
      teamLeaderCount: number;
      branchManagerCount: number;
      centerCount: number;
      totalCount: number;
    }>;
    totals: {
      salespersonCount: number;
      teamLeaderCount: number;
      branchManagerCount: number;
      centerCount: number;
      totalCount: number;
    };
  };
  qualifications: {
    teamLeaderPromotion: QualificationCheck;
    branchManagerPromotion: QualificationCheck;
  };
}

/**
 * 자격 조건 체크 결과
 */
export interface QualificationCheck {
  targetGrade: MemberGrade;
  required: string;
  current: string;
  qualified: boolean;
  details?: string;
}

/**
 * 활성 수당률 요약 응답 DTO (신규 제품별 수당 체계)
 */
export interface CommissionRateSummaryDto {
  rates: Array<{
    productId: number;
    productName: string;
    productCode: string;
    price: number;
    commissions: Array<{
      grade: MemberGrade;
      gradeName: string;
      amount: number;
      bonusType: BonusType;
      bonusTypeName: string;
    }>;
  }>;
}
