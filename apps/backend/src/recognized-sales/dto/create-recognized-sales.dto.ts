import { IsInt, IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberGrade, RecognitionType } from '@prisma/client';

export class CreateRecognizedSalesDto {
  @ApiProperty({ description: '회원 ID' })
  @IsInt()
  memberId: number;

  @ApiProperty({
    description: '인정 등급',
    enum: ['AGENT', 'MANAGER', 'BRANCH_CHIEF', 'DIVISION_CHIEF'],
  })
  @IsEnum(MemberGrade)
  recognizedGrade: MemberGrade;

  @ApiPropertyOptional({
    description: '인정 유형 (GRADE: 등급 인정, LICENSE: 판권 인정)',
    enum: ['GRADE', 'LICENSE'],
    default: 'GRADE',
  })
  @IsOptional()
  @IsEnum(RecognitionType)
  recognitionType?: RecognitionType;

  @ApiProperty({ description: '시작일 (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: '종료일 (YYYY-MM-DD), 미지정 시 무기한' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '인정 사유' })
  @IsOptional()
  @IsString()
  reason?: string;
}
