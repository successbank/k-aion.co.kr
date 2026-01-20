import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CompensationPlanModule } from '../compensation-plan/compensation-plan.module';
import { MembersModule } from '../members/members.module';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

/**
 * 판매 관리 모듈
 */
@Module({
  imports: [
    PrismaModule,
    CompensationPlanModule,
    MembersModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
