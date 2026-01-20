import { Module } from '@nestjs/common';
import { TempMembersController } from './temp-members.controller';
import { TempMembersService } from './temp-members.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TempMembersController],
  providers: [TempMembersService],
  exports: [TempMembersService],
})
export class TempMembersModule {}
