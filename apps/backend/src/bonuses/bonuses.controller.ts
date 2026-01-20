import {
  Controller,
  Get,
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
import { BonusResponseDto } from './dto/bonus-response.dto';
import { BonusStatus, BonusType } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('bonuses')
@Controller('v1/bonuses')
@ApiBearerAuth()
export class BonusesController {
  constructor(private readonly bonusesService: BonusesService) {}

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

  // NOTE: 보너스 미리보기 및 계산은 compensation-plan 모듈의 bonus-calculator.service 또는 bonus-simulator.service 사용
}
