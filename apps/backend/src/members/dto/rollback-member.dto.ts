import { IsEnum, IsInt, IsOptional, IsString, IsArray, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 롤백 사유 enum
 * - INPUT_ERROR: 입력 오류 수정
 * - SYSTEM_ERROR: 시스템 오류 복구 (개발팀 알림 발송)
 * - OTHER: 기타
 */
export enum RollbackReason {
  INPUT_ERROR = 'INPUT_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  OTHER = 'OTHER',
}

/**
 * 롤백 사유 한글 라벨
 */
export const RollbackReasonLabels: Record<RollbackReason, string> = {
  [RollbackReason.INPUT_ERROR]: '입력 오류 수정',
  [RollbackReason.SYSTEM_ERROR]: '시스템 오류 복구',
  [RollbackReason.OTHER]: '기타',
};

/**
 * 롤백 불가 필드 목록
 * 보안 및 시스템 무결성을 위해 이 필드들은 롤백 대상에서 제외됨
 */
export const NON_ROLLBACKABLE_FIELDS = ['username', 'password', 'id', 'createdAt', 'deletedAt'];

/**
 * 롤백 가능한 필드 목록
 */
export const ROLLBACKABLE_FIELDS = [
  'name',
  'phone',
  'birthDate',
  'grade',
  'recommenderId',
  'sponsorId',
  'teamLine',
  'bankName',
  'accountNumber',
  'accountHolder',
  'postalCode',
  'address',
  'addressDetail',
  'isActive',
  'email',
];

/**
 * 회원 정보 롤백 요청 DTO
 */
export class RollbackMemberDto {
  @ApiProperty({
    description: '롤백할 대상 ActivityLog ID',
    example: 456,
  })
  @IsInt()
  rollbackToLogId: number;

  @ApiProperty({
    description: '롤백 사유',
    enum: RollbackReason,
    example: RollbackReason.INPUT_ERROR,
  })
  @IsEnum(RollbackReason)
  reason: RollbackReason;

  @ApiPropertyOptional({
    description: '롤백 사유 상세 (기타 선택 시 필수)',
    example: '전화번호 입력 오류',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonDetail?: string;

  @ApiPropertyOptional({
    description: '롤백할 필드 목록 (비어있으면 전체 롤백)',
    example: ['phone', 'name'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fieldsToRollback?: string[];
}

/**
 * 변경 이력 항목
 */
export interface ChangeHistoryItem {
  logId: number;
  changedAt: string;
  changedBy: {
    id: number;
    name: string;
  } | null;
  changedFields: string[];
  changes: Array<{
    field: string;
    before: any;
    after: any;
  }>;
  canRollback: boolean;
  rollbackBlockReason?: string;
}

/**
 * 변경 이력 응답 DTO
 */
export interface ChangeHistoryResponse {
  memberId: number;
  memberName: string;
  currentValues: Record<string, any>;
  changeHistory: ChangeHistoryItem[];
  maxRollbackDepth: number;
}

/**
 * 롤백 결과 응답 DTO
 */
export interface RollbackResultResponse {
  success: boolean;
  message: string;
  memberId: number;
  memberName: string;
  rollbackLogId: number;
  restoredFields: string[];
  changes: Array<{
    field: string;
    before: any;
    after: any;
  }>;
  rollbackReason: RollbackReason;
  rollbackReasonLabel: string;
  notificationSent?: boolean;
}

/**
 * 디버깅 정보 인터페이스 (시스템 오류 롤백 시 수집)
 */
export interface DebugInfo {
  originalErrorLogId?: number;
  errorContext?: {
    url: string;
    method: string;
    errorMessage: string;
  };
  systemInfo: {
    timestamp: string;
    serverVersion: string;
    nodeEnv: string;
  };
  relatedLogs: Array<{
    logId: number;
    action: string;
    createdAt: string;
  }>;
}
