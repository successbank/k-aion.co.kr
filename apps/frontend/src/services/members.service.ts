import { apiClient } from './api';

export interface Member {
  id: number;
  username: string;
  email: string;
  name: string;
  phone: string | null;
  birthDate: string | null;
  grade: string;
  isActive: boolean;
  postalCode: string | null;
  address: string | null;
  addressDetail: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  recommenderId: number | null;
  sponsorId: number | null;
  teamLine: number | null;
  cumulativePv: number;
  centerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MembersListResponse {
  data: Member[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MemberDetailResponse extends Member {
  birthDate?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
  recommender?: {
    id: number;
    name: string;
    email: string;
  };
  sponsor?: {
    id: number;
    name: string;
    email: string;
  };
  // 직속 하위 목록 (후원계보)
  sponsorees?: Array<{
    id: number;
    name: string;
    email: string;
    grade: string;
  }>;
}

export interface CreateMemberDto {
  email?: string;
  username?: string;
  password: string;
  name: string;
  phone?: string;
  postalCode?: string;
  address?: string;
  addressDetail?: string;
  recommenderId?: number;
  sponsorId?: number;
  teamLine?: number;
  centerName?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  grade?: string; // CENTER 등급 생성 시 사용
}

export interface UpdateMemberDto {
  name?: string;
  phone?: string;
  birthDate?: string;
  postalCode?: string;
  address?: string;
  addressDetail?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  recommenderId?: number;
  sponsorId?: number;
  teamLine?: number;
  centerName?: string;
  isActive?: boolean;
}

// 삭제 관련 인터페이스
export interface DownlineMember {
  id: number;
  name: string;
  grade: string;
  teamLine?: number;
}

export interface DeleteImpactResponse {
  memberId: number;
  memberName: string;
  memberGrade: string;
  canDelete: boolean;
  blockReason?: string;
  directSponsoreeCount: number;
  directRecommendeeCount: number;
  totalSponsorDescendantCount: number;
  totalRecommenderDescendantCount: number;
  salesCount: number;
  bonusCount: number;
  seminarCount: number;
  sponsorId?: number;
  sponsorName?: string;
  directSponsorees: DownlineMember[];
  directRecommendees: DownlineMember[];
}

export enum DownlineHandlingStrategy {
  BLOCK = 'BLOCK',
  REASSIGN = 'REASSIGN',
  ORPHAN = 'ORPHAN',
}

export interface DeleteMemberDto {
  downlineStrategy: DownlineHandlingStrategy;
  reassignToId?: number;
  reason?: string;
}

export interface DeleteMemberResponse {
  message: string;
  deletedMemberId: number;
  deletedMemberName: string;
  handledDownlineCount: number;
  strategy: DownlineHandlingStrategy;
}

// 롤백 관련 인터페이스
export enum RollbackReason {
  INPUT_ERROR = 'INPUT_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  OTHER = 'OTHER',
}

export const RollbackReasonLabels: Record<RollbackReason, string> = {
  [RollbackReason.INPUT_ERROR]: '입력 오류 수정',
  [RollbackReason.SYSTEM_ERROR]: '시스템 오류 복구',
  [RollbackReason.OTHER]: '기타',
};

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

export interface ChangeHistoryResponse {
  memberId: number;
  memberName: string;
  currentValues: Record<string, any>;
  changeHistory: ChangeHistoryItem[];
  maxRollbackDepth: number;
}

export interface RollbackMemberDto {
  rollbackToLogId: number;
  reason: RollbackReason;
  reasonDetail?: string;
  fieldsToRollback?: string[];
}

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

// 전체 롤백 이력 관련 인터페이스
export interface RollbackHistoryItem {
  id: number;
  memberId: number;
  memberName: string;
  targetMemberId: number;
  targetMemberName: string;
  rollbackReason: RollbackReason;
  rollbackReasonLabel: string;
  rollbackReasonDetail?: string;
  restoredFields: string[];
  changes: Array<{
    field: string;
    before: any;
    after: any;
  }>;
  createdAt: string;
}

export interface RollbackHistoryResponse {
  data: RollbackHistoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RollbackHistoryParams {
  page?: number;
  limit?: number;
  reason?: RollbackReason;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// 센터별 회원 관리 인터페이스
export interface CenterStats {
  centerName: string;
  centerId: number;
  memberCount: number;
}

export interface CenterStatsResponse {
  centers: CenterStats[];
  unassignedCount: number;
  totalMembers: number;
}

export interface CenterMember {
  id: number;
  username: string;
  name: string;
  phone: string | null;
  grade: string;
  cumulativePv: number;
  createdAt: string;
  centerName: string | null;
}

export interface CenterMembersResponse {
  data: CenterMember[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    centerName?: string;
  };
}

export interface AssignCenterDto {
  memberIds: number[];
  centerName: string;
}

export interface AssignCenterResponse {
  success: boolean;
  message: string;
  centerName: string;
  assignedCount: number;
  memberIds: number[];
}

export interface UnassignCenterResponse {
  success: boolean;
  message: string;
  memberId: number;
  memberName: string;
  previousCenter: string;
}

// 회원 검색 결과 인터페이스
export interface SearchMemberResult {
  id: number;
  username: string;
  name: string;
  email: string;
  grade: string;
  cumulativePv: number;
  sponsoreeCount: number;
}

export interface SearchMembersResponse {
  data: SearchMemberResult[];
  total: number;
}

class MembersService {
  /**
   * 회원 검색 (이름, 아이디, ID로 검색)
   */
  async searchMembers(query: string, limit: number = 50): Promise<SearchMembersResponse> {
    return apiClient.get<SearchMembersResponse>('/v1/members/search', {
      q: query,
      limit: String(limit),
      isActive: 'true',
    });
  }

  /**
   * 회원 목록 조회
   */
  async getMembers(params: {
    page?: number;
    limit?: number;
    grade?: string;
    search?: string;
  }): Promise<MembersListResponse> {
    const queryParams: Record<string, string> = {};
    if (params.page) queryParams.page = String(params.page);
    if (params.limit) queryParams.limit = String(params.limit);
    if (params.grade) queryParams.grade = params.grade;
    if (params.search) queryParams.search = params.search;

    return apiClient.get<MembersListResponse>('/v1/members', queryParams);
  }

  /**
   * 회원 상세 조회
   */
  async getMember(id: number): Promise<MemberDetailResponse> {
    return apiClient.get<MemberDetailResponse>(`/v1/members/${id}`);
  }

  /**
   * 회원 생성
   */
  async createMember(data: CreateMemberDto): Promise<Member> {
    return apiClient.post<Member>('/v1/members', data);
  }

  /**
   * 회원 정보 수정
   */
  async updateMember(id: number, data: UpdateMemberDto): Promise<Member> {
    return apiClient.patch<Member>(`/v1/members/${id}`, data);
  }

  /**
   * 회원 삭제 영향도 조회 (ADMIN 전용)
   */
  async getDeleteImpact(id: number): Promise<DeleteImpactResponse> {
    return apiClient.get<DeleteImpactResponse>(`/v1/members/${id}/delete-impact`);
  }

  /**
   * 회원 삭제 (소프트 삭제) - 하위 회원 처리 전략 포함
   */
  async deleteMember(id: number, dto: DeleteMemberDto): Promise<DeleteMemberResponse> {
    return apiClient.delete<DeleteMemberResponse>(`/v1/members/${id}`, dto);
  }

  /**
   * 회원 등급 변경 (ADMIN 전용)
   */
  async changeGrade(id: number, newGrade: string): Promise<Member> {
    return apiClient.patch<Member>(`/v1/members/${id}/grade`, { grade: newGrade });
  }

  /**
   * 승급 처리
   */
  async promote(id: number): Promise<{ success: boolean; newGrade?: string; message: string }> {
    return apiClient.post<{ success: boolean; newGrade?: string; message: string }>(
      `/v1/members/${id}/promote`,
    );
  }

  /**
   * 승급 가능 여부 확인
   */
  async checkPromotionEligibility(id: number): Promise<{
    eligible: boolean;
    currentGrade: string;
    nextGrade?: string;
    reason?: string;
  }> {
    return apiClient.get<{
      eligible: boolean;
      currentGrade: string;
      nextGrade?: string;
      reason?: string;
    }>(`/v1/members/${id}/promotion-check`);
  }

  /**
   * 제한된 계보도 조회 (1단계 위/아래만)
   * 마이페이지 프리뷰용
   */
  async getLimitedGenealogy(
    id: number,
    type: 'sponsor' | 'recommender' = 'sponsor',
  ): Promise<LimitedGenealogyResponse> {
    return apiClient.get<LimitedGenealogyResponse>(`/v1/members/${id}/limited-genealogy`, {
      type,
    });
  }

  /**
   * 회원 변경 이력 조회 (ADMIN 전용)
   * 롤백을 위한 변경 이력 조회 (최대 5건)
   */
  async getChangeHistory(id: number, limit: number = 5): Promise<ChangeHistoryResponse> {
    return apiClient.get<ChangeHistoryResponse>(`/v1/members/${id}/change-history`, {
      limit: String(limit),
    });
  }

  /**
   * 회원 정보 롤백 (ADMIN 전용)
   * 선택한 변경 이력의 이전 값으로 회원 정보 롤백
   */
  async rollbackMember(id: number, dto: RollbackMemberDto): Promise<RollbackResultResponse> {
    return apiClient.post<RollbackResultResponse>(`/v1/members/${id}/rollback`, dto);
  }

  /**
   * 전체 회원 롤백 이력 조회 (ADMIN 전용)
   * 전체 회원의 롤백 이력을 페이지네이션으로 조회
   */
  async getRollbackHistory(params: RollbackHistoryParams = {}): Promise<RollbackHistoryResponse> {
    const queryParams: Record<string, string> = {};
    if (params.page) queryParams.page = String(params.page);
    if (params.limit) queryParams.limit = String(params.limit);
    if (params.reason) queryParams.reason = params.reason;
    if (params.search) queryParams.search = params.search;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;

    return apiClient.get<RollbackHistoryResponse>('/v1/members/rollback-history', queryParams);
  }

  // ============================================
  // 센터별 회원 관리 API
  // ============================================

  /**
   * 센터별 회원 수 통계 조회 (ADMIN 전용)
   * 각 센터별 소속 회원 수와 미지정 회원 수 반환
   */
  async getCenterStats(): Promise<CenterStatsResponse> {
    return apiClient.get<CenterStatsResponse>('/v1/members/centers/stats');
  }

  /**
   * 센터별 회원 목록 조회 (ADMIN 전용)
   * 특정 센터에 소속된 회원 목록 조회
   */
  async getMembersByCenter(
    centerName: string,
    params: { page?: number; limit?: number; search?: string } = {},
  ): Promise<CenterMembersResponse> {
    const queryParams: Record<string, string> = {};
    if (params.page) queryParams.page = String(params.page);
    if (params.limit) queryParams.limit = String(params.limit);
    if (params.search) queryParams.search = params.search;

    return apiClient.get<CenterMembersResponse>(
      `/v1/members/by-center/${encodeURIComponent(centerName)}`,
      queryParams,
    );
  }

  /**
   * 센터 미지정 회원 목록 조회 (ADMIN 전용)
   * centerName이 null 또는 빈 값인 회원 목록 조회
   */
  async getUnassignedMembers(
    params: { page?: number; limit?: number; search?: string } = {},
  ): Promise<CenterMembersResponse> {
    const queryParams: Record<string, string> = {};
    if (params.page) queryParams.page = String(params.page);
    if (params.limit) queryParams.limit = String(params.limit);
    if (params.search) queryParams.search = params.search;

    return apiClient.get<CenterMembersResponse>('/v1/members/unassigned', queryParams);
  }

  /**
   * 일괄 센터 지정 (ADMIN 전용)
   * 여러 회원에게 동일한 센터를 일괄 지정
   */
  async assignCenterBulk(dto: AssignCenterDto): Promise<AssignCenterResponse> {
    return apiClient.patch<AssignCenterResponse>('/v1/members/assign-center', dto);
  }

  /**
   * 회원 센터 해제 (ADMIN 전용)
   * 특정 회원의 센터 지정 해제
   */
  async unassignCenter(memberId: number): Promise<UnassignCenterResponse> {
    return apiClient.patch<UnassignCenterResponse>(`/v1/members/${memberId}/unassign-center`, {});
  }
}

// 제한된 계보도 응답 인터페이스
export interface LimitedGenealogyMember {
  id: number;
  name: string;
  username: string;
  email: string;
  grade: string;
  cumulativePv: number;
  teamLine?: number;
  centerName?: string;
  phone?: string;
  createdAt?: string;
}

export interface LimitedGenealogyResponse {
  treeType: 'sponsor' | 'recommender';
  upline: LimitedGenealogyMember | null;
  member: LimitedGenealogyMember & {
    sponsorId?: number;
    recommenderId?: number;
  };
  downline: LimitedGenealogyMember[];
  downlineCount: number;
}

export const membersService = new MembersService();
