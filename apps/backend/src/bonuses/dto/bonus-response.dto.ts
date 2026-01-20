import { ApiProperty } from '@nestjs/swagger';
import { BonusType, BonusStatus } from '@prisma/client';

export class BonusResponseDto {
  @ApiProperty({ description: '보너스 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '회원 ID', example: 10 })
  memberId: number;

  @ApiProperty({ description: '판매 ID', example: 5, required: false })
  saleId?: number | null;

  @ApiProperty({
    description: '보너스 유형',
    enum: BonusType,
    example: BonusType.SALES_COMMISSION,
  })
  bonusType: BonusType;

  @ApiProperty({ description: '보너스 금액 (원)', example: 500000 })
  amount: number;

  @ApiProperty({ description: '설명', required: false })
  description?: string | null;

  @ApiProperty({ description: '정산 주차', example: '2025-52' })
  weekCode: string;

  @ApiProperty({ description: '정산 ID', required: false })
  settlementId?: number | null;

  @ApiProperty({
    description: '보너스 상태',
    enum: BonusStatus,
    example: BonusStatus.PENDING,
  })
  status: BonusStatus;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;
}
