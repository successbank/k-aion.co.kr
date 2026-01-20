import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettlementStatus, BonusStatus, BonusType } from '@prisma/client';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { SettlementQueryDto } from './dto/settlement-query.dto';
import { SettlementResponseDto, BonusByTypeDto } from './dto/settlement-response.dto';

/**
 * 정산 관리 서비스
 */
@Injectable()
export class SettlementsService {
  private readonly logger = new Logger(SettlementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 정산 목록 조회 (페이징)
   */
  async findAll(query: SettlementQueryDto) {
    const { page = 1, limit = 10, status, startDate, endDate } = query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.startDate = { gte: new Date(startDate) };
      where.endDate = { lte: new Date(endDate) };
    }

    const [settlements, total] = await Promise.all([
      this.prisma.settlement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { weekCode: 'desc' },
        include: {
          confirmer: {
            select: {
              id: true,
              name: true,
              email: true,
              grade: true,
            },
          },
        },
      }),
      this.prisma.settlement.count({ where }),
    ]);

    return {
      data: settlements.map((s) => SettlementResponseDto.fromSettlement(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 정산 상세 조회
   */
  async findOne(id: number): Promise<SettlementResponseDto> {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id },
      include: {
        confirmer: {
          select: {
            id: true,
            name: true,
            email: true,
            grade: true,
          },
        },
      },
    });

    if (!settlement) {
      throw new NotFoundException(`정산 ID ${id}를 찾을 수 없습니다.`);
    }

    const dto = SettlementResponseDto.fromSettlement(settlement);

    // 보너스 타입별 집계 추가
    dto.bonusesByType = await this.getBonusesByType(settlement.weekCode);

    return dto;
  }

  /**
   * 보너스 타입별 집계
   */
  private async getBonusesByType(weekCode: string): Promise<BonusByTypeDto[]> {
    const bonuses = await this.prisma.bonus.groupBy({
      by: ['bonusType'],
      where: { weekCode },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    return bonuses.map((b) => ({
      bonusType: b.bonusType,
      totalAmount: b._sum.amount || 0,
      count: b._count.id,
    }));
  }

  /**
   * 새 정산 주차 생성
   */
  async create(dto: CreateSettlementDto): Promise<SettlementResponseDto> {
    const { weekCode, startDate, endDate } = dto;

    // 중복 주차 체크
    const existing = await this.prisma.settlement.findUnique({
      where: { weekCode },
    });

    if (existing) {
      throw new BadRequestException(`주차 코드 ${weekCode}는 이미 존재합니다.`);
    }

    const settlement = await this.prisma.settlement.create({
      data: {
        weekCode,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: SettlementStatus.OPEN,
      },
    });

    this.logger.log(`새 정산 주차 생성: ${weekCode}`);

    return SettlementResponseDto.fromSettlement(settlement);
  }

  /**
   * 정산 계산 시작 (OPEN → CALCULATING → CALCULATED)
   */
  async calculate(id: number): Promise<SettlementResponseDto> {
    const settlement = await this.findOne(id);

    if (settlement.status !== SettlementStatus.OPEN) {
      throw new BadRequestException(
        'OPEN 상태의 정산만 계산할 수 있습니다.',
      );
    }

    // 1. 상태 변경 → CALCULATING
    await this.prisma.settlement.update({
      where: { id },
      data: { status: SettlementStatus.CALCULATING },
    });

    this.logger.log(`정산 계산 시작: ${settlement.weekCode}`);

    // 2. 해당 주차의 판매/보너스 집계
    const [sales, bonuses] = await Promise.all([
      this.prisma.sale.findMany({
        where: { weekCode: settlement.weekCode },
      }),
      this.prisma.bonus.findMany({
        where: { weekCode: settlement.weekCode },
      }),
    ]);

    const totalSales = sales.reduce((sum, s) => sum + s.totalPrice, 0);
    const totalPv = sales.reduce((sum, s) => sum + s.totalPv, 0);
    const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);

    this.logger.log(
      `집계 완료: 판매 ${totalSales}원, PV ${totalPv}, 보너스 ${totalBonuses}원`,
    );

    // 3. 집계 결과 저장 및 상태 변경 → CALCULATED
    const updated = await this.prisma.settlement.update({
      where: { id },
      data: {
        totalSales,
        totalPv,
        totalBonuses,
        status: SettlementStatus.CALCULATED,
        calculatedAt: new Date(),
      },
    });

    return SettlementResponseDto.fromSettlement(updated);
  }

  /**
   * 정산 확정 (CALCULATED → CONFIRMED)
   */
  async confirm(id: number, userId: number): Promise<SettlementResponseDto> {
    const settlement = await this.findOne(id);

    if (settlement.status !== SettlementStatus.CALCULATED) {
      throw new BadRequestException(
        'CALCULATED 상태의 정산만 확정할 수 있습니다.',
      );
    }

    const updated = await this.prisma.settlement.update({
      where: { id },
      data: {
        status: SettlementStatus.CONFIRMED,
        confirmedBy: userId,
        confirmedAt: new Date(),
      },
      include: {
        confirmer: {
          select: {
            id: true,
            name: true,
            email: true,
            grade: true,
          },
        },
      },
    });

    this.logger.log(
      `정산 확정: ${settlement.weekCode} (확정자: User ${userId})`,
    );

    return SettlementResponseDto.fromSettlement(updated);
  }

  /**
   * 정산 지급 처리 (CONFIRMED → PAID)
   */
  async pay(id: number): Promise<SettlementResponseDto> {
    const settlement = await this.findOne(id);

    if (settlement.status !== SettlementStatus.CONFIRMED) {
      throw new BadRequestException(
        'CONFIRMED 상태의 정산만 지급할 수 있습니다.',
      );
    }

    // 트랜잭션: 정산 상태 변경 + 보너스 상태 변경
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. 정산 상태 변경
      const settlementUpdated = await tx.settlement.update({
        where: { id },
        data: {
          status: SettlementStatus.PAID,
          paidAt: new Date(),
        },
      });

      // 2. 해당 정산의 모든 보너스 상태 변경 (CONFIRMED → PAID)
      const bonusUpdateResult = await tx.bonus.updateMany({
        where: { weekCode: settlement.weekCode },
        data: { status: BonusStatus.PAID },
      });

      this.logger.log(
        `정산 지급 처리: ${settlement.weekCode} (보너스 ${bonusUpdateResult.count}건 PAID)`,
      );

      return settlementUpdated;
    });

    return SettlementResponseDto.fromSettlement(updated);
  }

  /**
   * 정산 상태 변경 (관리자용 - 유연한 상태 변경)
   */
  async updateStatus(
    id: number,
    newStatus: SettlementStatus,
  ): Promise<SettlementResponseDto> {
    const settlement = await this.findOne(id);

    const updated = await this.prisma.settlement.update({
      where: { id },
      data: { status: newStatus },
    });

    this.logger.log(
      `정산 상태 변경: ${settlement.weekCode} (${settlement.status} → ${newStatus})`,
    );

    return SettlementResponseDto.fromSettlement(updated);
  }
}
