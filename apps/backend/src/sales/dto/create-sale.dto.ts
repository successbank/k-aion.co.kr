import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, Min, IsOptional, IsDateString } from 'class-validator';

/**
 * 판매 등록 DTO
 */
export class CreateSaleDto {
  @ApiProperty({
    description: '제품 ID',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({
    description: '판매 수량',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: '판매 일자 (미지정 시 현재 시간, Admin 전용)',
    example: '2025-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  saleDate?: string;
}
