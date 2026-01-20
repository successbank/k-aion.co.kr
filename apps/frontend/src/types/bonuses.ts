/**
 * 보너스 유형
 * Commission PRD v2.0 기준
 */
export enum BonusType {
  SALES = 'SALES', // 판매 보너스 (50만원)
  SALES_MANAGEMENT = 'SALES_MANAGEMENT', // 판매 관리 보너스 (15만원)
  LICENSE = 'LICENSE', // 판권 보너스 (매니저 10만/지부장 18만/본부장 24만)
  LICENSE_MANAGEMENT = 'LICENSE_MANAGEMENT', // 판권 관리 보너스 (30-50%)
  SHARING = 'SHARING', // 공유 보너스 (2만원 중복지급)
  BRANCH_OPERATION = 'BRANCH_OPERATION', // 센터 운영 보너스 (5만원)
}

/**
 * 보너스 상태
 * Backend Prisma schema와 일치
 */
export enum BonusStatus {
  PENDING = 'PENDING', // 대기중
  CONFIRMED = 'CONFIRMED', // 확정됨
  PAID = 'PAID', // 지급 완료
  CANCELLED = 'CANCELLED', // 취소됨
}

/**
 * 회원 등급
 */
export enum MemberGrade {
  ADMIN = 'ADMIN', // 최고관리자
  CENTER = 'CENTER', // 센터
  DIVISION_CHIEF = 'DIVISION_CHIEF', // 본부장
  BRANCH_CHIEF = 'BRANCH_CHIEF', // 지부장
  MANAGER = 'MANAGER', // 매니저
  AGENT = 'AGENT', // 에이전트
  MEMBER = 'MEMBER', // 일반 회원
}

/**
 * 한글 라벨 매핑
 */
export const BonusTypeLabels: Record<BonusType, string> = {
  [BonusType.SALES]: '판매 보너스',
  [BonusType.SALES_MANAGEMENT]: '판매 관리 보너스',
  [BonusType.LICENSE]: '판권 보너스',
  [BonusType.LICENSE_MANAGEMENT]: '판권 관리 보너스',
  [BonusType.SHARING]: '공유 보너스',
  [BonusType.BRANCH_OPERATION]: '센터 운영 보너스',
};

export const BonusStatusLabels: Record<BonusStatus, string> = {
  [BonusStatus.PENDING]: '대기중',
  [BonusStatus.CONFIRMED]: '확정됨',
  [BonusStatus.PAID]: '지급 완료',
  [BonusStatus.CANCELLED]: '취소됨',
};

export const MemberGradeLabels: Record<MemberGrade, string> = {
  [MemberGrade.ADMIN]: '최고관리자',
  [MemberGrade.CENTER]: '센터',
  [MemberGrade.DIVISION_CHIEF]: '본부장',
  [MemberGrade.BRANCH_CHIEF]: '지부장',
  [MemberGrade.MANAGER]: '매니저',
  [MemberGrade.AGENT]: '에이전트',
  [MemberGrade.MEMBER]: '회원',
};

/**
 * Ant Design Tag 색상 매핑
 */
export const BonusTypeColors: Record<BonusType, string> = {
  [BonusType.SALES]: 'green',
  [BonusType.SALES_MANAGEMENT]: 'blue',
  [BonusType.LICENSE]: 'purple',
  [BonusType.LICENSE_MANAGEMENT]: 'magenta',
  [BonusType.SHARING]: 'orange',
  [BonusType.BRANCH_OPERATION]: 'cyan',
};

export const BonusStatusColors: Record<BonusStatus, string> = {
  [BonusStatus.PENDING]: 'warning',
  [BonusStatus.CONFIRMED]: 'processing',
  [BonusStatus.PAID]: 'success',
  [BonusStatus.CANCELLED]: 'default',
};

export const MemberGradeColors: Record<MemberGrade, string> = {
  [MemberGrade.ADMIN]: 'red',
  [MemberGrade.CENTER]: 'magenta',
  [MemberGrade.DIVISION_CHIEF]: 'orange',
  [MemberGrade.BRANCH_CHIEF]: 'gold',
  [MemberGrade.MANAGER]: 'green',
  [MemberGrade.AGENT]: 'blue',
  [MemberGrade.MEMBER]: 'default',
};
