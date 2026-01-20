import { IsDateString, IsOptional, IsString } from 'class-validator';

/**
 * 수동(특정날짜) 정산 생성 DTO
 */
export class CreateManualSettlementDto {
  @IsDateString()
  startDate: string; // ISO date string

  @IsDateString()
  endDate: string; // ISO date string

  @IsOptional()
  @IsString()
  weekCode?: string; // 자동 생성 가능, 직접 지정도 가능
}

/**
 * 정산 기간 중복 체크 DTO
 */
export class CheckOverlapDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

/**
 * 중복 체크 결과 응답 DTO
 */
export class OverlapCheckResultDto {
  overlaps: boolean;
  conflictingSettlements: {
    id: number;
    weekCode: string;
    startDate: Date;
    endDate: Date;
  }[];
  message?: string;
}
