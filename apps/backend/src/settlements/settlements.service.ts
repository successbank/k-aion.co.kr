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
import {
  CreateManualSettlementDto,
  OverlapCheckResultDto,
} from './dto/create-manual-settlement.dto';

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

  /**
   * 정산 기간 중복 체크 (이중정산 방지)
   * 기존 정산 기간과 겹치는지 확인
   */
  async checkOverlap(startDate: Date, endDate: Date): Promise<OverlapCheckResultDto> {
    const conflicts = await this.prisma.settlement.findMany({
      where: {
        OR: [
          // 새 시작일이 기존 기간 내에 있는 경우
          {
            startDate: { lte: startDate },
            endDate: { gte: startDate },
          },
          // 새 종료일이 기존 기간 내에 있는 경우
          {
            startDate: { lte: endDate },
            endDate: { gte: endDate },
          },
          // 새 기간이 기존 기간을 완전히 포함하는 경우
          {
            startDate: { gte: startDate },
            endDate: { lte: endDate },
          },
        ],
      },
      select: {
        id: true,
        weekCode: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { startDate: 'desc' },
    });

    const overlaps = conflicts.length > 0;

    return {
      overlaps,
      conflictingSettlements: conflicts.map((c) => ({
        id: c.id,
        weekCode: c.weekCode,
        startDate: c.startDate,
        endDate: c.endDate,
      })),
      message: overlaps
        ? `${conflicts.length}개의 기존 정산과 기간이 겹칩니다.`
        : '중복되는 정산 기간이 없습니다.',
    };
  }

  /**
   * 최근 정산 이후 날짜인지 검증
   * 특정날짜 정산은 기존 정산 이후만 가능
   */
  async validateDateAfterLatest(startDate: Date): Promise<{ valid: boolean; latestEndDate?: Date; message: string }> {
    const latestSettlement = await this.prisma.settlement.findFirst({
      orderBy: { endDate: 'desc' },
      select: { endDate: true, weekCode: true },
    });

    if (!latestSettlement) {
      return {
        valid: true,
        message: '기존 정산이 없습니다. 생성 가능합니다.',
      };
    }

    const valid = startDate > latestSettlement.endDate;

    return {
      valid,
      latestEndDate: latestSettlement.endDate,
      message: valid
        ? '유효한 시작 날짜입니다.'
        : `시작 날짜는 마지막 정산(${latestSettlement.weekCode}) 종료일(${latestSettlement.endDate.toISOString().split('T')[0]}) 이후여야 합니다.`,
    };
  }

  /**
   * 주차 코드 자동 생성 (YYYY-Wnn 형식)
   */
  generateWeekCode(date: Date): string {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  }

  /**
   * 고유한 주차 코드 생성 (중복 시 접미사 추가)
   */
  async generateUniqueWeekCode(date: Date): Promise<string> {
    const baseCode = this.generateWeekCode(date);
    let weekCode = baseCode;
    let suffix = 1;

    while (await this.prisma.settlement.findUnique({ where: { weekCode } })) {
      weekCode = `${baseCode}-${suffix}`;
      suffix++;
    }

    return weekCode;
  }

  /**
   * 수동(특정날짜) 정산 생성
   * - 중복 체크 후 완전 차단 (강제 진행 불가)
   * - 최근 정산 이후 날짜만 허용
   */
  async createManualSettlement(dto: CreateManualSettlementDto): Promise<SettlementResponseDto> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // 1. 날짜 유효성 검사
    if (startDate > endDate) {
      throw new BadRequestException('시작일이 종료일보다 클 수 없습니다.');
    }

    // 2. 중복 체크 (이중정산 방지)
    const overlapResult = await this.checkOverlap(startDate, endDate);
    if (overlapResult.overlaps) {
      throw new BadRequestException(
        `이중정산 방지: ${overlapResult.message} 기간이 겹치는 정산: ${overlapResult.conflictingSettlements.map((s) => s.weekCode).join(', ')}`,
      );
    }

    // 3. 최근 정산 이후 날짜 검증
    const dateValidation = await this.validateDateAfterLatest(startDate);
    if (!dateValidation.valid) {
      throw new BadRequestException(dateValidation.message);
    }

    // 4. 주차 코드 생성 (제공되지 않은 경우)
    const weekCode = dto.weekCode || (await this.generateUniqueWeekCode(startDate));

    // 5. 정산 생성 (OPEN 상태)
    const settlement = await this.prisma.settlement.create({
      data: {
        weekCode,
        startDate,
        endDate,
        status: SettlementStatus.OPEN,
      },
    });

    this.logger.log(
      `수동 정산 생성: ${weekCode} (${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]})`,
    );

    return SettlementResponseDto.fromSettlement(settlement);
  }

  /**
   * 자동정산용 정산 생성 (스케줄러에서 호출)
   * 이전 정산 종료일 다음날 ~ 오늘(또는 어제) 기간으로 생성
   */
  async createAutoSettlement(): Promise<SettlementResponseDto | null> {
    // 마지막 정산 조회
    const lastSettlement = await this.prisma.settlement.findFirst({
      orderBy: { endDate: 'desc' },
    });

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (lastSettlement) {
      // 마지막 정산 종료일 다음 날부터
      startDate = new Date(lastSettlement.endDate);
      startDate.setDate(startDate.getDate() + 1);
    } else {
      // 첫 정산이면 7일 전부터
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    }

    // 어제까지로 설정 (오늘 매출은 다음 정산에 포함)
    endDate = new Date(now);
    endDate.setDate(endDate.getDate() - 1);

    // 시작일이 종료일보다 크면 생성하지 않음
    if (startDate > endDate) {
      this.logger.log('자동정산: 정산할 기간이 없습니다.');
      return null;
    }

    // 중복 체크
    const overlapResult = await this.checkOverlap(startDate, endDate);
    if (overlapResult.overlaps) {
      this.logger.warn(`자동정산: 기간 중복으로 생성 취소 - ${overlapResult.message}`);
      return null;
    }

    // 주차 코드 생성 및 정산 생성
    const weekCode = await this.generateUniqueWeekCode(startDate);

    const settlement = await this.prisma.settlement.create({
      data: {
        weekCode,
        startDate,
        endDate,
        status: SettlementStatus.OPEN,
      },
    });

    this.logger.log(
      `자동정산 생성: ${weekCode} (${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]})`,
    );

    return SettlementResponseDto.fromSettlement(settlement);
  }
}
