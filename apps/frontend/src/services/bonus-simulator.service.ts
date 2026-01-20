/**
 * 보너스 시뮬레이터 서비스
 */
import { api } from '@/lib/api';

// 회원 등급 타입 (신규 등급체계)
export type MemberGrade =
  | 'SALESPERSON'    // 판매원 (구: MEMBER, AGENT)
  | 'TEAM_LEADER'    // 팀장 (구: MANAGER)
  | 'BRANCH_MANAGER' // 지사장 (구: BRANCH_CHIEF, DIVISION_CHIEF)
  | 'CENTER'         // 센터
  | 'ADMIN'          // 관리자
  // 레거시 호환 (기존 데이터 지원)
  | 'MEMBER'
  | 'AGENT'
  | 'MANAGER'
  | 'BRANCH_CHIEF'
  | 'DIVISION_CHIEF';

// 보너스 타입
export type BonusType =
  | 'SALES'
  | 'SALES_MANAGEMENT'
  | 'LICENSE'
  | 'LICENSE_MANAGEMENT'
  | 'SHARING'
  | 'BRANCH_OPERATION';

// 보너스 시뮬레이션 요청
export interface BonusSimulationRequest {
  sellerId: number;
  productId: number;
  quantity: number;
}

// 보너스 수령자 정보
export interface BonusRecipient {
  id: number;
  name: string;
  grade: MemberGrade;
  relation: string;
}

// 시뮬레이션된 개별 보너스
export interface SimulatedBonus {
  type: BonusType;
  typeName: string;
  recipient: BonusRecipient | null;
  amount: number;
  qualified: boolean;
  qualificationReason?: string;
}

// 보너스 시뮬레이션 응답
export interface BonusSimulationResponse {
  seller: {
    id: number;
    name: string;
    username: string;
    actualGrade: MemberGrade;
    effectiveGrade: MemberGrade;
    cumulativePv: number;
  };
  product: {
    id: number;
    name: string;
    code: string;
    price: number;
    pv: number;
  };
  quantity: number;
  totalPrice: number;
  totalPv: number;
  bonuses: SimulatedBonus[];
  totalBonus: number;
}

// 자격 조건 체크 결과
export interface QualificationCheck {
  targetGrade: MemberGrade;
  required: string;
  current: string;
  qualified: boolean;
  details?: string;
}

// 팀 자격 조건 응답
export interface TeamQualificationResponse {
  memberId: number;
  memberName: string;
  memberGrade: MemberGrade;
  effectiveGrade: MemberGrade;
  teamStats: {
    teams: Array<{
      teamLine: number;
      agentCount: number;
      managerCount: number;
      branchChiefCount: number;
      divisionChiefCount: number;
      totalCount: number;
    }>;
    totals: {
      agentCount: number;
      managerCount: number;
      branchChiefCount: number;
      divisionChiefCount: number;
      totalCount: number;
    };
  };
  qualifications: {
    managerCultivation: QualificationCheck;
    branchChiefCultivation: QualificationCheck;
    divisionChiefCultivation: QualificationCheck;
  };
}

// 수당률 요약 응답
export interface CommissionRateSummaryResponse {
  rates: Array<{
    bonusType: BonusType;
    bonusTypeName: string;
    isGradeTiered: boolean;
    baseAmount?: number;
    tiers?: Array<{
      grade: MemberGrade;
      gradeName: string;
      amount: number;
    }>;
    description?: string;
  }>;
}

// 등급 한글명 매핑 (신규 + 레거시 호환)
export const GRADE_LABELS: Record<string, string> = {
  // 신규 등급체계
  SALESPERSON: '판매원',
  TEAM_LEADER: '팀장',
  BRANCH_MANAGER: '지사장',
  CENTER: '센터',
  ADMIN: '관리자',
  // 레거시 호환
  MEMBER: '회원',
  AGENT: '에이전트',
  MANAGER: '매니저',
  BRANCH_CHIEF: '지부장',
  DIVISION_CHIEF: '본부장',
};

// 등급별 색상 매핑
export const GRADE_COLORS: Record<string, string> = {
  // 신규 등급체계
  SALESPERSON: '#52c41a',    // 녹색
  TEAM_LEADER: '#1890ff',    // 파랑
  BRANCH_MANAGER: '#722ed1', // 보라
  CENTER: '#fa8c16',         // 주황
  ADMIN: '#f5222d',          // 빨강
  // 레거시 호환
  MEMBER: '#d9d9d9',
  AGENT: '#1890ff',
  MANAGER: '#52c41a',
  BRANCH_CHIEF: '#722ed1',
  DIVISION_CHIEF: '#faad14',
};

// 보너스 타입별 색상
export const BONUS_TYPE_COLORS: Record<BonusType, string> = {
  SALES: '#E53935',
  SALES_MANAGEMENT: '#1890ff',
  LICENSE: '#722ed1',
  LICENSE_MANAGEMENT: '#eb2f96',
  SHARING: '#faad14',
  BRANCH_OPERATION: '#13c2c2',
};

class BonusSimulatorService {
  /**
   * 판매 시뮬레이션 - 6가지 보너스 계산
   */
  async simulateSale(request: BonusSimulationRequest): Promise<BonusSimulationResponse> {
    const { data } = await api.post<BonusSimulationResponse>(
      '/v1/compensation-plan/bonuses/simulate',
      request,
    );
    return data;
  }

  /**
   * 회원의 팀 자격 조건 조회
   */
  async getTeamQualification(memberId: number): Promise<TeamQualificationResponse> {
    const { data } = await api.get<TeamQualificationResponse>(
      `/v1/compensation-plan/members/${memberId}/team-qualification`,
    );
    return data;
  }

  /**
   * 활성 수당률 요약 조회
   */
  async getCommissionRateSummary(): Promise<CommissionRateSummaryResponse> {
    const { data } = await api.get<CommissionRateSummaryResponse>(
      '/v1/compensation-plan/commission-rates/active-summary',
    );
    return data;
  }
}

export const bonusSimulatorService = new BonusSimulatorService();
