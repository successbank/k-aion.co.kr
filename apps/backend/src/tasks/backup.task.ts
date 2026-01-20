import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

/**
 * 자동 백업 스케줄러
 * - 매일 새벽 2시 (서버 시간) 자동 백업 실행
 * - 30일 이상 된 백업 파일 자동 삭제
 * - 백업 실패 시 로그 기록
 *
 * 주의: @nestjs/schedule 패키지 설치 필요
 * npm install @nestjs/schedule
 */
@Injectable()
export class BackupTask {
  private readonly logger = new Logger(BackupTask.name);
  private readonly backupDir = '/data/successbank/projects/kaion/backups';
  private readonly maxBackupAgeDays = 30;

  /**
   * 매일 새벽 2시 자동 백업 실행
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyBackup() {
    this.logger.log('일일 자동 백업 시작...');

    try {
      // 1. 백업 디렉토리 확인/생성
      await this.ensureBackupDir();

      // 2. 데이터베이스 백업 실행
      const backupFile = await this.runDatabaseBackup();
      this.logger.log(`데이터베이스 백업 완료: ${backupFile}`);

      // 3. 오래된 백업 파일 정리
      const deletedCount = await this.cleanupOldBackups();
      if (deletedCount > 0) {
        this.logger.log(`오래된 백업 파일 ${deletedCount}개 삭제됨`);
      }

      this.logger.log('일일 자동 백업 완료');
    } catch (error) {
      this.logger.error('일일 자동 백업 실패', error instanceof Error ? error.stack : String(error));
    }
  }

  /**
   * 백업 디렉토리 확인 및 생성
   */
  private async ensureBackupDir(): Promise<void> {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      this.logger.log(`백업 디렉토리 생성: ${this.backupDir}`);
    }
  }

  /**
   * PostgreSQL 데이터베이스 백업 실행
   */
  private async runDatabaseBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFileName = `kaion_db_${timestamp}.sql.gz`;
    const backupFilePath = path.join(this.backupDir, backupFileName);

    // Docker 컨테이너 내부에서 pg_dump 실행 후 gzip 압축
    const command = `docker exec kaion_db pg_dump -U kaion_user -d kaion_db | gzip > ${backupFilePath}`;

    try {
      await execAsync(command);

      // 백업 파일 크기 확인
      const stats = fs.statSync(backupFilePath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      this.logger.log(`백업 파일 생성: ${backupFileName} (${fileSizeMB} MB)`);

      return backupFilePath;
    } catch (error) {
      // 백업 실패 시 빈 파일 삭제
      if (fs.existsSync(backupFilePath)) {
        fs.unlinkSync(backupFilePath);
      }
      throw error;
    }
  }

  /**
   * 오래된 백업 파일 삭제 (30일 이상)
   */
  private async cleanupOldBackups(): Promise<number> {
    const files = fs.readdirSync(this.backupDir);
    const now = Date.now();
    const maxAge = this.maxBackupAgeDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of files) {
      if (!file.startsWith('kaion_db_') || !file.endsWith('.sql.gz')) {
        continue;
      }

      const filePath = path.join(this.backupDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtime.getTime();

      if (fileAge > maxAge) {
        fs.unlinkSync(filePath);
        this.logger.log(`오래된 백업 파일 삭제: ${file}`);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * 수동 백업 실행 (API 호출용)
   */
  async runManualBackup(): Promise<{ success: boolean; message: string; file?: string }> {
    try {
      await this.ensureBackupDir();
      const backupFile = await this.runDatabaseBackup();
      return {
        success: true,
        message: '수동 백업이 완료되었습니다',
        file: path.basename(backupFile),
      };
    } catch (error) {
      this.logger.error('수동 백업 실패', error instanceof Error ? error.stack : String(error));
      return {
        success: false,
        message: `백업 실패: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 백업 목록 조회
   */
  getBackupList(): { name: string; size: string; createdAt: Date }[] {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }

    const files = fs.readdirSync(this.backupDir);
    return files
      .filter((file) => file.startsWith('kaion_db_') && file.endsWith('.sql.gz'))
      .map((file) => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
          createdAt: stats.mtime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
