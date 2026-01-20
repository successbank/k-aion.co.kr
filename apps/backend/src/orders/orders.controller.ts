import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, MemberGrade } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('orders')
@Controller('v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * 주문 생성 (재구매)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '주문 생성 (재구매)' })
  @ApiResponse({ status: 201, description: '주문 생성됨' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  /**
   * 전체 주문 목록 조회 (관리자용)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '전체 주문 목록 조회 (ADMIN 전용)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiResponse({ status: 200, description: '성공' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findAll({ page, limit, status });
  }

  /**
   * 회원별 주문 목록 조회
   */
  @Get('member/:memberId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '회원별 주문 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: '성공' })
  async findByMember(
    @Param('memberId', ParseIntPipe) memberId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.ordersService.findByMember(memberId, page, limit);
  }

  /**
   * 회원 주문 통계
   */
  @Get('member/:memberId/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '회원 주문 통계' })
  @ApiResponse({ status: 200, description: '성공' })
  async getMemberStats(@Param('memberId', ParseIntPipe) memberId: number) {
    return this.ordersService.getMemberOrderStats(memberId);
  }

  /**
   * 주문 상세 조회
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '주문 상세 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: '주문을 찾을 수 없음' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  /**
   * 주문 상태 변경
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '주문 상태 변경 (ADMIN 전용)' })
  @ApiResponse({ status: 200, description: '상태 변경됨' })
  @ApiResponse({ status: 404, description: '주문을 찾을 수 없음' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateDto);
  }
}
