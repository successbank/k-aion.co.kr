import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BonusesService } from './bonuses.service';
import { BonusCalculatorService } from './bonus-calculator.service';
import { BonusResponseDto } from './dto/bonus-response.dto';
import { BonusStatus, BonusType } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('bonuses')
@Controller('v1/bonuses')
@ApiBearerAuth()
export class BonusesController {
  constructor(
    private readonly bonusesService: BonusesService,
    private readonly bonusCalculatorService: BonusCalculatorService,
  ) {}

  /**
   * 보너스 목록 조회
   */
  @Public()
  @Get()
  @ApiOperation({ summary: '보너스 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'memberId', required: false, type: Number })
  @ApiQuery({ name: 'weekCode', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: BonusStatus })
  @ApiQuery({ name: 'bonusType', required: false, enum: BonusType })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('memberId') memberId?: number,
    @Query('weekCode') weekCode?: string,
    @Query('status') status?: BonusStatus,
    @Query('bonusType') bonusType?: BonusType,
  ) {
    return this.bonusesService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      memberId: memberId ? Number(memberId) : undefined,
      weekCode,
      status,
      bonusType,
    });
  }

  /**
   * 보너스 상세 조회
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: '보너스 상세 조회' })
  @ApiResponse({ status: 200, type: BonusResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bonusesService.findOne(id);
  }

  /**
   * 회원별 보너스 통계
   */
  @Public()
  @Get('members/:memberId/summary')
  @ApiOperation({ summary: '회원별 보너스 통계' })
  @ApiQuery({ name: 'weekCode', required: false, type: String })
  getMemberSummary(
    @Param('memberId', ParseIntPipe) memberId: number,
    @Query('weekCode') weekCode?: string,
  ) {
    return this.bonusesService.getMemberBonusSummary(memberId, weekCode);
  }

  /**
   * 판매 기준 보너스 미리보기
   */
  @Public()
  @Get('preview/:sellerId')
  @ApiOperation({ summary: '판매 보너스 미리보기' })
  @ApiQuery({ name: 'saleAmount', required: true, type: Number })
  previewBonuses(
    @Param('sellerId', ParseIntPipe) sellerId: number,
    @Query('saleAmount', ParseIntPipe) saleAmount: number,
  ) {
    return this.bonusCalculatorService.previewBonuses(sellerId, saleAmount);
  }

  /**
   * 판매 발생 시 보너스 계산 (트리거)
   * TODO: 실제로는 판매 등록 시 자동 호출되어야 함
   */
  @Post('calculate/:saleId')
  @ApiOperation({ summary: '판매 보너스 계산 및 생성 (ADMIN)' })
  calculateBonuses(@Param('saleId', ParseIntPipe) saleId: number) {
    return this.bonusCalculatorService.calculateBonusesOnSale(saleId);
  }
}
