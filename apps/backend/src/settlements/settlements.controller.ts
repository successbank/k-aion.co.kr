import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { SettlementScheduleService } from './settlement-schedule.service';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { SettlementQueryDto } from './dto/settlement-query.dto';
import { SettlementStatus } from '@prisma/client';
import {
  CreateSettlementScheduleDto,
  UpdateSettlementScheduleDto,
} from './dto/settlement-schedule.dto';
import {
  CreateManualSettlementDto,
  CheckOverlapDto,
} from './dto/create-manual-settlement.dto';

/**
 * 정산 관리 컨트롤러 (ADMIN 전용)
 */
@Controller('v1/settlements')
export class SettlementsController {
  constructor(
    private readonly settlementsService: SettlementsService,
    private readonly scheduleService: SettlementScheduleService,
  ) {}

  /**
   * GET /v1/settlements
   * 정산 목록 조회 (페이징)
   */
  @Get()
  async findAll(@Query() query: SettlementQueryDto) {
    return this.settlementsService.findAll(query);
  }

  // ==================== 정적 라우트 (파라미터 라우트보다 먼저 정의) ====================

  /**
   * GET /v1/settlements/schedule
   * 활성 정산 스케줄 조회
   */
  @Get('schedule')
  async getSchedule() {
    return this.scheduleService.getActiveSchedule();
  }

  /**
   * GET /v1/settlements/schedules
   * 모든 정산 스케줄 조회
   */
  @Get('schedules')
  async getAllSchedules() {
    return this.scheduleService.findAll();
  }

  /**
   * GET /v1/settlements/validate-date
   * 시작 날짜 유효성 검사 (최근 정산 이후인지)
   */
  @Get('validate-date')
  async validateDate(@Query('startDate') startDate: string) {
    return this.settlementsService.validateDateAfterLatest(new Date(startDate));
  }

  // ==================== 파라미터 라우트 (정적 라우트 이후에 정의) ====================

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
   * POST /v1/settlements/schedule
   * 새 정산 스케줄 생성
   */
  @Post('schedule')
  async createSchedule(@Body() dto: CreateSettlementScheduleDto) {
    return this.scheduleService.create(dto);
  }

  /**
   * POST /v1/settlements/manual
   * 수동(특정날짜) 정산 생성
   */
  @Post('manual')
  async createManualSettlement(@Body() dto: CreateManualSettlementDto) {
    return this.settlementsService.createManualSettlement(dto);
  }

  /**
   * POST /v1/settlements/check-overlap
   * 정산 기간 중복 체크
   */
  @Post('check-overlap')
  async checkOverlap(@Body() dto: CheckOverlapDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    return this.settlementsService.checkOverlap(startDate, endDate);
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

  /**
   * PATCH /v1/settlements/schedule/:id
   * 정산 스케줄 수정
   */
  @Patch('schedule/:id')
  async updateSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSettlementScheduleDto,
  ) {
    return this.scheduleService.update(id, dto);
  }

  /**
   * DELETE /v1/settlements/schedule/:id
   * 정산 스케줄 삭제
   */
  @Delete('schedule/:id')
  async deleteSchedule(@Param('id', ParseIntPipe) id: number) {
    await this.scheduleService.remove(id);
    return { success: true, message: '스케줄이 삭제되었습니다.' };
  }
}
