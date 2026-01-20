import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GradeChangedEvent, PromotedEvent, MEMBER_EVENTS } from '../events/member-events';

/**
 * 회원 등급 변경 이벤트 리스너
 *
 * 향후 확장 가능:
 * - 알림 발송 (이메일, SMS, 푸시)
 * - 대시보드 업데이트
 * - 통계 집계
 * - 보너스 재계산
 * - BullMQ 큐로 전환
 */
@Injectable()
export class MemberGradeListener {
  private readonly logger = new Logger(MemberGradeListener.name);

  /**
   * 등급 변경 이벤트 핸들러
   */
  @OnEvent(MEMBER_EVENTS.GRADE_CHANGED)
  async handleGradeChanged(event: GradeChangedEvent) {
    this.logger.log(
      `등급 변경됨: ${event.memberName} (ID: ${event.memberId}) ` +
      `${event.previousGrade} → ${event.newGrade} ` +
      `(${event.changedBy === 'auto' ? '자동' : '수동 - 관리자 ID: ' + event.adminId})`
    );

    // TODO: 알림 발송
    // await this.notificationService.sendGradeChangeNotification(event);

    // TODO: 대시보드 업데이트
    // await this.dashboardService.updateMemberGrade(event.memberId);

    // TODO: BullMQ 큐에 작업 추가
    // await this.gradeChangeQueue.add('grade-changed', event);
  }

  /**
   * 승급 이벤트 핸들러
   */
  @OnEvent(MEMBER_EVENTS.PROMOTED)
  async handlePromoted(event: PromotedEvent) {
    this.logger.log(
      `자동 승급: ${event.memberName} (ID: ${event.memberId}) ` +
      `${event.previousGrade} → ${event.newGrade}`
    );

    // TODO: 축하 알림 발송
    // await this.notificationService.sendCongratulations(event);

    // TODO: 하위 회원들에게 알림
    // await this.notificationService.notifyDownline(event.memberId);
  }
}
