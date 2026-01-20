import { Module } from '@nestjs/common';
import { BackupTask } from './backup.task';
import { IntegritySchedulerService } from './integrity-scheduler.service';
import { MembersModule } from '../members/members.module';

/**
 * 스케줄 작업 모듈
 *
 * 포함된 작업:
 * - BackupTask: 매일 새벽 2시 자동 DB 백업
 * - IntegritySchedulerService: 매일 새벽 3시 회원 데이터 무결성 검사
 *
 * 참고: ScheduleModule.forRoot()는 AppModule에서 전역 등록됨
 */
@Module({
  imports: [MembersModule],
  providers: [BackupTask, IntegritySchedulerService],
  exports: [BackupTask, IntegritySchedulerService],
})
export class TasksModule {}
