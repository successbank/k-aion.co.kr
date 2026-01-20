import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SaleStatus } from '@prisma/client';

/**
 * 판매 상태 변경 DTO
 */
export class UpdateSaleStatusDto {
  @ApiProperty({
    description: '판매 상태',
    enum: SaleStatus,
    example: SaleStatus.CONFIRMED,
  })
  @IsEnum(SaleStatus)
  status: SaleStatus;
}
