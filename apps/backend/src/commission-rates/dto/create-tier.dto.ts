import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { MemberGrade } from '@prisma/client';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTierDto {
  @ApiProperty({
    enum: MemberGrade,
    description: '적용 가능한 회원 등급',
    example: MemberGrade.MANAGER,
  })
  @IsEnum(MemberGrade)
  applicableGrade: MemberGrade;

  @ApiProperty({
    description: '보너스 금액 (원)',
    example: 180000,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({
    description: '퍼센트 (선택사항)',
    example: 9.0,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  percentage?: number;

  @ApiPropertyOptional({
    description: '등급 정렬 순서',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  tierOrder?: number = 0;
}
