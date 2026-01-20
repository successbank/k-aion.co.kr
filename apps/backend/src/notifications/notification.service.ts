import { Injectable, Logger } from '@nestjs/common';
import {
  RollbackReason,
  RollbackReasonLabels,
  DebugInfo,
} from '../members/dto/rollback-member.dto';

/**
 * 시스템 오류 롤백 알림 데이터 인터페이스
 */
export interface SystemErrorRollbackNotification {
  memberId: number;
  memberName: string;
  rollbackTime: string;
  adminId: number;
  adminName?: string;
  restoredFields: string[];
  changes: Array<{
    field: string;
    before: any;
    after: any;
  }>;
  rollbackReason: RollbackReason;
  rollbackReasonDetail?: string;
  debugInfo?: DebugInfo;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

  /**
   * Slack으로 시스템 오류 롤백 알림 발송
   */
  async sendSystemErrorRollbackNotification(
    data: SystemErrorRollbackNotification,
  ): Promise<boolean> {
    if (!this.slackWebhookUrl) {
      this.logger.warn('SLACK_WEBHOOK_URL이 설정되지 않아 알림을 발송할 수 없습니다.');
      return false;
    }

    try {
      const message = this.buildSlackMessage(data);

      const response = await fetch(this.slackWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Slack API 오류: ${response.status} ${response.statusText}`);
      }

      this.logger.log(
        `시스템 오류 롤백 알림 발송 완료: 회원 ID ${data.memberId} (${data.memberName})`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Slack 알림 발송 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Slack Block Kit 메시지 빌드
   */
  private buildSlackMessage(data: SystemErrorRollbackNotification) {
    const changesText = data.changes
      .map((c) => `• \`${c.field}\`: ${this.formatValue(c.before)} → ${this.formatValue(c.after)}`)
      .join('\n');

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 시스템 오류 롤백 발생',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*회원 ID:*\n${data.memberId}`,
          },
          {
            type: 'mrkdwn',
            text: `*회원명:*\n${data.memberName}`,
          },
          {
            type: 'mrkdwn',
            text: `*롤백 시간:*\n${data.rollbackTime}`,
          },
          {
            type: 'mrkdwn',
            text: `*관리자 ID:*\n${data.adminId}${data.adminName ? ` (${data.adminName})` : ''}`,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*복원된 필드:*\n\`${data.restoredFields.join('`, `')}\``,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*상세 변경:*\n${changesText}`,
        },
      },
    ];

    // 롤백 사유 상세가 있으면 추가
    if (data.rollbackReasonDetail) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*롤백 사유:*\n${data.rollbackReasonDetail}`,
        },
      });
    }

    // 디버깅 정보가 있으면 추가
    if (data.debugInfo) {
      blocks.push(
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*디버깅 정보:*',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              '```' +
              JSON.stringify(
                {
                  originalErrorLogId: data.debugInfo.originalErrorLogId,
                  systemInfo: data.debugInfo.systemInfo,
                  recentLogs: data.debugInfo.relatedLogs?.slice(0, 3).map((l) => ({
                    logId: l.logId,
                    action: l.action,
                    createdAt: l.createdAt,
                  })),
                },
                null,
                2,
              ) +
              '```',
          },
        },
      );
    }

    // 관리자 페이지 링크 (환경변수로 설정 가능)
    const adminUrl = process.env.ADMIN_BASE_URL || 'http://localhost:5659';
    blocks.push(
      {
        type: 'divider',
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '관리자 페이지로 이동',
              emoji: true,
            },
            url: `${adminUrl}/admin/users`,
            style: 'primary',
          },
        ],
      },
    );

    return {
      blocks,
      text: `🚨 시스템 오류 롤백 발생 - 회원 ID ${data.memberId} (${data.memberName})`,
    };
  }

  /**
   * 값 포맷팅 (null, undefined 처리)
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '_없음_';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }
}
