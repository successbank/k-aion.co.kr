import { Module } from '@nestjs/common';
import { CommissionRatesController } from './commission-rates.controller';
import { CommissionRatesService } from './commission-rates.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommissionRatesController],
  providers: [CommissionRatesService],
  exports: [CommissionRatesService],
})
export class CommissionRatesModule {}
