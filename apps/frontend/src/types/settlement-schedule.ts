/**
 * 정산 스케줄 주기 타입
 */
export enum SettlementCycleType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

/**
 * 정산 스케줄 인터페이스
 */
export interface SettlementSchedule {
  id: number;
  name: string;
  cycleType: SettlementCycleType;
  dayOfWeek?: number; // 0-6 (일-토)
  dayOfMonth?: number; // 1-31
  hour: number;
  minute: number;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
  updatedAt: string;
  // 한글 설명
  cycleDescription?: string;
  nextRunDescription?: string;
}

/**
 * 스케줄 생성 DTO
 */
export interface CreateScheduleDto {
  name: string;
  cycleType: SettlementCycleType;
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour: number;
  minute: number;
  isActive?: boolean;
}

/**
 * 스케줄 수정 DTO
 */
export interface UpdateScheduleDto {
  name?: string;
  cycleType?: SettlementCycleType;
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour?: number;
  minute?: number;
  isActive?: boolean;
}

/**
 * 수동(특정날짜) 정산 생성 DTO
 */
export interface CreateManualSettlementDto {
  startDate: string;
  endDate: string;
  weekCode?: string;
}

/**
 * 중복 체크 요청 DTO
 */
export interface CheckOverlapDto {
  startDate: string;
  endDate: string;
}

/**
 * 충돌 정산 정보
 */
export interface ConflictingSettlement {
  id: number;
  weekCode: string;
  startDate: string;
  endDate: string;
}

/**
 * 중복 체크 결과
 */
export interface OverlapCheckResult {
  overlaps: boolean;
  conflictingSettlements: ConflictingSettlement[];
  message?: string;
}

/**
 * 날짜 유효성 검사 결과
 */
export interface DateValidationResult {
  valid: boolean;
  latestEndDate?: string;
  message: string;
}

/**
 * 주기 타입 한글 변환
 */
export function getCycleTypeKorean(cycleType: SettlementCycleType): string {
  const map = {
    [SettlementCycleType.DAILY]: '매일',
    [SettlementCycleType.WEEKLY]: '매주',
    [SettlementCycleType.MONTHLY]: '매월',
  };
  return map[cycleType] || cycleType;
}

/**
 * 요일 한글 변환
 */
export function getDayOfWeekKorean(dayOfWeek: number): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[dayOfWeek] || '';
}

/**
 * 요일 옵션 목록
 */
export const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: '일요일' },
  { value: 1, label: '월요일' },
  { value: 2, label: '화요일' },
  { value: 3, label: '수요일' },
  { value: 4, label: '목요일' },
  { value: 5, label: '금요일' },
  { value: 6, label: '토요일' },
];

/**
 * 일자 옵션 목록 (1-31)
 */
export const DAY_OF_MONTH_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}일`,
}));

/**
 * 시간 옵션 목록 (0-23)
 */
export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}시`,
}));

/**
 * 분 옵션 목록 (0, 15, 30, 45)
 */
export const MINUTE_OPTIONS = [
  { value: 0, label: '00분' },
  { value: 15, label: '15분' },
  { value: 30, label: '30분' },
  { value: 45, label: '45분' },
];
