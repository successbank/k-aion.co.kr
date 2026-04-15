import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { PromotionService } from './promotion.service';
import { GenealogyService } from './genealogy.service';
import { IntegrityCheckService } from './integrity-check.service';
import { MemberGradeListener } from './listeners/member-grade.listener';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MembersController],
  // Stage 4 DEV1-003 (2026-04-15): MemberGradeListener providers 등록.
  // 이전에는 listener 클래스가 작성만 되고 providers에 미등록 → @OnEvent 핸들러
  // 0건 활성화 상태 (event-emitter 전체 미작동). app.module.ts에 EventEmitterModule
  // 활성화 필요 (함께 처리).
  providers: [MembersService, PromotionService, GenealogyService, IntegrityCheckService, MemberGradeListener],
  exports: [MembersService, PromotionService, GenealogyService, IntegrityCheckService],
})
export class MembersModule {}
