import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsPositive, Min, IsEnum, IsOptional, IsString } from 'class-validator';
import { MemberGrade } from '@prisma/client';

/**
 * 인정매출 등록 DTO
 * 회사 설립 시 구성원들의 등급 설정을 위한 가상 매출 등록
 * 인정매출은 보너스 지급 대상에서 제외됨
 */
export class CreateRecognizedSaleDto {
  @ApiProperty({
    description: '대상 회원 ID',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  memberId: number;

  @ApiProperty({
    description: '제품 ID',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({
    description: '수량',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: '목표 등급 (AGENT ~ CENTER)',
    enum: MemberGrade,
    example: 'MANAGER',
  })
  @IsEnum(MemberGrade)
  targetGrade: MemberGrade;

  @ApiPropertyOptional({
    description: '인정매출 사유',
    example: '회사 설립 초기 등급 설정',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
