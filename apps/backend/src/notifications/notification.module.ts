import { Module, Global } from '@nestjs/common';
import { NotificationService } from './notification.service';

/**
 * 알림 모듈
 * @Global() 데코레이터로 전역 모듈로 등록하여 어디서든 주입 가능
 */
@Global()
@Module({
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
