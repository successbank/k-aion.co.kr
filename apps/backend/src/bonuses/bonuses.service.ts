import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BonusResponseDto } from './dto/bonus-response.dto';
import { BonusStatus, BonusType } from '@prisma/client';

@Injectable()
export class BonusesService {
  private readonly logger = new Logger(BonusesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 보너스 목록 조회 (페이징)
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    memberId?: number;
    weekCode?: string;
    status?: BonusStatus;
    bonusType?: BonusType;
  }): Promise<{
    data: BonusResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, memberId, weekCode, status, bonusType } = params;

    const where: any = {};

    if (memberId) {
      where.memberId = memberId;
    }

    if (weekCode) {
      where.weekCode = weekCode;
    }

    if (status) {
      where.status = status;
    }

    if (bonusType) {
      where.bonusType = bonusType;
    }

    const [bonuses, total] = await Promise.all([
      this.prisma.bonus.findMany({
        where,
        include: {
          member: {
            select: {
              id: true,
              name: true,
              grade: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bonus.count({ where }),
    ]);

    return {
      data: bonuses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 보너스 상세 조회
   */
  async findOne(id: number): Promise<BonusResponseDto> {
    const bonus = await this.prisma.bonus.findUnique({
      where: { id },
    });

    if (!bonus) {
      throw new NotFoundException(`보너스 ID ${id}를 찾을 수 없습니다.`);
    }

    return bonus;
  }

  /**
   * 회원별 보너스 통계
   */
  async getMemberBonusSummary(
    memberId: number,
    weekCode?: string,
  ): Promise<{
    totalBonus: number;
    bonusByType: Record<BonusType, number>;
    bonusByStatus: Record<BonusStatus, number>;
  }> {
    const where: any = { memberId };

    if (weekCode) {
      where.weekCode = weekCode;
    }

    const bonuses = await this.prisma.bonus.findMany({
      where,
    });

    const totalBonus = bonuses.reduce((sum, b) => sum + b.amount, 0);

    const bonusByType = bonuses.reduce(
      (acc, b) => {
        acc[b.bonusType] = (acc[b.bonusType] || 0) + b.amount;
        return acc;
      },
      {} as Record<BonusType, number>,
    );

    const bonusByStatus = bonuses.reduce(
      (acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + b.amount;
        return acc;
      },
      {} as Record<BonusStatus, number>,
    );

    return {
      totalBonus,
      bonusByType,
      bonusByStatus,
    };
  }
}
