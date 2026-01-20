/**
 * Kaion 공유 상수
 */

// 브랜드 컬러
export const BRAND_COLORS = {
  primary: '#E53935',
  primaryLight: '#EF5350',
  primaryDark: '#C62828',
  textPrimary: '#212121',
  textSecondary: '#757575',
  background: '#F5F5F5',
  error: '#E53935',
  success: '#43A047',
} as const;

// 회원 등급
export enum MemberRole {
  MEMBER = 'MEMBER',           // 회원
  MANAGER = 'MANAGER',         // 매니저
  BRANCH_MANAGER = 'BRANCH_MANAGER',  // 지부장
  DIVISION_MANAGER = 'DIVISION_MANAGER', // 본부장
  ADMIN = 'ADMIN',             // 최고관리자
}

// 회원 등급 한글명
export const MemberRoleLabel: Record<MemberRole, string> = {
  [MemberRole.MEMBER]: '회원',
  [MemberRole.MANAGER]: '매니저',
  [MemberRole.BRANCH_MANAGER]: '지부장',
  [MemberRole.DIVISION_MANAGER]: '본부장',
  [MemberRole.ADMIN]: '최고관리자',
};

// 수당 유형
export enum CommissionType {
  DIRECT = 'DIRECT',           // 직접판매 수당
  REFERRAL = 'REFERRAL',       // 추천 수당
  POSITION = 'POSITION',       // 직급 수당
  LEADERSHIP = 'LEADERSHIP',   // 리더십 수당
}

// 수당 유형 한글명
export const CommissionTypeLabel: Record<CommissionType, string> = {
  [CommissionType.DIRECT]: '직접판매 수당',
  [CommissionType.REFERRAL]: '추천 수당',
  [CommissionType.POSITION]: '직급 수당',
  [CommissionType.LEADERSHIP]: '리더십 수당',
};

// 제품 상태
export enum ProductStatus {
  AVAILABLE = 'AVAILABLE',     // 판매중
  OUT_OF_STOCK = 'OUT_OF_STOCK', // 품절
  DISCONTINUED = 'DISCONTINUED', // 단종
}

// 페이지네이션 기본값
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
