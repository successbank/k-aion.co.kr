import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { Public } from '../auth/decorators/public.decorator';

/**
 * 제품 관리 컨트롤러 (관리자 전용)
 */
@ApiTags('products')
@Controller('v1/products')
@ApiBearerAuth() // JWT 인증 필요 (TODO: Guard 추가)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * 제품 생성 (관리자 전용)
   */
  @Post()
  @ApiOperation({ summary: '제품 생성 (ADMIN)' })
  @ApiResponse({ status: 201, description: '제품이 생성되었습니다.', type: ProductResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  create(@Body() createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productsService.create(createProductDto);
  }

  /**
   * 제품 목록 조회 (페이징, 검색)
   */
  @Public()
  @Get()
  @ApiOperation({ summary: '제품 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String, description: '제품명 또는 코드 검색' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number, description: '카테고리 필터' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: '활성 상태 필터' })
  @ApiResponse({ status: 200, description: '제품 목록 조회 성공' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: number,
    @Query('isActive') isActive?: string,
  ) {
    return this.productsService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      categoryId: categoryId ? Number(categoryId) : undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  /**
   * 제품 상세 조회
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: '제품 상세 조회' })
  @ApiResponse({ status: 200, description: '제품 조회 성공', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: '제품을 찾을 수 없음' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductResponseDto> {
    return this.productsService.findOne(id);
  }

  /**
   * 제품 수정 (관리자 전용)
   */
  @Patch(':id')
  @ApiOperation({ summary: '제품 수정 (ADMIN)' })
  @ApiResponse({ status: 200, description: '제품이 수정되었습니다.', type: ProductResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 404, description: '제품을 찾을 수 없음' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(id, updateProductDto);
  }

  /**
   * 제품 삭제 (관리자 전용)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '제품 삭제 (ADMIN)' })
  @ApiResponse({ status: 204, description: '제품이 삭제되었습니다.' })
  @ApiResponse({ status: 404, description: '제품을 찾을 수 없음' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.productsService.remove(id);
  }

  /**
   * 재고 조정 (관리자 전용)
   */
  @Patch(':id/stock')
  @ApiOperation({ summary: '재고 조정 (ADMIN)' })
  @ApiResponse({ status: 200, description: '재고가 조정되었습니다.', type: ProductResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 요청 (재고 음수)' })
  @ApiResponse({ status: 404, description: '제품을 찾을 수 없음' })
  adjustStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('adjustment') adjustment: number,
  ): Promise<ProductResponseDto> {
    return this.productsService.adjustStock(id, adjustment);
  }
}
