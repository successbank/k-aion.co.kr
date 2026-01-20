/**
 * Profile Service - 마이페이지 관련 API
 */

import { apiClient } from './api';

export interface MyProfile {
  id: number;
  username: string;
  email: string | null;
  name: string;
  phone: string | null;
  birthDate: string | null;
  grade: string;
  cumulativePv: number;
  agentPromotedAt: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  postalCode: string | null;
  address: string | null;
  addressDetail: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  recommender: {
    id: number;
    username: string;
    name: string;
    grade: string;
  } | null;
  sponsor: {
    id: number;
    username: string;
    name: string;
    grade: string;
  } | null;
  teamLine: number | null;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  postalCode?: string;
  address?: string;
  addressDetail?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

export interface MyPerformance {
  member: {
    id: number;
    name: string;
    grade: string;
    cumulativePv: number;
    agentPromotedAt: string | null;
  };
  monthly: {
    period: string;
    sales: {
      totalAmount: number;
      totalPv: number;
      count: number;
    };
    bonuses: {
      totalAmount: number;
      byType: {
        type: string;
        amount: number;
      }[];
    };
  };
  recentSales: {
    id: number;
    saleDate: string;
    totalPrice: number;
    totalPv: number;
    product: {
      id: number;
      name: string;
    };
  }[];
  recentBonuses: {
    id: number;
    type: string;
    amount: number;
    period: string;
    createdAt: string;
  }[];
}

export interface TeamStats {
  teamLine: number;
  count: number;
  totalPv: number;
  grades: {
    ADMIN: number;
    DIVISION_CHIEF: number;
    BRANCH_CHIEF: number;
    MANAGER: number;
    AGENT: number;
    MEMBER: number;
  };
}

export interface OrganizationMember {
  id: number;
  username: string;
  name: string;
  grade: string;
  teamLine?: number;
  cumulativePv: number;
  createdAt: string;
}

export interface MyOrganization {
  member: {
    id: number;
    username: string;
    name: string;
    grade: string;
    cumulativePv: number;
  };
  sponsorTree: {
    directDownline: OrganizationMember[];
    totalCount: number;
    teamStats: TeamStats[];
  };
  recommenderTree: {
    recommendees: OrganizationMember[];
    totalCount: number;
  };
}

export interface ResetPasswordResponse {
  message: string;
  tempPassword: string;
  memberId: number;
  memberName: string;
}

export interface AdminStats {
  totalMembers: number;
  totalProducts: number;
  gradeDistribution: {
    MEMBER: number;
    AGENT: number;
    MANAGER: number;
    BRANCH_CHIEF: number;
    DIVISION_CHIEF: number;
    CENTER: number;
    ADMIN: number;
  };
}

class ProfileService {
  /**
   * 내 프로필 조회
   */
  async getMyProfile(): Promise<MyProfile> {
    return apiClient.get<MyProfile>('/v1/members/me');
  }

  /**
   * 내 프로필 수정
   */
  async updateMyProfile(data: UpdateProfileRequest): Promise<MyProfile> {
    return apiClient.patch<MyProfile>('/v1/members/me', data);
  }

  /**
   * 내 실적 조회
   */
  async getMyPerformance(): Promise<MyPerformance> {
    return apiClient.get<MyPerformance>('/v1/members/me/performance');
  }

  /**
   * 내 조직 조회
   */
  async getMyOrganization(depth: number = 3): Promise<MyOrganization> {
    return apiClient.get<MyOrganization>('/v1/members/me/organization', { depth: String(depth) });
  }

  /**
   * 회원 비밀번호 초기화 (관리자 전용)
   */
  async resetMemberPassword(memberId: number): Promise<ResetPasswordResponse> {
    return apiClient.patch<ResetPasswordResponse>(`/v1/members/${memberId}/reset-password`, {});
  }

  /**
   * ADMIN 대시보드 통계 조회 (ADMIN 전용)
   * - 전체 회원 수
   * - 전체 제품 수
   * - 등급별 회원 분포
   */
  async getAdminStats(): Promise<AdminStats> {
    return apiClient.get<AdminStats>('/v1/members/admin-stats');
  }
}

export const profileService = new ProfileService();
