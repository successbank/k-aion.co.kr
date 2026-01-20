import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettlementCycleType } from '@prisma/client';
import {
  CreateSettlementScheduleDto,
  UpdateSettlementScheduleDto,
  SettlementScheduleResponseDto,
} from './dto/settlement-schedule.dto';

/**
 * 정산 스케줄 관리 서비스
 * - 시스템에 하나의 활성 스케줄만 허용
 * - 다음 실행 시간 자동 계산
 */
@Injectable()
export class SettlementScheduleService {
  private readonly logger = new Logger(SettlementScheduleService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 활성 스케줄 조회 (시스템에 하나만 존재)
   */
  async getActiveSchedule(): Promise<SettlementScheduleResponseDto | null> {
    const schedule = await this.prisma.settlementSchedule.findFirst({
      where: { isActive: true },
    });

    if (!schedule) {
      return null;
    }

    return this.toResponseDto(schedule);
  }

  /**
   * 모든 스케줄 조회
   */
  async findAll(): Promise<SettlementScheduleResponseDto[]> {
    const schedules = await this.prisma.settlementSchedule.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return schedules.map((s) => this.toResponseDto(s));
  }

  /**
   * 스케줄 상세 조회
   */
  async findOne(id: number): Promise<SettlementScheduleResponseDto> {
    const schedule = await this.prisma.settlementSchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException(`스케줄 ID ${id}를 찾을 수 없습니다.`);
    }

    return this.toResponseDto(schedule);
  }

  /**
   * 스케줄 생성
   * - 새 스케줄 생성 시 기존 활성 스케줄 비활성화
   */
  async create(dto: CreateSettlementScheduleDto): Promise<SettlementScheduleResponseDto> {
    // 주기 타입에 따른 필수 필드 검증
    this.validateCycleFields(dto.cycleType, dto.dayOfWeek, dto.dayOfMonth);

    // 트랜잭션으로 기존 활성 스케줄 비활성화 후 새 스케줄 생성
    const schedule = await this.prisma.$transaction(async (tx) => {
      // 기존 활성 스케줄 비활성화
      await tx.settlementSchedule.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // 다음 실행 시간 계산
      const nextRunAt = this.calculateNextRunTime(
        dto.cycleType,
        dto.hour,
        dto.minute,
        dto.dayOfWeek,
        dto.dayOfMonth,
      );

      // 새 스케줄 생성
      return tx.settlementSchedule.create({
        data: {
          name: dto.name,
          cycleType: dto.cycleType,
          dayOfWeek: dto.dayOfWeek,
          dayOfMonth: dto.dayOfMonth,
          hour: dto.hour,
          minute: dto.minute,
          isActive: dto.isActive ?? true,
          nextRunAt,
        },
      });
    });

    this.logger.log(`정산 스케줄 생성: ${schedule.name} (${schedule.cycleType})`);

    return this.toResponseDto(schedule);
  }

  /**
   * 스케줄 수정
   */
  async update(id: number, dto: UpdateSettlementScheduleDto): Promise<SettlementScheduleResponseDto> {
    const existing = await this.prisma.settlementSchedule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`스케줄 ID ${id}를 찾을 수 없습니다.`);
    }

    // 주기 타입 변경 시 필드 검증
    const cycleType = dto.cycleType ?? existing.cycleType;
    const dayOfWeek = dto.dayOfWeek ?? existing.dayOfWeek;
    const dayOfMonth = dto.dayOfMonth ?? existing.dayOfMonth;
    this.validateCycleFields(cycleType, dayOfWeek, dayOfMonth);

    // 다음 실행 시간 재계산
    const hour = dto.hour ?? existing.hour;
    const minute = dto.minute ?? existing.minute;
    const nextRunAt = this.calculateNextRunTime(
      cycleType,
      hour,
      minute,
      dayOfWeek,
      dayOfMonth,
    );

    // 활성화 변경 시 다른 스케줄 처리
    const schedule = await this.prisma.$transaction(async (tx) => {
      if (dto.isActive === true) {
        // 이 스케줄을 활성화하면 다른 스케줄 비활성화
        await tx.settlementSchedule.updateMany({
          where: { id: { not: id }, isActive: true },
          data: { isActive: false },
        });
      }

      return tx.settlementSchedule.update({
        where: { id },
        data: {
          ...dto,
          nextRunAt,
        },
      });
    });

    this.logger.log(`정산 스케줄 수정: ${schedule.name}`);

    return this.toResponseDto(schedule);
  }

  /**
   * 스케줄 삭제
   */
  async remove(id: number): Promise<void> {
    const existing = await this.prisma.settlementSchedule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`스케줄 ID ${id}를 찾을 수 없습니다.`);
    }

    await this.prisma.settlementSchedule.delete({
      where: { id },
    });

    this.logger.log(`정산 스케줄 삭제: ${existing.name}`);
  }

  /**
   * 실행 완료 후 다음 실행 시간 업데이트
   */
  async markAsRun(id: number): Promise<void> {
    const schedule = await this.prisma.settlementSchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return;
    }

    const nextRunAt = this.calculateNextRunTime(
      schedule.cycleType,
      schedule.hour,
      schedule.minute,
      schedule.dayOfWeek,
      schedule.dayOfMonth,
    );

    await this.prisma.settlementSchedule.update({
      where: { id },
      data: {
        lastRunAt: new Date(),
        nextRunAt,
      },
    });
  }

  /**
   * 주기 타입에 따른 필수 필드 검증
   */
  private validateCycleFields(
    cycleType: SettlementCycleType,
    dayOfWeek?: number | null,
    dayOfMonth?: number | null,
  ): void {
    if (cycleType === SettlementCycleType.WEEKLY && dayOfWeek === undefined) {
      throw new BadRequestException('주간 스케줄은 요일(dayOfWeek)이 필요합니다.');
    }

    if (cycleType === SettlementCycleType.MONTHLY && dayOfMonth === undefined) {
      throw new BadRequestException('월간 스케줄은 날짜(dayOfMonth)가 필요합니다.');
    }
  }

  /**
   * 다음 실행 시간 계산
   */
  calculateNextRunTime(
    cycleType: SettlementCycleType,
    hour: number,
    minute: number,
    dayOfWeek?: number | null,
    dayOfMonth?: number | null,
  ): Date {
    const now = new Date();
    const next = new Date(now);
    next.setHours(hour, minute, 0, 0);

    switch (cycleType) {
      case SettlementCycleType.DAILY:
        // 오늘 실행 시간이 지났으면 내일로
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        break;

      case SettlementCycleType.WEEKLY:
        if (dayOfWeek !== undefined && dayOfWeek !== null) {
          const currentDay = now.getDay();
          let daysUntilTarget = dayOfWeek - currentDay;

          // 같은 요일이면서 시간이 지났거나, 이전 요일이면 다음 주로
          if (daysUntilTarget < 0 || (daysUntilTarget === 0 && next <= now)) {
            daysUntilTarget += 7;
          }

          next.setDate(now.getDate() + daysUntilTarget);
        }
        break;

      case SettlementCycleType.MONTHLY:
        if (dayOfMonth !== undefined && dayOfMonth !== null) {
          next.setDate(dayOfMonth);

          // 이번 달 해당 일이 지났으면 다음 달로
          if (next <= now) {
            next.setMonth(next.getMonth() + 1);
          }

          // 월의 마지막 날 처리 (예: 31일이 없는 달)
          const lastDayOfMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
          if (dayOfMonth > lastDayOfMonth) {
            next.setDate(lastDayOfMonth);
          }
        }
        break;
    }

    return next;
  }

  /**
   * 응답 DTO 변환
   */
  private toResponseDto(schedule: any): SettlementScheduleResponseDto {
    const dto: SettlementScheduleResponseDto = {
      id: schedule.id,
      name: schedule.name,
      cycleType: schedule.cycleType,
      dayOfWeek: schedule.dayOfWeek,
      dayOfMonth: schedule.dayOfMonth,
      hour: schedule.hour,
      minute: schedule.minute,
      isActive: schedule.isActive,
      lastRunAt: schedule.lastRunAt,
      nextRunAt: schedule.nextRunAt,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    };

    // 한글 주기 설명 생성
    dto.cycleDescription = this.getCycleDescription(schedule);
    dto.nextRunDescription = schedule.nextRunAt
      ? this.formatDate(schedule.nextRunAt)
      : undefined;

    return dto;
  }

  /**
   * 한글 주기 설명 생성
   */
  private getCycleDescription(schedule: any): string {
    const timeStr = `${String(schedule.hour).padStart(2, '0')}:${String(schedule.minute).padStart(2, '0')}`;
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    switch (schedule.cycleType) {
      case SettlementCycleType.DAILY:
        return `매일 ${timeStr}`;
      case SettlementCycleType.WEEKLY:
        return `매주 ${dayNames[schedule.dayOfWeek]}요일 ${timeStr}`;
      case SettlementCycleType.MONTHLY:
        return `매월 ${schedule.dayOfMonth}일 ${timeStr}`;
      default:
        return '';
    }
  }

  /**
   * 날짜 포맷
   */
  private formatDate(date: Date): string {
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
