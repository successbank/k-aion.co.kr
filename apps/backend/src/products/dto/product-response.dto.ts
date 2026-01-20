import { ApiProperty } from '@nestjs/swagger';

/**
 * 제품 응답 DTO
 */
export class ProductResponseDto {
  @ApiProperty({ description: '제품 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '제품 코드', example: 'PROD-001' })
  code: string;

  @ApiProperty({ description: '제품명', example: '비타민 C 1000mg' })
  name: string;

  @ApiProperty({ description: '카테고리 ID', example: 1 })
  categoryId: number;

  @ApiProperty({ description: '카테고리 정보', required: false })
  category?: {
    id: number;
    name: string;
    level: number;
  };

  @ApiProperty({ description: '판매 가격 (원)', example: 50000 })
  price: number;

  @ApiProperty({ description: 'PV (Point Value)', example: 40000 })
  pv: number;

  @ApiProperty({ description: '재고', example: 100 })
  stock: number;

  @ApiProperty({ description: '제품 이미지 URL', required: false })
  imageUrl?: string | null;

  @ApiProperty({ description: '제품 설명', required: false })
  description?: string | null;

  @ApiProperty({ description: '활성 상태', example: true })
  isActive: boolean;

  @ApiProperty({ description: '생성일', example: '2025-12-28T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일', example: '2025-12-28T10:00:00Z' })
  updatedAt: Date;
}
