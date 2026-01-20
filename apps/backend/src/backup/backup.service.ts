import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { BackupTask } from '../tasks/backup.task';
import {
  BackupFileDto,
  BackupStatusDto,
  BackupLogItemDto,
} from './dto';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = '/data/successbank/projects/kaion/backups';
  private readonly maxBackupAgeDays = 30;
  private isRestoring = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly backupTask: BackupTask,
  ) {}

  /**
   * 백업 목록 조회
   */
  async getBackupList(): Promise<BackupFileDto[]> {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }

    const files = fs.readdirSync(this.backupDir);
    return files
      .filter((file) => file.startsWith('kaion_db_') && file.endsWith('.sql.gz'))
      .map((file) => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        const isManual = file.includes('manual') || file.includes('pre_restore');

        return {
          filename: file,
          size: stats.size,
          sizeDisplay: this.formatFileSize(stats.size),
          createdAt: stats.mtime,
          type: isManual ? 'manual' as const : 'auto' as const,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * 백업 상태 대시보드 조회
   */
  async getStatus(): Promise<BackupStatusDto> {
    const backups = await this.getBackupList();
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    const lastBackup = backups.length > 0 ? backups[0].createdAt : null;

    // 다음 자동 백업 시간 계산 (매일 오전 2시)
    const now = new Date();
    const nextBackup = new Date(now);
    nextBackup.setHours(2, 0, 0, 0);
    if (nextBackup <= now) {
      nextBackup.setDate(nextBackup.getDate() + 1);
    }

    return {
      lastBackupAt: lastBackup,
      totalBackups: backups.length,
      totalSize,
      totalSizeDisplay: this.formatFileSize(totalSize),
      nextScheduledBackup: nextBackup,
      retentionDays: this.maxBackupAgeDays,
    };
  }

  /**
   * 수동 백업 생성
   */
  async createBackup(executedById?: number): Promise<{ filename: string; size: number; sizeDisplay: string }> {
    this.logger.log('수동 백업 시작...');

    try {
      // 백업 디렉토리 확인/생성
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupFileName = `kaion_db_${timestamp}_manual.sql.gz`;
      const backupFilePath = path.join(this.backupDir, backupFileName);

      // Docker 컨테이너 내부에서 pg_dump 실행 후 gzip 압축
      const command = `docker exec kaion_db pg_dump -U kaion_user -d kaion_db | gzip > ${backupFilePath}`;
      await execAsync(command);

      // 백업 파일 크기 확인
      const stats = fs.statSync(backupFilePath);

      // 로그 기록
      await this.logOperation('BACKUP', 'SUCCESS', backupFileName, stats.size, '수동 백업 완료', executedById);

      this.logger.log(`수동 백업 완료: ${backupFileName}`);

      return {
        filename: backupFileName,
        size: stats.size,
        sizeDisplay: this.formatFileSize(stats.size),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.logOperation('BACKUP', 'FAILED', null, null, `수동 백업 실패: ${errorMessage}`, executedById);
      this.logger.error('수동 백업 실패', error);
      throw error;
    }
  }

  /**
   * 백업 파일 복구
   */
  async restore(filename: string, executedById?: number): Promise<{ safetyBackupFilename: string }> {
    // 동시 복구 방지
    if (this.isRestoring) {
      throw new BadRequestException('이미 복구 작업이 진행 중입니다');
    }

    // 파일명 검증 (Path Traversal 방지)
    this.validateFilename(filename);

    const backupFilePath = path.join(this.backupDir, filename);
    if (!fs.existsSync(backupFilePath)) {
      throw new NotFoundException('백업 파일을 찾을 수 없습니다');
    }

    this.isRestoring = true;
    this.logger.log(`복구 시작: ${filename}`);

    try {
      // 1. 안전 백업 생성
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const safetyBackupFileName = `kaion_db_${timestamp}_pre_restore.sql.gz`;
      const safetyBackupPath = path.join(this.backupDir, safetyBackupFileName);

      this.logger.log('안전 백업 생성 중...');
      const safetyBackupCommand = `docker exec kaion_db pg_dump -U kaion_user -d kaion_db | gzip > ${safetyBackupPath}`;
      await execAsync(safetyBackupCommand);
      this.logger.log(`안전 백업 완료: ${safetyBackupFileName}`);

      // 2. 압축 해제 및 복구
      this.logger.log('데이터베이스 복구 중...');
      const restoreCommand = `gunzip -c ${backupFilePath} | docker exec -i kaion_db psql -U kaion_user -d kaion_db`;
      await execAsync(restoreCommand);

      // 로그 기록
      await this.logOperation('RESTORE', 'SUCCESS', filename, null, `복구 완료. 안전백업: ${safetyBackupFileName}`, executedById);

      this.logger.log(`복구 완료: ${filename}`);

      return { safetyBackupFilename: safetyBackupFileName };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.logOperation('RESTORE', 'FAILED', filename, null, `복구 실패: ${errorMessage}`, executedById);
      this.logger.error('복구 실패', error);
      throw error;
    } finally {
      this.isRestoring = false;
    }
  }

  /**
   * 백업 파일 삭제
   */
  async deleteBackup(filename: string, executedById?: number): Promise<void> {
    // 파일명 검증 (Path Traversal 방지)
    this.validateFilename(filename);

    const backupFilePath = path.join(this.backupDir, filename);
    if (!fs.existsSync(backupFilePath)) {
      throw new NotFoundException('백업 파일을 찾을 수 없습니다');
    }

    try {
      fs.unlinkSync(backupFilePath);
      await this.logOperation('DELETE', 'SUCCESS', filename, null, '백업 파일 삭제 완료', executedById);
      this.logger.log(`백업 파일 삭제: ${filename}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.logOperation('DELETE', 'FAILED', filename, null, `삭제 실패: ${errorMessage}`, executedById);
      this.logger.error('백업 파일 삭제 실패', error);
      throw error;
    }
  }

  /**
   * 백업 파일 다운로드용 경로 반환
   */
  getBackupFilePath(filename: string): string {
    // 파일명 검증 (Path Traversal 방지)
    this.validateFilename(filename);

    const backupFilePath = path.join(this.backupDir, filename);
    if (!fs.existsSync(backupFilePath)) {
      throw new NotFoundException('백업 파일을 찾을 수 없습니다');
    }

    return backupFilePath;
  }

  /**
   * 작업 로그 조회
   */
  async getLogs(page: number = 1, limit: number = 10): Promise<{
    data: BackupLogItemDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.backupLog.findMany({
        skip,
        take: limit,
        orderBy: { executedAt: 'desc' },
        include: {
          executedBy: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.backupLog.count(),
    ]);

    return {
      data: logs.map((log) => ({
        id: log.id,
        operation: log.operation,
        status: log.status,
        filename: log.filename,
        fileSize: log.fileSize,
        message: log.message,
        executedBy: log.executedBy,
        executedAt: log.executedAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 파일명 검증 (Path Traversal 방지)
   */
  private validateFilename(filename: string): void {
    if (!filename) {
      throw new BadRequestException('파일명은 필수입니다');
    }

    // Path traversal 공격 방지
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new BadRequestException('유효하지 않은 파일명입니다');
    }

    // 허용된 파일명 패턴 검증
    const validPattern = /^kaion_db_[\d\-T]+(_manual|_pre_restore)?\.sql\.gz$/;
    if (!validPattern.test(filename)) {
      throw new BadRequestException('유효하지 않은 백업 파일명입니다');
    }
  }

  /**
   * 작업 로그 기록
   */
  private async logOperation(
    operation: 'BACKUP' | 'RESTORE' | 'DELETE',
    status: 'SUCCESS' | 'FAILED',
    filename: string | null,
    fileSize: number | null,
    message: string,
    executedById?: number,
  ): Promise<void> {
    try {
      await this.prisma.backupLog.create({
        data: {
          operation,
          status,
          filename,
          fileSize,
          message,
          executedById: executedById || null,
        },
      });
    } catch (error) {
      this.logger.error('백업 로그 기록 실패', error);
    }
  }

  /**
   * 파일 크기 포맷
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
