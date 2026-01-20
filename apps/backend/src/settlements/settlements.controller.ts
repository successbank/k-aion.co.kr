import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { SettlementQueryDto } from './dto/settlement-query.dto';
import { SettlementStatus } from '@prisma/client';

/**
 * 정산 관리 컨트롤러 (ADMIN 전용)
 */
@Controller('v1/settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  /**
   * GET /v1/settlements
   * 정산 목록 조회 (페이징)
   */
  @Get()
  async findAll(@Query() query: SettlementQueryDto) {
    return this.settlementsService.findAll(query);
  }

  /**
   * GET /v1/settlements/:id
   * 정산 상세 조회
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.settlementsService.findOne(id);
  }

  /**
   * POST /v1/settlements
   * 새 정산 주차 생성
   */
  @Post()
  async create(@Body() createDto: CreateSettlementDto) {
    return this.settlementsService.create(createDto);
  }

  /**
   * PATCH /v1/settlements/:id/calculate
   * 정산 계산 시작
   */
  @Patch(':id/calculate')
  async calculate(@Param('id', ParseIntPipe) id: number) {
    return this.settlementsService.calculate(id);
  }

  /**
   * PATCH /v1/settlements/:id/confirm
   * 정산 확정
   */
  @Patch(':id/confirm')
  async confirm(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    // TODO: JWT 토큰에서 userId 추출
    const userId = req.user?.id || 1; // 임시로 1 사용
    return this.settlementsService.confirm(id, userId);
  }

  /**
   * PATCH /v1/settlements/:id/pay
   * 정산 지급 처리
   */
  @Patch(':id/pay')
  async pay(@Param('id', ParseIntPipe) id: number) {
    return this.settlementsService.pay(id);
  }

  /**
   * PATCH /v1/settlements/:id/status
   * 정산 상태 변경 (관리자용)
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: SettlementStatus,
  ) {
    return this.settlementsService.updateStatus(id, status);
  }
}
