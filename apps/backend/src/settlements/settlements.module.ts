import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';
import { SettlementScheduleService } from './settlement-schedule.service';

/**
 * 정산 관리 모듈
 */
@Module({
  imports: [PrismaModule],
  controllers: [SettlementsController],
  providers: [SettlementsService, SettlementScheduleService],
  exports: [SettlementsService, SettlementScheduleService],
})
export class SettlementsModule {}
