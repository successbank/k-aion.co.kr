import { apiClient } from './api';

// 활동 유형
export enum ActivityAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  SALE_CREATED = 'SALE_CREATED',
  SALE_CONFIRMED = 'SALE_CONFIRMED',
  BONUS_RECEIVED = 'BONUS_RECEIVED',
  GRADE_CHANGED = 'GRADE_CHANGED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MEMBER_CREATED = 'MEMBER_CREATED',
  MEMBER_UPDATED = 'MEMBER_UPDATED',
  MEMBER_ROLLBACK = 'MEMBER_ROLLBACK',
}

// 활동 유형 한글 라벨
export const ActivityActionLabels: Record<string, string> = {
  [ActivityAction.LOGIN]: '로그인',
  [ActivityAction.LOGOUT]: '로그아웃',
  [ActivityAction.SALE_CREATED]: '판매 등록',
  [ActivityAction.SALE_CONFIRMED]: '판매 확정',
  [ActivityAction.BONUS_RECEIVED]: '보너스 수령',
  [ActivityAction.GRADE_CHANGED]: '등급 변경',
  [ActivityAction.PROFILE_UPDATED]: '정보 수정',
  [ActivityAction.ORDER_CREATED]: '주문 생성',
  [ActivityAction.ORDER_CONFIRMED]: '주문 확정',
  [ActivityAction.PASSWORD_CHANGED]: '비밀번호 변경',
  [ActivityAction.PASSWORD_RESET]: '비밀번호 초기화',
  [ActivityAction.MEMBER_CREATED]: '회원 등록',
  [ActivityAction.MEMBER_UPDATED]: '회원 수정',
  [ActivityAction.MEMBER_ROLLBACK]: '회원 롤백',
};

// 활동 유형 아이콘 색상
export const ActivityActionColors: Record<string, string> = {
  [ActivityAction.LOGIN]: 'blue',
  [ActivityAction.LOGOUT]: 'default',
  [ActivityAction.SALE_CREATED]: 'green',
  [ActivityAction.SALE_CONFIRMED]: 'cyan',
  [ActivityAction.BONUS_RECEIVED]: 'gold',
  [ActivityAction.GRADE_CHANGED]: 'purple',
  [ActivityAction.PROFILE_UPDATED]: 'geekblue',
  [ActivityAction.ORDER_CREATED]: 'lime',
  [ActivityAction.ORDER_CONFIRMED]: 'volcano',
  [ActivityAction.PASSWORD_CHANGED]: 'magenta',
  [ActivityAction.PASSWORD_RESET]: 'red',
  [ActivityAction.MEMBER_CREATED]: 'success',
  [ActivityAction.MEMBER_UPDATED]: 'warning',
  [ActivityAction.MEMBER_ROLLBACK]: 'error',
};

// 회원 정보 (로그에 포함)
export interface ActivityLogMember {
  id: number;
  name: string;
  username: string;
  grade: string;
}

// 활동 로그 인터페이스
export interface ActivityLog {
  id: number;
  memberId: number;
  action: string;
  targetType?: string;
  targetId?: number;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
  relatedData?: any;
  member?: ActivityLogMember;
}

// 활동 로그 목록 응답
export interface ActivityLogsListResponse {
  data: ActivityLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 활동 통계 (회원별)
export interface ActivityStats {
  totalActivities: number;
  byAction: Array<{
    action: string;
    count: number;
  }>;
}

// 전체 활동 통계 (관리자용)
export interface AdminActivityStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byAction: Array<{
    action: string;
    count: number;
  }>;
}

// 전체 로그 조회 파라미터
export interface GetAllLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  memberId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

class ActivityLogsService {
  /**
   * 전체 활동 로그 목록 조회 (관리자용)
   */
  async getAll(params: GetAllLogsParams = {}): Promise<ActivityLogsListResponse> {
    const queryParams: Record<string, string> = {};
    if (params.page) queryParams.page = String(params.page);
    if (params.limit) queryParams.limit = String(params.limit);
    if (params.action) queryParams.action = params.action;
    if (params.memberId) queryParams.memberId = String(params.memberId);
    if (params.search) queryParams.search = params.search;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;

    return apiClient.get<ActivityLogsListResponse>('/v1/activity-logs', queryParams);
  }

  /**
   * 전체 활동 로그 통계 (관리자용)
   */
  async getStats(params: { startDate?: string; endDate?: string } = {}): Promise<AdminActivityStats> {
    const queryParams: Record<string, string> = {};
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;

    return apiClient.get<AdminActivityStats>('/v1/activity-logs/stats', queryParams);
  }

  /**
   * 회원별 활동 이력 조회
   */
  async getByMember(
    memberId: number,
    params: { page?: number; limit?: number } = {},
  ): Promise<ActivityLogsListResponse> {
    const queryParams: Record<string, string> = {};
    if (params.page) queryParams.page = String(params.page);
    if (params.limit) queryParams.limit = String(params.limit);

    return apiClient.get<ActivityLogsListResponse>(
      `/v1/activity-logs/member/${memberId}`,
      queryParams,
    );
  }

  /**
   * 회원별 종합 활동 이력 (연관 데이터 포함)
   */
  async getMemberActivityHistory(
    memberId: number,
    params: { page?: number; limit?: number } = {},
  ): Promise<ActivityLogsListResponse> {
    const queryParams: Record<string, string> = {};
    if (params.page) queryParams.page = String(params.page);
    if (params.limit) queryParams.limit = String(params.limit);

    return apiClient.get<ActivityLogsListResponse>(
      `/v1/activity-logs/member/${memberId}/history`,
      queryParams,
    );
  }

  /**
   * 회원 활동 통계
   */
  async getMemberStats(memberId: number): Promise<ActivityStats> {
    return apiClient.get<ActivityStats>(`/v1/activity-logs/member/${memberId}/stats`);
  }

  /**
   * 최근 로그인 기록
   */
  async getRecentLogins(memberId: number, limit = 5): Promise<ActivityLog[]> {
    return apiClient.get<ActivityLog[]>(`/v1/activity-logs/member/${memberId}/recent-logins`, {
      limit: String(limit),
    });
  }
}

export const activityLogsService = new ActivityLogsService();
