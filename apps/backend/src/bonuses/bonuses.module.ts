import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommissionRatesModule } from '../commission-rates/commission-rates.module';
import { BonusesController } from './bonuses.controller';
import { BonusesService } from './bonuses.service';
import { BonusCalculatorService } from './bonus-calculator.service';

@Module({
  imports: [PrismaModule, CommissionRatesModule],
  controllers: [BonusesController],
  providers: [BonusesService, BonusCalculatorService],
  exports: [BonusesService, BonusCalculatorService],
})
export class BonusesModule {}
