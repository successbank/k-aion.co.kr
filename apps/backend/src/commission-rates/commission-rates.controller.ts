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
  ParseEnumPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CommissionRatesService } from './commission-rates.service';
import { CreateCommissionRateDto } from './dto/create-commission-rate.dto';
import { UpdateCommissionRateDto } from './dto/update-commission-rate.dto';
import { BonusType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequireGrades } from '../auth/decorators/require-grades.decorator';

@ApiTags('Commission Rates')
@Controller('v1/admin/commission-rates')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@RequireGrades('ADMIN')
export class CommissionRatesController {
  constructor(private readonly commissionRatesService: CommissionRatesService) {}

  /**
   * GET /v1/admin/commission-rates/summary
   * 7가지 보너스 요약
   */
  @Get('summary')
  @ApiOperation({ summary: '7가지 보너스 요약 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getSummary() {
    return this.commissionRatesService.getSummary();
  }

  /**
   * GET /v1/admin/commission-rates/bonus-type/:type
   * 보너스 유형별 활성 설정 조회
   */
  @Get('bonus-type/:type')
  @ApiOperation({ summary: '보너스 유형별 활성 설정 조회' })
  @ApiParam({ name: 'type', enum: BonusType })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findByBonusType(@Param('type', new ParseEnumPipe(BonusType)) type: BonusType) {
    return this.commissionRatesService.findActiveByBonusType(type);
  }

  /**
   * GET /v1/admin/commission-rates
   * 전체 보너스 설정 목록 조회 (페이지네이션, 필터)
   */
  @Get()
  @ApiOperation({ summary: '보너스 설정 목록 조회' })
  @ApiQuery({ name: 'bonusType', enum: BonusType, required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  @ApiResponse({ status: 200, description: '목록 조회 성공' })
  async findAll(
    @Query('bonusType') bonusType?: BonusType,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commissionRatesService.findAll({
      bonusType,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * GET /v1/admin/commission-rates/:id
   * 보너스 설정 상세 조회
   */
  @Get(':id')
  @ApiOperation({ summary: '보너스 설정 상세 조회' })
  @ApiParam({ name: 'id', description: '보너스 설정 ID' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '설정을 찾을 수 없음' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.commissionRatesService.findOne(id);
  }

  /**
   * POST /v1/admin/commission-rates
   * 신규 보너스 설정 생성
   */
  @Post()
  @ApiOperation({ summary: '보너스 설정 생성' })
  @ApiResponse({ status: 201, description: '생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async create(@Body() dto: CreateCommissionRateDto) {
    return this.commissionRatesService.create(dto);
  }

  /**
   * PATCH /v1/admin/commission-rates/:id
   * 보너스 설정 수정
   */
  @Patch(':id')
  @ApiOperation({ summary: '보너스 설정 수정' })
  @ApiParam({ name: 'id', description: '보너스 설정 ID' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 404, description: '설정을 찾을 수 없음' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCommissionRateDto) {
    return this.commissionRatesService.update(id, dto);
  }

  /**
   * DELETE /v1/admin/commission-rates/:id
   * 보너스 설정 삭제 (소프트 삭제)
   */
  @Delete(':id')
  @ApiOperation({ summary: '보너스 설정 삭제 (비활성화)' })
  @ApiParam({ name: 'id', description: '보너스 설정 ID' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '설정을 찾을 수 없음' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.commissionRatesService.remove(id);
  }

  /**
   * POST /v1/admin/commission-rates/:id/activate
   * 버전 활성화
   */
  @Post(':id/activate')
  @ApiOperation({ summary: '보너스 설정 활성화 (기존 버전 비활성화)' })
  @ApiParam({ name: 'id', description: '활성화할 보너스 설정 ID' })
  @ApiResponse({ status: 200, description: '활성화 성공' })
  @ApiResponse({ status: 404, description: '설정을 찾을 수 없음' })
  async activate(@Param('id', ParseIntPipe) id: number) {
    return this.commissionRatesService.activate(id);
  }

  /**
   * POST /v1/admin/commission-rates/:id/duplicate
   * 버전 복제
   */
  @Post(':id/duplicate')
  @ApiOperation({ summary: '보너스 설정 복제 (새 버전 생성)' })
  @ApiParam({ name: 'id', description: '복제할 보너스 설정 ID' })
  @ApiResponse({ status: 201, description: '복제 성공' })
  @ApiResponse({ status: 404, description: '설정을 찾을 수 없음' })
  async duplicate(@Param('id', ParseIntPipe) id: number) {
    return this.commissionRatesService.duplicate(id);
  }
}
