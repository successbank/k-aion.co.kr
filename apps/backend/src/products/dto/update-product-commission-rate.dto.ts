import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MemberGrade } from '@prisma/client';

/**
 * 개별 등급 수당률 DTO
 */
export class GradeRateDto {
  @ApiProperty({
    description: '수령 등급',
    enum: MemberGrade,
    example: 'SALESPERSON',
  })
  @IsEnum(MemberGrade)
  grade: MemberGrade;

  @ApiProperty({
    description: '수당 금액 (원)',
    example: 500000,
  })
  @IsInt()
  @Min(0)
  amount: number;
}

/**
 * 제품별 수당률 일괄 업데이트 DTO
 */
export class UpdateProductCommissionRatesDto {
  @ApiProperty({
    description: '등급별 수당률 배열',
    type: [GradeRateDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeRateDto)
  rates: GradeRateDto[];
}

/**
 * 개별 수당률 수정 DTO
 */
export class UpdateSingleCommissionRateDto {
  @ApiPropertyOptional({
    description: '수당 금액 (원)',
    example: 500000,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: '활성화 상태',
    example: true,
  })
  @IsOptional()
  isActive?: boolean;
}

/**
 * 제품별 수당률 응답 DTO
 */
export class ProductCommissionRateResponseDto {
  @ApiProperty({ example: 1 })
  productId: number;

  @ApiProperty({ example: '온체' })
  productName: string;

  @ApiProperty({ example: 'ONCHE' })
  productCode: string;

  @ApiProperty({ example: 2000000 })
  price: number;

  @ApiProperty({
    description: '등급별 수당률',
    example: {
      SALESPERSON: 500000,
      TEAM_LEADER: 1000000,
      BRANCH_MANAGER: 200000,
      CENTER: 50000,
    },
  })
  rates: Record<MemberGrade, number | null>;
}
