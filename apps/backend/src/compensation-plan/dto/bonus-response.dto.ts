import { BonusType, BonusStatus } from '@prisma/client';

export class BonusResponseDto {
  id: number;
  memberId: number;
  memberName?: string;
  bonusType: BonusType;
  bonusTypeName: string;
  amount: number;
  description: string;
  weekCode: string;
  status: BonusStatus;
  statusName: string;
  calculatedAt: Date;
  approvedAt?: Date;
  paidAt?: Date;
  createdAt: Date;

  static fromBonus(bonus: any): BonusResponseDto {
    const bonusTypeNames = {
      SALES: '판매 보너스',
      SALES_MANAGEMENT: '판매 관리 보너스',
      LICENSE: '판권 보너스',
      LICENSE_MANAGEMENT: '판권 관리 보너스',
      SHARING: '공유 보너스',
      BRANCH_OPERATION: '지점 운영 보너스',
    };

    const statusNames = {
      PENDING: '대기 중',
      CONFIRMED: '승인됨',
      PAID: '지급 완료',
      CANCELLED: '취소됨',
    };

    return {
      id: bonus.id,
      memberId: bonus.memberId,
      memberName: bonus.member?.name,
      bonusType: bonus.bonusType,
      bonusTypeName: bonusTypeNames[bonus.bonusType] || bonus.bonusType,
      amount: bonus.amount,
      description: bonus.description,
      weekCode: bonus.weekCode,
      status: bonus.status,
      statusName: statusNames[bonus.status] || bonus.status,
      calculatedAt: bonus.createdAt,
      approvedAt: bonus.approvedAt,
      paidAt: bonus.paidAt,
      createdAt: bonus.createdAt,
    };
  }
}
