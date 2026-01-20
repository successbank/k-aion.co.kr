import { Module } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';

/**
 * 백업/복구 관리 모듈
 *
 * 기능:
 * - 백업 목록 조회
 * - 수동 백업 생성
 * - 백업 파일 다운로드
 * - 백업 파일 삭제
 * - 데이터베이스 복구
 * - 작업 로그 조회
 *
 * 권한: ADMIN 전용
 */
@Module({
  imports: [PrismaModule, TasksModule],
  controllers: [BackupController],
  providers: [BackupService],
  exports: [BackupService],
})
export class BackupModule {}
