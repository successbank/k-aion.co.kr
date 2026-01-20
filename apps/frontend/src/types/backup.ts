/**
 * 백업 파일 정보
 */
export interface BackupFile {
  filename: string;
  size: number;
  sizeDisplay: string;
  createdAt: string;
  type: 'auto' | 'manual';
}

/**
 * 백업 상태 대시보드 정보
 */
export interface BackupStatus {
  lastBackupAt: string | null;
  totalBackups: number;
  totalSize: number;
  totalSizeDisplay: string;
  nextScheduledBackup: string;
  retentionDays: number;
}

/**
 * 백업 작업 유형
 */
export type BackupOperation = 'BACKUP' | 'RESTORE' | 'DELETE';

/**
 * 백업 작업 상태
 */
export type BackupLogStatus = 'SUCCESS' | 'FAILED';

/**
 * 백업 작업 로그 항목
 */
export interface BackupLogItem {
  id: number;
  operation: BackupOperation;
  status: BackupLogStatus;
  filename: string | null;
  fileSize: number | null;
  message: string;
  executedBy: { id: number; name: string } | null;
  executedAt: string;
}

/**
 * 백업 목록 응답
 */
export interface BackupListResponse {
  success: boolean;
  message: string;
  data: BackupFile[];
}

/**
 * 백업 상태 응답
 */
export interface BackupStatusResponse {
  success: boolean;
  message: string;
  data: BackupStatus;
}

/**
 * 백업 생성 응답
 */
export interface BackupCreateResponse {
  success: boolean;
  message: string;
  filename?: string;
  sizeDisplay?: string;
}

/**
 * 복구 응답
 */
export interface RestoreResponse {
  success: boolean;
  message: string;
  safetyBackupFilename?: string;
}

/**
 * 백업 삭제 응답
 */
export interface BackupDeleteResponse {
  success: boolean;
  message: string;
}

/**
 * 백업 로그 목록 응답
 */
export interface BackupLogListResponse {
  success: boolean;
  message: string;
  data: BackupLogItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * 작업 유형 한글 레이블
 */
export const OperationLabels: Record<BackupOperation, string> = {
  BACKUP: '백업',
  RESTORE: '복구',
  DELETE: '삭제',
};

/**
 * 작업 상태 한글 레이블
 */
export const StatusLabels: Record<BackupLogStatus, string> = {
  SUCCESS: '성공',
  FAILED: '실패',
};
