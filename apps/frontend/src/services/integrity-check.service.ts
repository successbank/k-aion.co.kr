import { apiClient } from './api';

/**
 * 위반 유형
 */
export enum ViolationType {
  CIRCULAR_REFERENCE = 'CIRCULAR_REFERENCE',
  ORPHAN_NODE = 'ORPHAN_NODE',
  INVALID_TEAM_LINE = 'INVALID_TEAM_LINE',
  SELF_REFERENCE = 'SELF_REFERENCE',
  INACTIVE_PARENT = 'INACTIVE_PARENT',
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
 * 위반 유형별 설명
 */
export const ViolationTypeDescriptions: Record<ViolationType, string> = {
  [ViolationType.CIRCULAR_REFERENCE]: 'A→B→C→A 형태의 계보 루프',
  [ViolationType.ORPHAN_NODE]: '존재하지 않는 회원 ID 참조',
  [ViolationType.INVALID_TEAM_LINE]: '1, 2, 3 이외의 팀라인 값',
  [ViolationType.SELF_REFERENCE]: '자기 자신을 상위자로 참조',
  [ViolationType.INACTIVE_PARENT]: '비활성화된 상위자 참조',
};

/**
 * 위반 유형별 자동 수정 방법
 */
export const ViolationFixMethods: Record<ViolationType, string> = {
  [ViolationType.CIRCULAR_REFERENCE]: '루프의 마지막 노드 참조를 null로 설정',
  [ViolationType.ORPHAN_NODE]: '존재하지 않는 참조를 null로 설정',
  [ViolationType.INVALID_TEAM_LINE]: 'teamLine을 null로 설정',
  [ViolationType.SELF_REFERENCE]: '자기 참조를 null로 설정',
  [ViolationType.INACTIVE_PARENT]: '비활성 상위자 참조를 null로 설정',
};

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
  cycle: number[];
  treeType: 'sponsor' | 'recommender';
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
  fixes?: FixReport;
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

/**
 * 무결성 검사 이력 조회 파라미터
 */
export interface HistoryParams {
  page?: number;
  limit?: number;
}

class IntegrityCheckService {
  /**
   * 무결성 검사 실행
   * @param autoFix 자동 수정 여부
   */
  async runCheck(autoFix: boolean = false): Promise<IntegrityReport> {
    const params: Record<string, string> = {};
    if (autoFix) {
      params.autoFix = 'true';
    }
    return apiClient.get<IntegrityReport>('/v1/members/integrity-check', params);
  }

  /**
   * 무결성 검사 이력 조회
   */
  async getHistory(params: HistoryParams = {}): Promise<IntegrityCheckHistoryResponse> {
    const queryParams: Record<string, string> = {};
    if (params.page) queryParams.page = String(params.page);
    if (params.limit) queryParams.limit = String(params.limit);

    return apiClient.get<IntegrityCheckHistoryResponse>(
      '/v1/members/integrity-check/history',
      queryParams,
    );
  }
}

export const integrityCheckService = new IntegrityCheckService();
