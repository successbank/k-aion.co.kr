import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 전역 Exception Filter
 * - 모든 예외를 일원화하여 처리
 * - 에러 로깅 (Winston)
 * - Activity Log 기록 (비동기, 실패해도 응답에 영향 없음)
 * - 일관된 에러 응답 형식 제공
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // HTTP 상태 코드 결정
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 에러 메시지 추출
    let message = '서버 내부 오류가 발생했습니다';
    let errorDetails: any = null;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || message;
        errorDetails = (exceptionResponse as any).error || null;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // 요청자 정보 추출
    const userId = (request as any).user?.id || null;
    const ipAddress =
      request.headers['x-forwarded-for']?.toString().split(',')[0] ||
      request.socket.remoteAddress ||
      'unknown';

    // 1. 에러 로깅 (Winston)
    const errorLog = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      status,
      message,
      userId,
      ip: ipAddress,
      userAgent: request.headers['user-agent'],
    };

    if (status >= 500) {
      // 서버 에러는 스택 트레이스 포함
      this.logger.error(
        `[${request.method}] ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
        JSON.stringify(errorLog),
      );
    } else if (status >= 400) {
      // 클라이언트 에러는 경고 수준
      this.logger.warn(
        `[${request.method}] ${request.url} - ${status}: ${message}`,
      );
    }

    // 2. 심각한 에러(500+) Activity Log 기록 (비동기)
    if (status >= 500 && userId) {
      this.logErrorToActivityLog(userId, request, status, message, exception).catch(
        (logError) => {
          this.logger.warn(`Activity Log 기록 실패: ${logError.message}`);
        },
      );
    }

    // 3. 클라이언트 응답
    const errorResponse = {
      statusCode: status,
      message: Array.isArray(message) ? message : [message],
      error: errorDetails || this.getErrorName(status),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Activity Log에 에러 기록 (비동기)
   */
  private async logErrorToActivityLog(
    userId: number,
    request: Request,
    status: number,
    message: string,
    exception: unknown,
  ) {
    try {
      await this.prisma.activityLog.create({
        data: {
          memberId: userId,
          action: 'ERROR_OCCURRED',
          targetType: 'SYSTEM',
          targetId: null,
          details: {
            status,
            method: request.method,
            url: request.url,
            message,
            errorName: exception instanceof Error ? exception.name : 'UnknownError',
            timestamp: new Date().toISOString(),
          },
          ipAddress:
            request.headers['x-forwarded-for']?.toString().split(',')[0] ||
            request.socket.remoteAddress ||
            null,
        },
      });
    } catch (error) {
      // Activity Log 기록 실패는 무시 (응답에 영향 없음)
      throw error;
    }
  }

  /**
   * HTTP 상태 코드에 따른 에러 이름 반환
   */
  private getErrorName(status: number): string {
    const errorNames: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };

    return errorNames[status] || 'Error';
  }

  /**
   * 심각한 에러 여부 판단
   * TODO: 향후 Slack/Email 알림 연동 시 사용
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private isCriticalError(_exception: unknown, _status: number): boolean {
    // 500 에러 + 특정 조건 (예: 데이터베이스 연결 실패)
    // 향후 확장 가능
    return false;
  }
}
