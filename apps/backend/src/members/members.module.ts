import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { PromotionService } from './promotion.service';
import { GenealogyService } from './genealogy.service';
import { IntegrityCheckService } from './integrity-check.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MembersController],
  providers: [MembersService, PromotionService, GenealogyService, IntegrityCheckService],
  exports: [MembersService, PromotionService, GenealogyService, IntegrityCheckService],
})
export class MembersModule {}
