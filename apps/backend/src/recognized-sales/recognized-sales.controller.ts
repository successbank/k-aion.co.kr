import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RecognizedSalesService } from './recognized-sales.service';
import { CreateRecognizedSalesDto } from './dto/create-recognized-sales.dto';
import { UpdateRecognizedSalesDto } from './dto/update-recognized-sales.dto';
import { RecognizedSalesQueryDto } from './dto/recognized-sales-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MemberGrade, RecognizedSalesStatus } from '@prisma/client';

/**
 * 인정매출 관리 컨트롤러
 * ADMIN 전용 기능
 */
@ApiTags('recognized-sales')
@Controller('v1/recognized-sales')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecognizedSalesController {
  constructor(private readonly recognizedSalesService: RecognizedSalesService) {}

  /**
   * 인정매출 등록 (ADMIN 전용)
   */
  @Post()
  @Roles(MemberGrade.ADMIN)
  @ApiOperation({ summary: '인정매출 등록 (ADMIN 전용)' })
  @ApiResponse({ status: 201, description: '인정매출이 등록되었습니다.' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '권한 없음 (ADMIN만 가능)' })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 활성 인정이 존재함' })
  create(
    @Body() dto: CreateRecognizedSalesDto,
    @CurrentUser('id') adminId: number,
  ) {
    return this.recognizedSalesService.create(dto, adminId);
  }

  /**
   * 인정매출 목록 조회 (ADMIN 전용)
   */
  @Get()
  @Roles(MemberGrade.ADMIN)
  @ApiOperation({ summary: '인정매출 목록 조회 (ADMIN 전용)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'memberId', required: false, type: Number })
  @ApiQuery({ name: 'recognizedGrade', required: false, enum: MemberGrade })
  @ApiQuery({ name: 'status', required: false, enum: RecognizedSalesStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: '인정매출 목록 조회 성공' })
  findAll(@Query() query: RecognizedSalesQueryDto) {
    return this.recognizedSalesService.findAll(query);
  }

  /**
   * 인정매출 상세 조회 (ADMIN 전용)
   */
  @Get(':id')
  @Roles(MemberGrade.ADMIN)
  @ApiOperation({ summary: '인정매출 상세 조회 (ADMIN 전용)' })
  @ApiResponse({ status: 200, description: '인정매출 조회 성공' })
  @ApiResponse({ status: 404, description: '인정매출을 찾을 수 없음' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recognizedSalesService.findOne(id);
  }

  /**
   * 인정매출 수정 (ADMIN 전용)
   */
  @Patch(':id')
  @Roles(MemberGrade.ADMIN)
  @ApiOperation({ summary: '인정매출 수정 (ADMIN 전용)' })
  @ApiResponse({ status: 200, description: '인정매출이 수정되었습니다.' })
  @ApiResponse({ status: 400, description: '잘못된 요청 또는 비활성 상태' })
  @ApiResponse({ status: 404, description: '인정매출을 찾을 수 없음' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRecognizedSalesDto,
  ) {
    return this.recognizedSalesService.update(id, dto);
  }

  /**
   * 인정매출 취소 (ADMIN 전용)
   */
  @Post(':id/cancel')
  @Roles(MemberGrade.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '인정매출 취소 (ADMIN 전용)' })
  @ApiResponse({ status: 200, description: '인정매출이 취소되었습니다.' })
  @ApiResponse({ status: 400, description: '잘못된 요청 또는 비활성 상태' })
  @ApiResponse({ status: 404, description: '인정매출을 찾을 수 없음' })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') adminId: number,
  ) {
    return this.recognizedSalesService.cancel(id, adminId);
  }

  /**
   * 회원 인정 상태 확인 (ADMIN 전용)
   */
  @Get('check/:memberId')
  @Roles(MemberGrade.ADMIN)
  @ApiOperation({ summary: '회원 인정 상태 확인 (ADMIN 전용)' })
  @ApiResponse({ status: 200, description: '회원 인정 상태 조회 성공' })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  checkMemberStatus(@Param('memberId', ParseIntPipe) memberId: number) {
    return this.recognizedSalesService.checkMemberRecognitionStatus(memberId);
  }
}
