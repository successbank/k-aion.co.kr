import { Module } from '@nestjs/common';
import { BackupTask } from './backup.task';
import { IntegritySchedulerService } from './integrity-scheduler.service';
import { SettlementSchedulerTask } from './settlement-scheduler.task';
import { MembersModule } from '../members/members.module';
import { SettlementsModule } from '../settlements/settlements.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * 스케줄 작업 모듈
 *
 * 포함된 작업:
 * - BackupTask: 매일 새벽 2시 자동 DB 백업
 * - IntegritySchedulerService: 매일 새벽 3시 회원 데이터 무결성 검사
 * - SettlementSchedulerTask: 매분 실행, 활성 스케줄 확인 후 자동 정산 생성
 *
 * 참고: ScheduleModule.forRoot()는 AppModule에서 전역 등록됨
 */
@Module({
  imports: [MembersModule, SettlementsModule, PrismaModule],
  providers: [BackupTask, IntegritySchedulerService, SettlementSchedulerTask],
  exports: [BackupTask, IntegritySchedulerService, SettlementSchedulerTask],
})
export class TasksModule {}
