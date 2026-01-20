import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsNumber, IsString, IsDateString, IsEnum } from 'class-validator';

/**
 * 위반 유형
 */
export enum ViolationType {
  CIRCULAR_REFERENCE = 'CIRCULAR_REFERENCE', // 순환 참조
  ORPHAN_NODE = 'ORPHAN_NODE', // 고아 노드
  INVALID_TEAM_LINE = 'INVALID_TEAM_LINE', // 유효하지 않은 팀라인
  SELF_REFERENCE = 'SELF_REFERENCE', // 자기 참조
  INACTIVE_PARENT = 'INACTIVE_PARENT', // 비활성 상위자 참조
}

/**
 * 트리 타입
 */
export type TreeType = 'sponsor' | 'recommender';

/**
 * 위반 사항 기본 인터페이스
 */
export interface ViolationBase {
  memberId: number;
  memberName: string;
  description: string;
}

/**
 * 순환 참조 위반
 */
export interface CircularReferenceViolation extends ViolationBase {
  type: ViolationType.CIRCULAR_REFERENCE;
  cycle: number[]; // [A, B, C, A] 형태의 순환 경로
  treeType: TreeType;
}

/**
 * 고아 노드 위반
 */
export interface OrphanNodeViolation extends ViolationBase {
  type: ViolationType.ORPHAN_NODE;
  fieldName: 'sponsorId' | 'recommenderId';
  invalidReferenceId: number;
}

/**
 * 유효하지 않은 팀라인 위반
 */
export interface TeamLineViolation extends ViolationBase {
  type: ViolationType.INVALID_TEAM_LINE;
  currentValue: number;
}

/**
 * 자기 참조 위반
 */
export interface SelfReferenceViolation extends ViolationBase {
  type: ViolationType.SELF_REFERENCE;
  fieldName: 'sponsorId' | 'recommenderId';
}

/**
 * 비활성 상위자 참조 위반
 */
export interface InactiveParentViolation extends ViolationBase {
  type: ViolationType.INACTIVE_PARENT;
  fieldName: 'sponsorId' | 'recommenderId';
  parentId: number;
  parentName: string;
}

/**
 * 통합 위반 유형
 */
export type IntegrityViolation =
  | CircularReferenceViolation
  | OrphanNodeViolation
  | TeamLineViolation
  | SelfReferenceViolation
  | InactiveParentViolation;

/**
 * 위반 사항 그룹
 */
export interface IntegrityViolations {
  circularReferences: CircularReferenceViolation[];
  orphanNodes: OrphanNodeViolation[];
  invalidTeamLines: TeamLineViolation[];
  selfReferences: SelfReferenceViolation[];
  inactiveParentReferences: InactiveParentViolation[];
}

/**
 * 수정 실패 항목
 */
export interface FailedFix {
  memberId: number;
  memberName: string;
  violationType: ViolationType;
  error: string;
}

/**
 * 수정 리포트
 */
export interface FixReport {
  totalFixed: number;
  fixedByType: Record<string, number>;
  failedFixes: FailedFix[];
}

/**
 * 무결성 검사 요약
 */
export interface IntegritySummary {
  circularReferences: number;
  orphanNodes: number;
  invalidTeamLines: number;
  selfReferences: number;
  inactiveParentReferences: number;
  totalViolations: number;
}

/**
 * 무결성 검사 리포트
 */
export interface IntegrityReport {
  executedAt: string;
  totalMembers: number;
  summary: IntegritySummary;
  violations: IntegrityViolations;
  fixes?: FixReport; // autoFix=true일 때만 포함
  healthy: boolean;
}

/**
 * 무결성 검사 이력 항목
 */
export interface IntegrityCheckHistoryItem {
  id: number;
  executedAt: string;
  executedBy: {
    id: number;
    name: string;
  } | null;
  totalMembers: number;
  totalViolations: number;
  wasAutoFixed: boolean;
  fixedCount: number;
  healthy: boolean;
}

/**
 * 무결성 검사 이력 응답
 */
export interface IntegrityCheckHistoryResponse {
  data: IntegrityCheckHistoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// Swagger DTO 클래스
// ============================================

export class RunIntegrityCheckQueryDto {
  @ApiPropertyOptional({
    description: '자동 수정 여부',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  autoFix?: boolean;
}

export class GetIntegrityHistoryQueryDto {
  @ApiPropertyOptional({
    description: '페이지 번호',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

/**
 * 위반 유형 한글 레이블
 */
export const ViolationTypeLabels: Record<ViolationType, string> = {
  [ViolationType.CIRCULAR_REFERENCE]: '순환 참조',
  [ViolationType.ORPHAN_NODE]: '고아 노드',
  [ViolationType.INVALID_TEAM_LINE]: '유효하지 않은 팀라인',
  [ViolationType.SELF_REFERENCE]: '자기 참조',
  [ViolationType.INACTIVE_PARENT]: '비활성 상위자 참조',
};

/**
 * 위반 유형별 자동 수정 방법 설명
 */
export const ViolationFixMethods: Record<ViolationType, string> = {
  [ViolationType.CIRCULAR_REFERENCE]:
    '루프의 마지막 노드의 sponsorId/recommenderId를 null로 설정',
  [ViolationType.ORPHAN_NODE]: '존재하지 않는 참조를 null로 설정',
  [ViolationType.INVALID_TEAM_LINE]: 'teamLine을 null로 설정',
  [ViolationType.SELF_REFERENCE]: 'sponsorId/recommenderId를 null로 설정',
  [ViolationType.INACTIVE_PARENT]: 'sponsorId/recommenderId를 null로 설정',
};
