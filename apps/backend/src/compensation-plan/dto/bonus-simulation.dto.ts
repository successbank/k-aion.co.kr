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
 * 팀 자격 조건 응답 DTO
 */
export interface TeamQualificationResponseDto {
  memberId: number;
  memberName: string;
  memberGrade: MemberGrade;
  effectiveGrade: MemberGrade;
  teamStats: {
    teams: Array<{
      teamLine: number;
      agentCount: number;
      managerCount: number;
      branchChiefCount: number;
      divisionChiefCount: number;
      totalCount: number;
    }>;
    totals: {
      agentCount: number;
      managerCount: number;
      branchChiefCount: number;
      divisionChiefCount: number;
      totalCount: number;
    };
  };
  qualifications: {
    managerCultivation: QualificationCheck;
    branchChiefCultivation: QualificationCheck;
    divisionChiefCultivation: QualificationCheck;
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
 * 활성 수당률 요약 응답 DTO
 */
export interface CommissionRateSummaryDto {
  rates: Array<{
    bonusType: BonusType;
    bonusTypeName: string;
    isGradeTiered: boolean;
    baseAmount?: number;
    tiers?: Array<{
      grade: MemberGrade;
      gradeName: string;
      amount: number;
    }>;
    description?: string;
  }>;
}
