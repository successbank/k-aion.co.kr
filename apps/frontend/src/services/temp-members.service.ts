import { apiClient } from './api';

export interface CreateTempMemberDto {
  username: string;
  password: string;
  name: string;
  residentNumber: string;
  phone: string;
  postalCode?: string;
  address?: string;
  addressDetail?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  recommenderPhone?: string;
  sponsorPhone?: string;
  centerName?: string;
}

export interface TempMember {
  id: number;
  username: string;
  password: string;
  name: string;
  residentNumber: string;
  phone: string;
  postalCode: string | null;
  address: string | null;
  addressDetail: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  recommenderPhone: string | null;
  sponsorPhone: string | null;
  centerName: string | null;
  isMigrated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VerifyPhoneDto {
  phone: string;
  lastFourDigits: string;
}

export interface VerifyPhoneResponse {
  valid: boolean;
  name?: string;
}

class TempMembersService {
  /**
   * 임시 회원 등록
   */
  async create(data: CreateTempMemberDto): Promise<TempMember> {
    return apiClient.post<TempMember>('/v1/temp-members', data);
  }

  /**
   * 아이디 중복 체크
   */
  async checkUsername(username: string): Promise<{ available: boolean }> {
    return apiClient.get<{ available: boolean }>(`/v1/temp-members/check-username/${username}`);
  }

  /**
   * 추천인/후원인 전화번호 검증
   */
  async verifyPhone(data: VerifyPhoneDto): Promise<VerifyPhoneResponse> {
    return apiClient.post<VerifyPhoneResponse>('/v1/temp-members/verify-phone', data);
  }

  /**
   * 임시 회원 목록 조회 (관리자용)
   */
  async getAll(isMigrated?: boolean): Promise<TempMember[]> {
    const params: Record<string, string> = {};
    if (isMigrated !== undefined) {
      params.isMigrated = String(isMigrated);
    }
    return apiClient.get<TempMember[]>('/v1/temp-members', params);
  }

  /**
   * 임시 회원 상세 조회 (관리자용)
   */
  async getOne(id: number): Promise<TempMember> {
    return apiClient.get<TempMember>(`/v1/temp-members/${id}`);
  }
}

export const tempMembersService = new TempMembersService();
