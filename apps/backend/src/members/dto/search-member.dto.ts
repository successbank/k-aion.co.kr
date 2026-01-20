import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { MemberGrade } from '@prisma/client';

export class SearchMemberDto {
  @ApiProperty({ description: '검색어 (이름, 아이디, ID)', example: '홍길동', required: false })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({ description: '결과 개수 제한', example: 20, default: 20, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiProperty({ description: '등급 필터', enum: MemberGrade, required: false })
  @IsOptional()
  @IsEnum(MemberGrade)
  grade?: MemberGrade;

  @ApiProperty({ description: '활성 회원만 조회', example: true, default: true, required: false })
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean = true;
}
