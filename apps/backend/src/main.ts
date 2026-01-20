import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppModule } from './app.module';

async function bootstrap() {
  // Winston 로거 설정
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context }) => {
            return `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
          }),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  // Global API Prefix
  app.setGlobalPrefix('api');

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS 설정
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger API 문서화
  const config = new DocumentBuilder()
    .setTitle('케이아이온 API')
    .setDescription(`
# 케이아이온 API 문서

## 개요
회원관리, 제품관리, 판매관리, 수당관리를 포함한 네트워크 마케팅 통합 관리 시스템

## 인증
대부분의 API는 JWT Bearer Token 인증이 필요합니다.

\`\`\`
Authorization: Bearer {your_jwt_token}
\`\`\`

## 등급 체계
- MEMBER: 회원
- AGENT: 에이전트 (누적 100만 PV)
- MANAGER: 매니저
- BRANCH_CHIEF: 지부장
- DIVISION_CHIEF: 본부장
- ADMIN: 최고관리자

## 문의
기술 문의: 박준혁 (백엔드 테크리드)
    `)
    .setVersion('2.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'JWT 토큰을 입력하세요',
        in: 'header',
      },
      'access-token',
    )
    .addTag('health', '🏥 헬스체크')
    .addTag('auth', '🔐 인증 (로그인/회원가입)')
    .addTag('members', '👥 회원 관리 (계보, 승급)')
    .addTag('products', '📦 제품 관리')
    .addTag('categories', '🗂️ 카테고리 관리')
    .addTag('sales', '🛒 판매 관리')
    .addTag('bonuses', '💰 보너스 관리')
    .addTag('settlements', '📊 정산 관리')
    .addTag('seminars', '🎓 세미나 관리')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Kaion API Docs',
    customCss: '.swagger-ui .topbar { background-color: #7CB342; }',
  });

  const port = process.env.PORT || 5659;
  await app.listen(port, '0.0.0.0');

  logger.log(`Application is running on: http://0.0.0.0:${port}`, 'Bootstrap');
  logger.log(`API Documentation: http://0.0.0.0:${port}/api`, 'Bootstrap');
}

bootstrap();
