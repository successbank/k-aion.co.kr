import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductCommissionRatesService } from './product-commission-rates.service';
import {
  UpdateProductCommissionRatesDto,
  UpdateSingleCommissionRateDto,
  ProductCommissionRateResponseDto,
} from './dto/update-product-commission-rate.dto';

/**
 * 제품별 수당률 관리 컨트롤러 (관리자 전용)
 * 보너스 계산에 직접 사용되는 ProductCommissionRate 관리
 */
@ApiTags('product-commission-rates')
@Controller('v1/admin/product-commission-rates')
@ApiBearerAuth()
export class ProductCommissionRatesController {
  constructor(
    private readonly productCommissionRatesService: ProductCommissionRatesService,
  ) {}

  /**
   * 모든 제품의 수당률 조회 (제품별 그룹핑)
   */
  @Get()
  @ApiOperation({ summary: '전체 제품 수당률 조회' })
  @ApiResponse({
    status: 200,
    description: '제품별 수당률 목록',
    type: [ProductCommissionRateResponseDto],
  })
  async findAll(): Promise<{
    success: boolean;
    data: ProductCommissionRateResponseDto[];
  }> {
    const data = await this.productCommissionRatesService.findAllGroupedByProduct();
    return { success: true, data };
  }

  /**
   * 특정 제품의 등급별 수당률 조회
   */
  @Get(':productId')
  @ApiOperation({ summary: '특정 제품 수당률 조회' })
  @ApiResponse({
    status: 200,
    description: '제품 수당률 상세',
    type: ProductCommissionRateResponseDto,
  })
  @ApiResponse({ status: 404, description: '제품을 찾을 수 없음' })
  async findByProduct(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<{ success: boolean; data: ProductCommissionRateResponseDto }> {
    const data = await this.productCommissionRatesService.findByProduct(productId);
    return { success: true, data };
  }

  /**
   * 제품별 수당률 일괄 업데이트
   */
  @Put(':productId')
  @ApiOperation({ summary: '제품 수당률 일괄 업데이트' })
  @ApiResponse({
    status: 200,
    description: '수당률이 업데이트되었습니다.',
    type: ProductCommissionRateResponseDto,
  })
  @ApiResponse({ status: 404, description: '제품을 찾을 수 없음' })
  async updateByProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateProductCommissionRatesDto,
  ): Promise<{ success: boolean; data: ProductCommissionRateResponseDto }> {
    const data = await this.productCommissionRatesService.updateByProduct(
      productId,
      dto.rates,
    );
    return { success: true, data };
  }

  /**
   * 개별 수당률 수정
   */
  @Patch(':id')
  @ApiOperation({ summary: '개별 수당률 수정' })
  @ApiResponse({
    status: 200,
    description: '수당률이 수정되었습니다.',
  })
  @ApiResponse({ status: 404, description: '수당률을 찾을 수 없음' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSingleCommissionRateDto,
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.productCommissionRatesService.update(id, dto);
    return { success: true, data };
  }
}
