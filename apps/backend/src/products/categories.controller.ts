import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Public } from '../auth/decorators/public.decorator';

/**
 * 카테고리 관리 컨트롤러 (관리자 전용)
 */
@ApiTags('categories')
@Controller('v1/categories')
@ApiBearerAuth() // JWT 인증 필요 (TODO: Guard 추가)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * 카테고리 생성 (관리자 전용)
   */
  @Post()
  @ApiOperation({ summary: '카테고리 생성 (ADMIN)' })
  @ApiResponse({ status: 201, description: '카테고리가 생성되었습니다.' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  /**
   * 카테고리 목록 조회 (계층 구조)
   */
  @Public()
  @Get()
  @ApiOperation({ summary: '카테고리 목록 조회 (계층 구조)' })
  @ApiResponse({ status: 200, description: '카테고리 목록 조회 성공' })
  findAll() {
    return this.categoriesService.findAll();
  }

  /**
   * 카테고리 상세 조회
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: '카테고리 상세 조회' })
  @ApiResponse({ status: 200, description: '카테고리 조회 성공' })
  @ApiResponse({ status: 404, description: '카테고리를 찾을 수 없음' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  /**
   * 카테고리 수정 (관리자 전용)
   */
  @Patch(':id')
  @ApiOperation({ summary: '카테고리 수정 (ADMIN)' })
  @ApiResponse({ status: 200, description: '카테고리가 수정되었습니다.' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 404, description: '카테고리를 찾을 수 없음' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  /**
   * 카테고리 삭제 (관리자 전용)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '카테고리 삭제 (ADMIN)' })
  @ApiResponse({ status: 204, description: '카테고리가 삭제되었습니다.' })
  @ApiResponse({ status: 400, description: '하위 카테고리 또는 제품이 존재함' })
  @ApiResponse({ status: 404, description: '카테고리를 찾을 수 없음' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
