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
  ForbiddenException,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateRecognizedSaleDto } from './dto/create-recognized-sale.dto';
import { UpdateSaleStatusDto } from './dto/update-sale-status.dto';
import { SaleResponseDto } from './dto/sale-response.dto';
import { SaleStatus, MemberGrade } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

// 관리자급 등급 (전체 판매 조회 권한, 신규 등급 체계)
const ADMIN_GRADES: MemberGrade[] = [
  MemberGrade.ADMIN,
  MemberGrade.CENTER,
  MemberGrade.BRANCH_MANAGER,
];

/**
 * 판매 관리 컨트롤러
 */
@ApiTags('sales')
@Controller('v1/sales')
@ApiBearerAuth() // JWT 인증 필요 (TODO: Guard 추가)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /**
   * 판매 등록 (AGENT 이상)
   * TODO: @CurrentUser() 데코레이터로 sellerId 자동 추출
   */
  @Post()
  @ApiOperation({ summary: '판매 등록 (AGENT 이상)' })
  @ApiResponse({ status: 201, description: '판매가 등록되었습니다.', type: SaleResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '권한 없음 (AGENT 이상 필요)' })
  @ApiResponse({ status: 404, description: '제품을 찾을 수 없음' })
  create(
    @Query('sellerId', ParseIntPipe) sellerId: number, // TODO: @CurrentUser()로 대체
    @Body() createSaleDto: CreateSaleDto,
  ): Promise<SaleResponseDto> {
    return this.salesService.create(sellerId, createSaleDto);
  }

  /**
   * 판매 목록 조회 (페이징, 필터)
   * - 관리자급(ADMIN, CENTER, DIVISION_CHIEF, BRANCH_CHIEF): 전체 조회 가능
   * - 일반 회원(MANAGER, AGENT, MEMBER): 본인 판매 내역만 조회 가능
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '판매 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'sellerId', required: false, type: Number, description: '판매자 ID 필터' })
  @ApiQuery({ name: 'status', required: false, enum: SaleStatus, description: '판매 상태 필터' })
  @ApiQuery({ name: 'weekCode', required: false, type: String, description: '정산 주차 필터 (예: 2025-52)' })
  @ApiResponse({ status: 200, description: '판매 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '본인의 판매 내역만 조회할 수 있습니다' })
  findAll(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sellerId') sellerId?: number,
    @Query('status') status?: SaleStatus,
    @Query('weekCode') weekCode?: string,
  ) {
    const currentUser = req.user;
    const isAdmin = currentUser && ADMIN_GRADES.includes(currentUser.grade);

    // 관리자가 아닌 경우, 본인의 판매 내역만 조회 가능
    if (!isAdmin) {
      if (sellerId && sellerId !== currentUser.id) {
        throw new ForbiddenException('본인의 판매 내역만 조회할 수 있습니다.');
      }
      // 일반 회원은 본인 ID로 강제 설정
      sellerId = currentUser.id;
    }

    return this.salesService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sellerId: sellerId ? Number(sellerId) : undefined,
      status,
      weekCode,
    });
  }

  // ========================================
  // 인정매출 API (ADMIN 전용)
  // 참고: 이 라우트들은 :id 파라미터 라우트보다 먼저 정의되어야 함
  // ========================================

  /**
   * 인정매출 목록 조회 (ADMIN 전용)
   */
  @Public()
  @Get('recognized')
  @ApiOperation({ summary: '인정매출 목록 조회 (ADMIN 전용)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'memberId', required: false, type: Number, description: '대상 회원 ID 필터' })
  @ApiQuery({ name: 'targetGrade', required: false, enum: MemberGrade, description: '지정 등급 필터' })
  @ApiResponse({ status: 200, description: '인정매출 목록 조회 성공' })
  findRecognizedSales(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('memberId') memberId?: number,
    @Query('targetGrade') targetGrade?: MemberGrade,
  ) {
    return this.salesService.findRecognizedSales({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      memberId: memberId ? Number(memberId) : undefined,
      targetGrade,
    });
  }

  /**
   * 인정매출 등록 (ADMIN 전용)
   * 회사 설립 시 구성원들의 등급 설정을 위한 가상 매출
   * 보너스 지급 발생하지 않음
   */
  @Post('recognized')
  @ApiOperation({ summary: '인정매출 등록 (ADMIN 전용)' })
  @ApiQuery({ name: 'adminId', required: true, type: Number, description: '관리자 ID' })
  @ApiResponse({ status: 201, description: '인정매출이 등록되었습니다.' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '권한 없음 (ADMIN만 가능)' })
  @ApiResponse({ status: 404, description: '회원 또는 제품을 찾을 수 없음' })
  createRecognizedSale(
    @Query('adminId', ParseIntPipe) adminId: number, // TODO: @CurrentUser()로 대체
    @Body() dto: CreateRecognizedSaleDto,
  ) {
    return this.salesService.createRecognizedSale(dto, adminId);
  }

  /**
   * 판매 보너스 미리보기 (AGENT 이상)
   * TODO: Task #48에서 실제 보너스 계산 로직 구현
   */
  @Get('preview')
  @ApiOperation({ summary: '판매 보너스 미리보기 (AGENT 이상)' })
  @ApiQuery({ name: 'sellerId', required: true, type: Number, description: '판매자 ID' })
  @ApiQuery({ name: 'productId', required: true, type: Number, description: '제품 ID' })
  @ApiQuery({ name: 'quantity', required: true, type: Number, description: '수량', example: 1 })
  @ApiResponse({ status: 200, description: '보너스 미리보기 성공' })
  @ApiResponse({ status: 404, description: '판매자 또는 제품을 찾을 수 없음' })
  previewBonus(
    @Query('sellerId', ParseIntPipe) sellerId: number, // TODO: @CurrentUser()로 대체
    @Query('productId', ParseIntPipe) productId: number,
    @Query('quantity', ParseIntPipe) quantity: number,
  ) {
    return this.salesService.previewBonus(sellerId, productId, quantity);
  }

  /**
   * 판매 상세 조회
   * - 관리자급: 모든 판매 조회 가능
   * - 일반 회원: 본인 판매만 조회 가능
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '판매 상세 조회' })
  @ApiResponse({ status: 200, description: '판매 조회 성공', type: SaleResponseDto })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '본인의 판매 내역만 조회할 수 있습니다' })
  @ApiResponse({ status: 404, description: '판매를 찾을 수 없음' })
  async findOne(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SaleResponseDto> {
    const sale = await this.salesService.findOne(id);
    const currentUser = req.user;
    const isAdmin = currentUser && ADMIN_GRADES.includes(currentUser.grade);

    // 관리자가 아닌 경우, 본인 판매인지 확인
    if (!isAdmin && sale.sellerId !== currentUser.id) {
      throw new ForbiddenException('본인의 판매 내역만 조회할 수 있습니다.');
    }

    return sale;
  }

  /**
   * 판매 상태 변경 (BRANCH_CHIEF 이상 또는 ADMIN)
   */
  @Patch(':id/status')
  @ApiOperation({ summary: '판매 상태 변경 (BRANCH_CHIEF 이상)' })
  @ApiResponse({ status: 200, description: '판매 상태가 변경되었습니다.', type: SaleResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '판매를 찾을 수 없음' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSaleStatusDto: UpdateSaleStatusDto,
    @Query('userId', ParseIntPipe) userId: number, // TODO: @CurrentUser()로 대체
  ): Promise<SaleResponseDto> {
    return this.salesService.updateStatus(id, updateSaleStatusDto, userId);
  }

  /**
   * 판매 확정 (BRANCH_CHIEF 이상 또는 ADMIN)
   */
  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '판매 확정 (BRANCH_CHIEF 이상)' })
  @ApiResponse({ status: 200, description: '판매가 확정되었습니다.', type: SaleResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '판매를 찾을 수 없음' })
  confirm(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number, // TODO: @CurrentUser()로 대체
  ): Promise<SaleResponseDto> {
    return this.salesService.confirm(id, userId);
  }

  /**
   * 판매 취소 (BRANCH_CHIEF 이상 또는 ADMIN)
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '판매 취소 (BRANCH_CHIEF 이상)' })
  @ApiResponse({ status: 200, description: '판매가 취소되었습니다.', type: SaleResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '판매를 찾을 수 없음' })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number, // TODO: @CurrentUser()로 대체
  ): Promise<SaleResponseDto> {
    return this.salesService.cancel(id, userId);
  }
}
