import {
  IsString,
  IsEnum,
  IsInt,
  IsBoolean,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { SettlementCycleType } from '@prisma/client';

/**
 * 정산 스케줄 생성 DTO
 */
export class CreateSettlementScheduleDto {
  @IsString()
  name: string;

  @IsEnum(SettlementCycleType)
  cycleType: SettlementCycleType;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number; // 0-6 (일-토) for WEEKLY

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number; // 1-31 for MONTHLY

  @IsInt()
  @Min(0)
  @Max(23)
  hour: number;

  @IsInt()
  @Min(0)
  @Max(59)
  minute: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * 정산 스케줄 수정 DTO
 */
export class UpdateSettlementScheduleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(SettlementCycleType)
  cycleType?: SettlementCycleType;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  hour?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(59)
  minute?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * 정산 스케줄 응답 DTO
 */
export class SettlementScheduleResponseDto {
  id: number;
  name: string;
  cycleType: SettlementCycleType;
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour: number;
  minute: number;
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // 한글 주기 표시용
  cycleDescription?: string;
  nextRunDescription?: string;
}
