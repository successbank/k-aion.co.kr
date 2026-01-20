/**
 * Authentication Service
 */

import { apiClient } from './api';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email?: string;
  password: string;
  name: string;
  phone: string;
  recommenderId: number;
  sponsorId: number;
  centerName: string;
  address?: string;
  addressDetail?: string;
  postalCode?: string;
}

export interface CheckUsernameRequest {
  username: string;
}

export interface CheckUsernameResponse {
  available: boolean;
  message: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    username: string;
    email?: string;
    name: string;
    grade: string;
    phone: string | null;
  };
}

export interface UserProfile {
  id: number;
  username: string;
  email?: string;
  name: string;
  phone: string | null;
  grade: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  address: string | null;
  addressDetail: string | null;
  postalCode: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  cumulativePv: number;
  recommender: {
    id: number;
    name: string;
    username: string;
    email?: string;
    grade: string;
  } | null;
  sponsor: {
    id: number;
    name: string;
    username: string;
    email?: string;
    grade: string;
  } | null;
  teamLine: number | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

class AuthService {
  /**
   * 로그인
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', credentials);
  }

  /**
   * 회원가입
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/register', data);
  }

  /**
   * 내 정보 조회
   */
  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/auth/me');
  }

  /**
   * 아이디 중복 확인
   */
  async checkUsername(username: string): Promise<CheckUsernameResponse> {
    return apiClient.post<CheckUsernameResponse>('/auth/check-username', { username });
  }

  /**
   * 로그아웃 (로컬 처리)
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage');
    }
  }

  /**
   * 비밀번호 변경
   */
  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    return apiClient.patch<ChangePasswordResponse>('/auth/change-password', data);
  }
}

export const authService = new AuthService();
