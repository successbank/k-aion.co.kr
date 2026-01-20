import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsPositive, IsOptional, MaxLength, Min, Max } from 'class-validator';

/**
 * 카테고리 생성 DTO
 */
export class CreateCategoryDto {
  @ApiProperty({
    description: '카테고리명',
    example: '건강기능식품',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: '카테고리 레벨 (1=대분류, 2=소분류)',
    example: 1,
    minimum: 1,
    maximum: 2,
  })
  @IsInt()
  @Min(1)
  @Max(2)
  level: number;

  @ApiPropertyOptional({
    description: '상위 카테고리 ID (대분류인 경우 null)',
    example: null,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  parentId?: number;

  @ApiPropertyOptional({
    description: '표시 순서 (낮을수록 먼저 표시)',
    example: 0,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}
