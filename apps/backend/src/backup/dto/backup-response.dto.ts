import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 백업 파일 정보 DTO
 */
export class BackupFileDto {
  @ApiProperty({ description: '백업 파일명' })
  filename: string;

  @ApiProperty({ description: '파일 크기 (bytes)' })
  size: number;

  @ApiProperty({ description: '파일 크기 (표시용)' })
  sizeDisplay: string;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '백업 유형', enum: ['auto', 'manual'] })
  type: 'auto' | 'manual';
}

/**
 * 백업 상태 대시보드 DTO
 */
export class BackupStatusDto {
  @ApiPropertyOptional({ description: '마지막 백업 일시' })
  lastBackupAt: Date | null;

  @ApiProperty({ description: '총 백업 수' })
  totalBackups: number;

  @ApiProperty({ description: '총 저장 용량 (bytes)' })
  totalSize: number;

  @ApiProperty({ description: '총 저장 용량 (표시용)' })
  totalSizeDisplay: string;

  @ApiProperty({ description: '다음 자동 백업 일시' })
  nextScheduledBackup: Date;

  @ApiProperty({ description: '백업 보관 기간 (일)' })
  retentionDays: number;
}

/**
 * 백업 목록 응답 DTO
 */
export class BackupListResponseDto {
  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiProperty({ description: '메시지' })
  message: string;

  @ApiProperty({ description: '백업 파일 목록', type: [BackupFileDto] })
  data: BackupFileDto[];
}

/**
 * 백업 상태 응답 DTO
 */
export class BackupStatusResponseDto {
  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiProperty({ description: '메시지' })
  message: string;

  @ApiProperty({ description: '백업 상태', type: BackupStatusDto })
  data: BackupStatusDto;
}

/**
 * 백업 생성 응답 DTO
 */
export class BackupCreateResponseDto {
  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiProperty({ description: '메시지' })
  message: string;

  @ApiPropertyOptional({ description: '생성된 백업 파일명' })
  filename?: string;

  @ApiPropertyOptional({ description: '파일 크기 (표시용)' })
  sizeDisplay?: string;
}

/**
 * 복구 응답 DTO
 */
export class RestoreResponseDto {
  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiProperty({ description: '메시지' })
  message: string;

  @ApiPropertyOptional({ description: '안전 백업 파일명' })
  safetyBackupFilename?: string;
}

/**
 * 백업 삭제 응답 DTO
 */
export class BackupDeleteResponseDto {
  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiProperty({ description: '메시지' })
  message: string;
}

/**
 * 백업 로그 항목 DTO
 */
export class BackupLogItemDto {
  @ApiProperty({ description: '로그 ID' })
  id: number;

  @ApiProperty({ description: '작업 유형', enum: ['BACKUP', 'RESTORE', 'DELETE'] })
  operation: string;

  @ApiProperty({ description: '작업 상태', enum: ['SUCCESS', 'FAILED'] })
  status: string;

  @ApiPropertyOptional({ description: '관련 파일명' })
  filename: string | null;

  @ApiPropertyOptional({ description: '파일 크기' })
  fileSize: number | null;

  @ApiProperty({ description: '작업 메시지' })
  message: string;

  @ApiPropertyOptional({ description: '실행자 정보' })
  executedBy: { id: number; name: string } | null;

  @ApiProperty({ description: '실행 일시' })
  executedAt: Date;
}

/**
 * 백업 로그 목록 응답 DTO
 */
export class BackupLogListResponseDto {
  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiProperty({ description: '메시지' })
  message: string;

  @ApiProperty({ description: '백업 로그 목록', type: [BackupLogItemDto] })
  data: BackupLogItemDto[];

  @ApiProperty({ description: '페이지네이션 메타 정보' })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
