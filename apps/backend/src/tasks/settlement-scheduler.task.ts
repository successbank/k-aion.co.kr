import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SettlementsService } from '../settlements/settlements.service';
import { SettlementScheduleService } from '../settlements/settlement-schedule.service';

/**
 * 정산 자동 스케줄러
 * - 매분 실행하여 활성 스케줄의 nextRunAt 확인
 * - 실행 시간이 되면 자동 정산 생성 (OPEN 상태)
 */
@Injectable()
export class SettlementSchedulerTask {
  private readonly logger = new Logger(SettlementSchedulerTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settlementsService: SettlementsService,
    private readonly scheduleService: SettlementScheduleService,
  ) {}

  /**
   * 매분 실행 - 정산 스케줄 확인
   */
  @Cron('0 * * * * *') // 매분 0초에 실행
  async handleScheduledSettlement() {
    try {
      // 활성 스케줄 중 실행 시간이 된 것 찾기
      const now = new Date();
      const dueSchedules = await this.prisma.settlementSchedule.findMany({
        where: {
          isActive: true,
          nextRunAt: { lte: now },
        },
      });

      if (dueSchedules.length === 0) {
        return; // 실행할 스케줄 없음
      }

      for (const schedule of dueSchedules) {
        this.logger.log(`정산 스케줄 실행: ${schedule.name} (ID: ${schedule.id})`);

        try {
          // 자동 정산 생성
          const settlement = await this.settlementsService.createAutoSettlement();

          if (settlement) {
            this.logger.log(
              `자동 정산 생성 완료: ${settlement.weekCode} (스케줄: ${schedule.name})`,
            );
          } else {
            this.logger.log(
              `자동 정산 생성 건너뜀: 정산할 기간이 없거나 중복 (스케줄: ${schedule.name})`,
            );
          }

          // 스케줄 실행 완료 표시 및 다음 실행 시간 업데이트
          await this.scheduleService.markAsRun(schedule.id);
        } catch (error) {
          this.logger.error(
            `자동 정산 생성 실패 (스케줄: ${schedule.name}): ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `정산 스케줄러 오류: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 수동으로 스케줄 실행 (테스트/관리용)
   */
  async runScheduleManually(scheduleId: number): Promise<{ success: boolean; message: string }> {
    const schedule = await this.prisma.settlementSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      return { success: false, message: '스케줄을 찾을 수 없습니다.' };
    }

    try {
      const settlement = await this.settlementsService.createAutoSettlement();

      if (settlement) {
        await this.scheduleService.markAsRun(scheduleId);
        return {
          success: true,
          message: `정산 생성 완료: ${settlement.weekCode}`,
        };
      } else {
        return {
          success: false,
          message: '정산할 기간이 없거나 중복됩니다.',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `오류 발생: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
