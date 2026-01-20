import { IsOptional, IsInt, IsEnum, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MemberGrade, RecognizedSalesStatus, RecognitionType } from '@prisma/client';

export class RecognizedSalesQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지당 항목 수', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: '회원 ID 필터' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  memberId?: number;

  @ApiPropertyOptional({ description: '인정 등급 필터', enum: MemberGrade })
  @IsOptional()
  @IsEnum(MemberGrade)
  recognizedGrade?: MemberGrade;

  @ApiPropertyOptional({
    description: '상태 필터',
    enum: RecognizedSalesStatus,
  })
  @IsOptional()
  @IsEnum(RecognizedSalesStatus)
  status?: RecognizedSalesStatus;

  @ApiPropertyOptional({
    description: '인정 유형 필터 (GRADE: 등급 인정, LICENSE: 판권 인정)',
    enum: RecognitionType,
  })
  @IsOptional()
  @IsEnum(RecognitionType)
  recognitionType?: RecognitionType;

  @ApiPropertyOptional({ description: '회원 이름/아이디 검색' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;
}
