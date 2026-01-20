import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigService } from './system-config.service';

/**
 * 시스템 설정 모듈
 * 시스템 전반의 설정 관리를 담당합니다.
 */
@Module({
  imports: [PrismaModule],
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
