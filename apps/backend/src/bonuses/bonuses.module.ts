import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BonusesController } from './bonuses.controller';
import { BonusesService } from './bonuses.service';

/**
 * 보너스 모듈 (신규 수당 체계)
 * 참고: 실제 보너스 계산은 compensation-plan/services/bonus-calculator.service.ts에서 수행
 */
@Module({
  imports: [PrismaModule],
  controllers: [BonusesController],
  providers: [BonusesService],
  exports: [BonusesService],
})
export class BonusesModule {}
