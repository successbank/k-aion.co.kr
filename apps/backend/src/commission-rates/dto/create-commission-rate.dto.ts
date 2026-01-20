import {
  IsEnum,
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  ValidateNested,
  IsArray,
  Min,
} from 'class-validator';
import { BonusType, CenterBonusMode } from '@prisma/client';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTierDto } from './create-tier.dto';
import { CreateQualificationDto } from './create-qualification.dto';

export class CreateCommissionRateDto {
  @ApiProperty({
    enum: BonusType,
    description: '보너스 유형',
    example: BonusType.SALES_COMMISSION,
  })
  @IsEnum(BonusType)
  bonusType: BonusType;

  @ApiProperty({
    description: '보너스 이름 (영문)',
    example: 'Sales Bonus',
    maxLength: 100,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '보너스 이름 (한글)',
    example: '판매 보너스',
    maxLength: 100,
  })
  @IsString()
  nameKo: string;

  @ApiPropertyOptional({
    description: '보너스 설명',
    example: '직접 판매 시 지급되는 보너스',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '기본 금액 (원) - 고정 금액 방식인 경우',
    example: 500000,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  baseAmount?: number;

  @ApiPropertyOptional({
    description: '기본 퍼센트 - 퍼센트 방식인 경우',
    example: 25.0,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  basePercentage?: number;

  @ApiPropertyOptional({
    description: '기준 PV (Point Value)',
    example: 2000000,
    default: 2000000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  basePv?: number = 2000000;

  @ApiPropertyOptional({
    description: '등급별 차등 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isGradeTiered?: boolean = false;

  @ApiPropertyOptional({
    description: '동급간만 지급 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isSameRankOnly?: boolean = false;

  @ApiPropertyOptional({
    description: '1대만 지급 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFirstGenOnly?: boolean = false;

  @ApiPropertyOptional({
    description: '차액 지급 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDifferential?: boolean = false;

  @ApiPropertyOptional({
    enum: CenterBonusMode,
    description:
      '센터 운영 보너스 발생 모드 (BRANCH_OPERATION 타입에만 적용). PER_SALE: 건별, MONTHLY: 월별',
    example: CenterBonusMode.PER_SALE,
  })
  @IsOptional()
  @IsEnum(CenterBonusMode)
  centerBonusMode?: CenterBonusMode;

  @ApiPropertyOptional({
    description: '등급별 금액 설정 (isGradeTiered=true인 경우 필수)',
    type: [CreateTierDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTierDto)
  tiers?: CreateTierDto[];

  @ApiPropertyOptional({
    description: '자격 조건 설정',
    type: [CreateQualificationDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQualificationDto)
  qualifications?: CreateQualificationDto[];

  @ApiPropertyOptional({
    description: '활성 상태',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
