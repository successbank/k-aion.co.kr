import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IntegrityCheckService } from '../members/integrity-check.service';
import { NotificationService } from '../notifications/notification.service';

/**
 * 무결성 검사 스케줄러 서비스
 *
 * 매일 오전 3시에 자동으로 회원 데이터 무결성 검사를 실행하고
 * 위반 사항이 발견되면 자동 수정 후 알림을 발송합니다.
 */
@Injectable()
export class IntegritySchedulerService {
  private readonly logger = new Logger(IntegritySchedulerService.name);

  constructor(
    private readonly integrityCheckService: IntegrityCheckService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 매일 오전 3시에 자동 무결성 검사 실행
   * Cron: 0 3 * * * (매일 03:00:00)
   */
  @Cron('0 3 * * *')
  async runDailyIntegrityCheck(): Promise<void> {
    this.logger.log('=== 일일 무결성 검사 시작 ===');

    try {
      // 자동 수정 모드로 검사 실행
      const report = await this.integrityCheckService.runFullIntegrityCheck(true);

      // 검사 이력 저장 (시스템 자동 실행이므로 adminId 없음)
      await this.integrityCheckService.saveCheckHistory(report);

      // 결과 로깅
      this.logger.log(
        `일일 무결성 검사 완료: ` +
          `전체 회원 ${report.totalMembers}명, ` +
          `위반 ${report.summary.totalViolations}건 발견, ` +
          `${report.fixes?.totalFixed || 0}건 자동 수정됨`,
      );

      // 위반 사항이 있었다면 알림 발송
      if (!report.healthy && report.summary.totalViolations > 0) {
        await this.sendIntegrityAlertNotification(report);
      }
    } catch (error) {
      this.logger.error(
        `일일 무결성 검사 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    this.logger.log('=== 일일 무결성 검사 종료 ===');
  }

  /**
   * 무결성 검사 결과 알림 발송
   */
  private async sendIntegrityAlertNotification(
    report: Awaited<ReturnType<IntegrityCheckService['runFullIntegrityCheck']>>,
  ): Promise<void> {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!slackWebhookUrl) {
      this.logger.warn('SLACK_WEBHOOK_URL이 설정되지 않아 무결성 검사 알림을 발송할 수 없습니다.');
      return;
    }

    try {
      const message = this.buildSlackMessage(report);

      const response = await fetch(slackWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Slack API 오류: ${response.status} ${response.statusText}`);
      }

      this.logger.log('무결성 검사 알림 발송 완료');
    } catch (error) {
      this.logger.error(
        `무결성 검사 알림 발송 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Slack 알림 메시지 빌드
   */
  private buildSlackMessage(
    report: Awaited<ReturnType<IntegrityCheckService['runFullIntegrityCheck']>>,
  ) {
    const { summary, fixes } = report;

    // 위반 유형별 이모지
    const violationEmojis = {
      circularReferences: '🔄',
      orphanNodes: '👻',
      invalidTeamLines: '🔢',
      selfReferences: '🪞',
      inactiveParentReferences: '⚠️',
    };

    // 위반 유형별 한글명
    const violationLabels = {
      circularReferences: '순환 참조',
      orphanNodes: '고아 노드',
      invalidTeamLines: '유효하지 않은 팀라인',
      selfReferences: '자기 참조',
      inactiveParentReferences: '비활성 상위자 참조',
    };

    // 위반 항목 텍스트 생성
    const violationItems = Object.entries(summary)
      .filter(([key, value]) => key !== 'totalViolations' && value > 0)
      .map(
        ([key, value]) =>
          `${violationEmojis[key as keyof typeof violationEmojis] || '•'} ${
            violationLabels[key as keyof typeof violationLabels] || key
          }: ${value}건`,
      );

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: report.healthy
            ? '✅ 일일 무결성 검사 완료 (정상)'
            : '⚠️ 일일 무결성 검사 - 위반 발견',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*검사 시간:*\n${new Date(report.executedAt).toLocaleString('ko-KR')}`,
          },
          {
            type: 'mrkdwn',
            text: `*전체 회원:*\n${report.totalMembers}명`,
          },
          {
            type: 'mrkdwn',
            text: `*발견된 위반:*\n${summary.totalViolations}건`,
          },
          {
            type: 'mrkdwn',
            text: `*자동 수정:*\n${fixes?.totalFixed || 0}건`,
          },
        ],
      },
    ];

    // 위반 항목이 있으면 상세 표시
    if (violationItems.length > 0) {
      blocks.push(
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*위반 항목 상세:*\n${violationItems.join('\n')}`,
          },
        },
      );
    }

    // 수정 실패 항목이 있으면 경고
    if (fixes?.failedFixes && fixes.failedFixes.length > 0) {
      blocks.push(
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              `*❌ 수정 실패 항목 (${fixes.failedFixes.length}건):*\n` +
              fixes.failedFixes
                .slice(0, 5)
                .map((f) => `• 회원 ID ${f.memberId} (${f.memberName}): ${f.error}`)
                .join('\n') +
              (fixes.failedFixes.length > 5 ? `\n... 외 ${fixes.failedFixes.length - 5}건` : ''),
          },
        },
      );
    }

    // 관리자 페이지 링크
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
              text: '무결성 검사 페이지로 이동',
              emoji: true,
            },
            url: `${adminUrl}/admin/integrity-check`,
            style: report.healthy ? 'primary' : 'danger',
          },
        ],
      },
    );

    return {
      blocks,
      text: report.healthy
        ? `✅ 일일 무결성 검사 완료 - ${report.totalMembers}명 검사, 정상`
        : `⚠️ 일일 무결성 검사 - ${summary.totalViolations}건 위반 발견, ${fixes?.totalFixed || 0}건 자동 수정`,
    };
  }
}
