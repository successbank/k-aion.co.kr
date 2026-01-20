import { MemberGrade } from '@prisma/client';

/**
 * 회원 이벤트 상수
 */
export const MEMBER_EVENTS = {
  GRADE_CHANGED: 'member.grade.changed',
  MEMBER_CREATED: 'member.created',
  MEMBER_UPDATED: 'member.updated',
  MEMBER_DELETED: 'member.deleted',
  PROMOTED: 'member.promoted',
  PV_ACCUMULATED: 'member.pv.accumulated',
} as const;

/**
 * 등급 변경 이벤트
 */
export class GradeChangedEvent {
  constructor(
    public readonly memberId: number,
    public readonly memberName: string,
    public readonly memberEmail: string,
    public readonly previousGrade: MemberGrade,
    public readonly newGrade: MemberGrade,
    public readonly changedBy: 'auto' | 'manual',
    public readonly adminId?: number,
  ) {}
}

/**
 * 회원 생성 이벤트
 */
export class MemberCreatedEvent {
  constructor(
    public readonly memberId: number,
    public readonly memberEmail: string,
    public readonly memberName: string,
    public readonly grade: MemberGrade,
    public readonly recommenderId?: number,
    public readonly sponsorId?: number,
  ) {}
}

/**
 * PV 누적 이벤트
 */
export class PvAccumulatedEvent {
  constructor(
    public readonly memberId: number,
    public readonly previousPv: number,
    public readonly newPv: number,
    public readonly addedPv: number,
  ) {}
}

/**
 * 승급 이벤트
 */
export class PromotedEvent {
  constructor(
    public readonly memberId: number,
    public readonly memberName: string,
    public readonly previousGrade: MemberGrade,
    public readonly newGrade: MemberGrade,
  ) {}
}
