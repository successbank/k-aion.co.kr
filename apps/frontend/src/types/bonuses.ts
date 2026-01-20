/**
 * 보너스 유형 (신규 수당 체계)
 * SALES_COMMISSION: 판매 수수료 (판매원, 팀장)
 * EDUCATION_MANAGEMENT: 교육 관리 (지사장, 센터)
 */
export enum BonusType {
  SALES_COMMISSION = 'SALES_COMMISSION',
  EDUCATION_MANAGEMENT = 'EDUCATION_MANAGEMENT',
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
 * 회원 등급 (신규 등급 체계)
 * SALESPERSON: 판매원 (제품 1세트 판매 후 자격)
 * TEAM_LEADER: 팀장 (판매원 10명 소개, 한시적 3명)
 * BRANCH_MANAGER: 지사장 (팀장 10명 소개, 한시적 3명)
 * CENTER: 센터 (관리자 지정)
 * ADMIN: 관리자
 */
export enum MemberGrade {
  SALESPERSON = 'SALESPERSON',
  TEAM_LEADER = 'TEAM_LEADER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  CENTER = 'CENTER',
  ADMIN = 'ADMIN',
}

/**
 * 한글 라벨 매핑
 */
export const BonusTypeLabels: Record<BonusType, string> = {
  [BonusType.SALES_COMMISSION]: '판매 수수료',
  [BonusType.EDUCATION_MANAGEMENT]: '교육 관리 수수료',
};

export const BonusStatusLabels: Record<BonusStatus, string> = {
  [BonusStatus.PENDING]: '대기중',
  [BonusStatus.CONFIRMED]: '확정됨',
  [BonusStatus.PAID]: '지급 완료',
  [BonusStatus.CANCELLED]: '취소됨',
};

export const MemberGradeLabels: Record<MemberGrade, string> = {
  [MemberGrade.SALESPERSON]: '판매원',
  [MemberGrade.TEAM_LEADER]: '팀장',
  [MemberGrade.BRANCH_MANAGER]: '지사장',
  [MemberGrade.CENTER]: '센터',
  [MemberGrade.ADMIN]: '관리자',
};

/**
 * 등급 순서 (낮은 인덱스 = 높은 등급)
 */
export const MemberGradeOrder: MemberGrade[] = [
  MemberGrade.ADMIN,
  MemberGrade.CENTER,
  MemberGrade.BRANCH_MANAGER,
  MemberGrade.TEAM_LEADER,
  MemberGrade.SALESPERSON,
];

/**
 * Ant Design Tag 색상 매핑
 */
export const BonusTypeColors: Record<BonusType, string> = {
  [BonusType.SALES_COMMISSION]: 'green',
  [BonusType.EDUCATION_MANAGEMENT]: 'purple',
};

export const BonusStatusColors: Record<BonusStatus, string> = {
  [BonusStatus.PENDING]: 'warning',
  [BonusStatus.CONFIRMED]: 'processing',
  [BonusStatus.PAID]: 'success',
  [BonusStatus.CANCELLED]: 'default',
};

export const MemberGradeColors: Record<MemberGrade, string> = {
  [MemberGrade.SALESPERSON]: 'blue',
  [MemberGrade.TEAM_LEADER]: 'green',
  [MemberGrade.BRANCH_MANAGER]: 'gold',
  [MemberGrade.CENTER]: 'magenta',
  [MemberGrade.ADMIN]: 'red',
};

/**
 * 제품별 수당율 인터페이스
 */
export interface ProductCommissionRate {
  id: number;
  productId: number;
  recipientGrade: MemberGrade;
  amount: number;
  isActive: boolean;
}

/**
 * 보너스 미리보기 응답
 */
export interface BonusPreview {
  type: BonusType;
  typeKorean: string;
  recipientId: number;
  recipientName: string;
  recipientGrade: MemberGrade;
  recipientGradeKorean: string;
  amount: number;
  description: string;
}

export interface SaleBonusPreviewResponse {
  totalPrice: number;
  totalPv: number;
  bonuses: BonusPreview[];
  totalBonus: number;
}
