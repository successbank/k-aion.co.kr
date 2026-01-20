import { Module } from '@nestjs/common';
import { CompensationPlanController } from './controllers/compensation-plan.controller';
import { BonusCalculatorService } from './services/bonus-calculator.service';
import { BonusSimulatorService } from './services/bonus-simulator.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MembersModule } from '../members/members.module';
import { CommissionRatesModule } from '../commission-rates/commission-rates.module';
import { RecognizedSalesModule } from '../recognized-sales/recognized-sales.module';

@Module({
  imports: [PrismaModule, MembersModule, CommissionRatesModule, RecognizedSalesModule],
  controllers: [CompensationPlanController],
  providers: [BonusCalculatorService, BonusSimulatorService],
  exports: [BonusCalculatorService, BonusSimulatorService],
})
export class CompensationPlanModule {}
