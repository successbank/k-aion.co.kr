import { SettlementStatus, BonusType } from '@prisma/client';

export class MemberBasicDto {
  id: number;
  name: string;
  email: string;
  grade: string;
}

export class BonusByTypeDto {
  bonusType: BonusType;
  totalAmount: number;
  count: number;
}

export class SettlementResponseDto {
  id: number;
  weekCode: string;
  startDate: Date;
  endDate: Date;
  totalSales: number;
  totalPv: number;
  totalBonuses: number;
  status: SettlementStatus;
  calculatedAt?: Date;
  confirmedAt?: Date;
  paidAt?: Date;
  confirmedBy?: number;
  createdAt: Date;
  updatedAt: Date;

  // Optional relations
  confirmer?: MemberBasicDto;
  bonusesByType?: BonusByTypeDto[];

  static fromSettlement(settlement: any): SettlementResponseDto {
    const dto = new SettlementResponseDto();
    dto.id = settlement.id;
    dto.weekCode = settlement.weekCode;
    dto.startDate = settlement.startDate;
    dto.endDate = settlement.endDate;
    dto.totalSales = settlement.totalSales;
    dto.totalPv = settlement.totalPv;
    dto.totalBonuses = settlement.totalBonuses;
    dto.status = settlement.status;
    dto.calculatedAt = settlement.calculatedAt;
    dto.confirmedAt = settlement.confirmedAt;
    dto.paidAt = settlement.paidAt;
    dto.confirmedBy = settlement.confirmedBy;
    dto.createdAt = settlement.createdAt;
    dto.updatedAt = settlement.updatedAt;

    if (settlement.confirmer) {
      dto.confirmer = {
        id: settlement.confirmer.id,
        name: settlement.confirmer.name,
        email: settlement.confirmer.email,
        grade: settlement.confirmer.grade,
      };
    }

    return dto;
  }
}
