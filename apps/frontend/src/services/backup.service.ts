import { apiClient } from './api';
import {
  BackupFile,
  BackupStatus,
  BackupListResponse,
  BackupStatusResponse,
  BackupCreateResponse,
  RestoreResponse,
  BackupDeleteResponse,
  BackupLogListResponse,
  BackupLogItem,
} from '@/types/backup';

/**
 * 로그 조회 파라미터
 */
export interface LogParams {
  page?: number;
  limit?: number;
}

class BackupService {
  /**
   * 백업 목록 조회
   */
  async getBackupList(): Promise<BackupFile[]> {
    const response = await apiClient.get<BackupListResponse>('/v1/admin/backup');
    return response.data;
  }

  /**
   * 백업 상태 대시보드 조회
   */
  async getStatus(): Promise<BackupStatus> {
    const response = await apiClient.get<BackupStatusResponse>('/v1/admin/backup/status');
    return response.data;
  }

  /**
   * 수동 백업 생성
   */
  async createBackup(): Promise<BackupCreateResponse> {
    return apiClient.post<BackupCreateResponse>('/v1/admin/backup');
  }

  /**
   * 백업 복구
   */
  async restore(filename: string): Promise<RestoreResponse> {
    return apiClient.post<RestoreResponse>('/v1/admin/backup/restore', { filename });
  }

  /**
   * 백업 파일 다운로드 URL 생성
   */
  getDownloadUrl(filename: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return `${baseUrl}/v1/admin/backup/download/${encodeURIComponent(filename)}?token=${token}`;
  }

  /**
   * 백업 파일 다운로드
   */
  async downloadBackup(filename: string): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(`${baseUrl}/v1/admin/backup/download/${encodeURIComponent(filename)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('다운로드에 실패했습니다');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  /**
   * 백업 파일 삭제
   */
  async deleteBackup(filename: string): Promise<BackupDeleteResponse> {
    return apiClient.delete<BackupDeleteResponse>(`/v1/admin/backup/${encodeURIComponent(filename)}`);
  }

  /**
   * 작업 로그 조회
   */
  async getLogs(params: LogParams = {}): Promise<BackupLogListResponse> {
    const queryParams: Record<string, string> = {};
    if (params.page) queryParams.page = String(params.page);
    if (params.limit) queryParams.limit = String(params.limit);

    return apiClient.get<BackupLogListResponse>('/v1/admin/backup/logs', queryParams);
  }
}

export const backupService = new BackupService();
