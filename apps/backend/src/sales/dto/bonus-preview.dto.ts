import { ApiProperty } from '@nestjs/swagger';

/**
 * 보너스 미리보기 응답 DTO
 */
export class BonusPreviewDto {
  @ApiProperty({ description: '판매 금액', example: 100000 })
  totalPrice: number;

  @ApiProperty({ description: '총 PV', example: 80000 })
  totalPv: number;

  @ApiProperty({ description: '예상 보너스 목록' })
  bonuses: {
    type: string;
    amount: number;
    description: string;
  }[];

  @ApiProperty({ description: '예상 총 보너스', example: 60000 })
  totalBonus: number;
}
