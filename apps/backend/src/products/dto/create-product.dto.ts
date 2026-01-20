import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsPositive,
  IsOptional,
  IsUrl,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * 제품 생성 DTO
 */
export class CreateProductDto {
  @ApiProperty({
    description: '제품 코드 (고유)',
    example: 'PROD-001',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  code: string;

  @ApiProperty({
    description: '제품명',
    example: '비타민 C 1000mg',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: '카테고리 ID',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  categoryId: number;

  @ApiProperty({
    description: '판매 가격 (원)',
    example: 50000,
  })
  @IsInt()
  @IsPositive()
  price: number;

  @ApiProperty({
    description: 'PV (Point Value)',
    example: 40000,
  })
  @IsInt()
  @IsPositive()
  pv: number;

  @ApiProperty({
    description: '초기 재고',
    example: 100,
    required: false,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiProperty({
    description: '제품 이미지 URL',
    example: 'https://example.com/product.jpg',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    description: '제품 설명 (HTML 형식 지원)',
    example: '<p>고함량 <strong>비타민 C</strong> 건강기능식품</p>',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: '최소 재고 (알림 기준)',
    example: 10,
    required: false,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @ApiProperty({
    description: '판매 상태 (true=판매중, false=단종)',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
