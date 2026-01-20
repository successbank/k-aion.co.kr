import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MembersModule } from './members/members.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { CompensationPlanModule } from './compensation-plan/compensation-plan.module';
import { SettlementsModule } from './settlements/settlements.module';
import { BonusesModule } from './bonuses/bonuses.module';
import { CommissionRatesModule } from './commission-rates/commission-rates.module';
import { TempMembersModule } from './temp-members/temp-members.module';
import { UploadModule } from './upload/upload.module';
import { RecognizedSalesModule } from './recognized-sales/recognized-sales.module';
import { OrdersModule } from './orders/orders.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { NotificationModule } from './notifications/notification.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksModule } from './tasks/tasks.module';
import { BackupModule } from './backup/backup.module';
import { SystemConfigModule } from './system-config/system-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    MembersModule,
    ProductsModule,
    SalesModule,
    CompensationPlanModule,
    SettlementsModule,
    BonusesModule,
    CommissionRatesModule,
    TempMembersModule,
    UploadModule,
    RecognizedSalesModule,
    OrdersModule,
    ActivityLogsModule,
    NotificationModule,
    ScheduleModule.forRoot(),
    TasksModule,
    BackupModule,
    SystemConfigModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
