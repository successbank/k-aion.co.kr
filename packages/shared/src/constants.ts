/**
 * Kaion 공유 상수 (신규 체계)
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

// 회원 등급 (신규 4등급 + ADMIN)
export enum MemberRole {
  SALESPERSON = 'SALESPERSON',      // 판매원
  TEAM_LEADER = 'TEAM_LEADER',      // 팀장
  BRANCH_MANAGER = 'BRANCH_MANAGER', // 지사장
  CENTER = 'CENTER',                 // 센터
  ADMIN = 'ADMIN',                   // 관리자
}

// 회원 등급 한글명
export const MemberRoleLabel: Record<MemberRole, string> = {
  [MemberRole.SALESPERSON]: '판매원',
  [MemberRole.TEAM_LEADER]: '팀장',
  [MemberRole.BRANCH_MANAGER]: '지사장',
  [MemberRole.CENTER]: '센터',
  [MemberRole.ADMIN]: '관리자',
};

// 회원 등급 색상 (Ant Design)
export const MemberRoleColor: Record<MemberRole, string> = {
  [MemberRole.SALESPERSON]: 'blue',
  [MemberRole.TEAM_LEADER]: 'green',
  [MemberRole.BRANCH_MANAGER]: 'gold',
  [MemberRole.CENTER]: 'magenta',
  [MemberRole.ADMIN]: 'red',
};

// 수당 유형 (신규 2종류)
export enum CommissionType {
  SALES_COMMISSION = 'SALES_COMMISSION',         // 판매 수수료
  EDUCATION_MANAGEMENT = 'EDUCATION_MANAGEMENT', // 교육 관리 수수료
}

// 수당 유형 한글명
export const CommissionTypeLabel: Record<CommissionType, string> = {
  [CommissionType.SALES_COMMISSION]: '판매 수수료',
  [CommissionType.EDUCATION_MANAGEMENT]: '교육 관리 수수료',
};

// 수당 유형 대상 등급
export const CommissionTypeTargetGrades: Record<CommissionType, MemberRole[]> = {
  [CommissionType.SALES_COMMISSION]: [MemberRole.SALESPERSON, MemberRole.TEAM_LEADER],
  [CommissionType.EDUCATION_MANAGEMENT]: [MemberRole.BRANCH_MANAGER, MemberRole.CENTER],
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

// 승급 조건 (정상)
export const PROMOTION_REQUIREMENTS = {
  SALESPERSON_TO_TEAM_LEADER: 10,      // 판매원 10명 소개
  TEAM_LEADER_TO_BRANCH_MANAGER: 10,   // 팀장 10명 소개
} as const;

// 승급 조건 (한시적)
export const PROMOTION_REQUIREMENTS_TEMPORARY = {
  SALESPERSON_TO_TEAM_LEADER: 3,       // 판매원 3명 소개
  TEAM_LEADER_TO_BRANCH_MANAGER: 3,    // 팀장 3명 소개
} as const;

// 의료기기 제품 코드
export const PRODUCT_CODES = {
  ONCHE: 'MED-001',           // 온체 (고주파)
  PULSE_ON: 'MED-002',        // 펄스온 (저주파)
  JET5: 'MED-003',            // 제트5 (초음파)
  PAIN_PATCH: 'MED-ACC-001',  // 통증 패치
  GEL: 'MED-ACC-002',         // 전용젤
} as const;
