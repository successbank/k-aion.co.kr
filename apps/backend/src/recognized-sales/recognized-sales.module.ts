import { Module } from '@nestjs/common';
import { RecognizedSalesController } from './recognized-sales.controller';
import { RecognizedSalesService } from './recognized-sales.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecognizedSalesController],
  providers: [RecognizedSalesService],
  exports: [RecognizedSalesService],
})
export class RecognizedSalesModule {}
