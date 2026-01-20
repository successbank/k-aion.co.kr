import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

// 활동 유형 정의
export enum ActivityAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  SALE_CREATED = 'SALE_CREATED',
  SALE_CONFIRMED = 'SALE_CONFIRMED',
  BONUS_RECEIVED = 'BONUS_RECEIVED',
  GRADE_CHANGED = 'GRADE_CHANGED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MEMBER_CREATED = 'MEMBER_CREATED',
  MEMBER_UPDATED = 'MEMBER_UPDATED',
  MEMBER_ROLLBACK = 'MEMBER_ROLLBACK', // 회원 정보 롤백
}

// 대상 유형 정의
export enum TargetType {
  SALE = 'SALE',
  BONUS = 'BONUS',
  MEMBER = 'MEMBER',
  ORDER = 'ORDER',
  SETTLEMENT = 'SETTLEMENT',
}

export interface CreateActivityLogDto {
  memberId: number;
  action: ActivityAction | string;
  targetType?: TargetType | string;
  targetId?: number;
  details?: Record<string, any>;
  ipAddress?: string;
}

export interface FindAllActivityLogsDto {
  page: number;
  limit: number;
  action?: string;
  memberId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetStatsDto {
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class ActivityLogsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 활동 로그 기록
   */
  async log(dto: CreateActivityLogDto) {
    return this.prisma.activityLog.create({
      data: {
        memberId: dto.memberId,
        action: dto.action,
        targetType: dto.targetType || null,
        targetId: dto.targetId || null,
        details: dto.details ? (dto.details as Prisma.JsonObject) : Prisma.JsonNull,
        ipAddress: dto.ipAddress || null,
      },
    });
  }

  /**
   * 전체 활동 로그 목록 조회 (관리자용)
   */
  async findAll(dto: FindAllActivityLogsDto) {
    const { page, limit, action, memberId, search, startDate, endDate } = dto;
    const skip = (page - 1) * limit;

    // 검색 조건 구성
    const where: Prisma.ActivityLogWhereInput = {};

    if (action) {
      where.action = action;
    }

    if (memberId) {
      where.memberId = memberId;
    }

    if (search) {
      where.member = {
        OR: [
          { name: { contains: search } },
          { username: { contains: search } },
          { phone: { contains: search } },
        ],
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              username: true,
              grade: true,
            },
          },
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 전체 활동 로그 통계 (관리자용)
   */
  async getStats(dto: GetStatsDto) {
    const { startDate, endDate } = dto;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 기간 조건
    const periodWhere: Prisma.ActivityLogWhereInput = {};
    if (startDate || endDate) {
      periodWhere.createdAt = {};
      if (startDate) {
        periodWhere.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        periodWhere.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    const [total, today, thisWeek, thisMonth, byAction] = await Promise.all([
      this.prisma.activityLog.count({ where: periodWhere }),
      this.prisma.activityLog.count({
        where: { ...periodWhere, createdAt: { gte: todayStart } },
      }),
      this.prisma.activityLog.count({
        where: { ...periodWhere, createdAt: { gte: weekStart } },
      }),
      this.prisma.activityLog.count({
        where: { ...periodWhere, createdAt: { gte: monthStart } },
      }),
      this.prisma.activityLog.groupBy({
        by: ['action'],
        where: periodWhere,
        _count: true,
        orderBy: { _count: { action: 'desc' } },
      }),
    ]);

    return {
      total,
      today,
      thisWeek,
      thisMonth,
      byAction: byAction.map((item) => ({
        action: item.action,
        count: item._count,
      })),
    };
  }

  /**
   * 회원별 활동 이력 조회
   */
  async findByMember(memberId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { memberId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activityLog.count({ where: { memberId } }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 회원별 활동 이력 (종합 - 판매/보너스/주문 포함)
   */
  async getMemberActivityHistory(memberId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // 활동 로그 조회
    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { memberId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activityLog.count({ where: { memberId } }),
    ]);

    // 연관 데이터 ID 수집
    const saleIds = logs
      .filter((l) => l.targetType === TargetType.SALE && l.targetId)
      .map((l) => l.targetId!);
    const bonusIds = logs
      .filter((l) => l.targetType === TargetType.BONUS && l.targetId)
      .map((l) => l.targetId!);
    const orderIds = logs
      .filter((l) => l.targetType === TargetType.ORDER && l.targetId)
      .map((l) => l.targetId!);

    // 연관 데이터 조회
    const sales =
      saleIds.length > 0
        ? await this.prisma.sale.findMany({
            where: { id: { in: saleIds } },
            include: {
              product: { select: { id: true, name: true, code: true } },
            },
          })
        : [];

    const bonuses =
      bonusIds.length > 0
        ? await this.prisma.bonus.findMany({
            where: { id: { in: bonusIds } },
          })
        : [];

    const orders =
      orderIds.length > 0
        ? await this.prisma.order.findMany({
            where: { id: { in: orderIds } },
          })
        : [];

    // 로그에 연관 데이터 매핑
    const enrichedLogs = logs.map((log) => {
      let relatedData: any = null;

      if (log.targetType === TargetType.SALE && log.targetId) {
        relatedData = sales.find((s) => s.id === log.targetId) || null;
      } else if (log.targetType === TargetType.BONUS && log.targetId) {
        relatedData = bonuses.find((b) => b.id === log.targetId) || null;
      } else if (log.targetType === TargetType.ORDER && log.targetId) {
        relatedData = orders.find((o) => o.id === log.targetId) || null;
      }

      return {
        ...log,
        relatedData,
      };
    });

    return {
      data: enrichedLogs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 특정 기간 활동 통계
   */
  async getMemberActivityStats(memberId: number, startDate?: Date, endDate?: Date) {
    const where: Prisma.ActivityLogWhereInput = {
      memberId,
      ...(startDate && endDate
        ? {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {}),
    };

    const stats = await this.prisma.activityLog.groupBy({
      by: ['action'],
      where,
      _count: true,
    });

    const totalLogs = await this.prisma.activityLog.count({ where: { memberId } });

    return {
      totalActivities: totalLogs,
      byAction: stats.map((s) => ({
        action: s.action,
        count: s._count,
      })),
    };
  }

  /**
   * 최근 로그인 기록
   */
  async getRecentLogins(memberId: number, limit = 5) {
    return this.prisma.activityLog.findMany({
      where: {
        memberId,
        action: ActivityAction.LOGIN,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
