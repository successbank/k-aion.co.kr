import { ApiProperty } from '@nestjs/swagger';
import { SaleStatus } from '@prisma/client';

/**
 * 판매 응답 DTO
 */
export class SaleResponseDto {
  @ApiProperty({ description: '판매 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '판매 코드', example: 'SALE-20251228-0001' })
  saleCode: string;

  @ApiProperty({ description: '판매자 ID', example: 10 })
  sellerId: number;

  @ApiProperty({ description: '판매자 정보', required: false })
  seller?: {
    id: number;
    name: string;
    email: string | null;
    grade: string;
  };

  @ApiProperty({ description: '제품 ID', example: 1 })
  productId: number;

  @ApiProperty({ description: '제품 정보', required: false })
  product?: {
    id: number;
    code: string;
    name: string;
    price: number;
    pv: number;
  };

  @ApiProperty({ description: '수량', example: 2 })
  quantity: number;

  @ApiProperty({ description: '단가 (원)', example: 50000 })
  unitPrice: number;

  @ApiProperty({ description: '총 금액 (원)', example: 100000 })
  totalPrice: number;

  @ApiProperty({ description: '단위 PV', example: 40000 })
  unitPv: number;

  @ApiProperty({ description: '총 PV', example: 80000 })
  totalPv: number;

  @ApiProperty({ description: '정산 주차', example: '2025-52' })
  weekCode: string;

  @ApiProperty({ description: '정산 ID', example: 1, required: false })
  settlementId?: number | null;

  @ApiProperty({
    description: '판매 상태',
    enum: SaleStatus,
    example: SaleStatus.PENDING,
  })
  status: SaleStatus;

  @ApiProperty({ description: '판매 일시', example: '2025-12-28T10:00:00Z' })
  soldAt: Date;

  @ApiProperty({ description: '생성 일시', example: '2025-12-28T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시', example: '2025-12-28T10:00:00Z' })
  updatedAt: Date;
}
