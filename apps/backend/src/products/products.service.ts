import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { sanitizeHtml } from '../common/utils/sanitize-html.util';

/**
 * 제품 관리 서비스
 */
@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 제품 생성 (관리자 전용)
   */
  async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    const { code, categoryId, stock, description, ...rest } = createProductDto;

    // 제품 코드 중복 확인
    const existing = await this.prisma.product.findUnique({
      where: { code },
    });

    if (existing) {
      throw new BadRequestException(`제품 코드 '${code}'가 이미 존재합니다.`);
    }

    // 카테고리 존재 확인
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`카테고리 ID ${categoryId}를 찾을 수 없습니다.`);
    }

    // HTML 설명 sanitize (XSS 방지)
    const sanitizedDescription = sanitizeHtml(description);

    const product = await this.prisma.product.create({
      data: {
        code,
        categoryId,
        stock: stock ?? 0,
        description: sanitizedDescription,
        ...rest,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    this.logger.log(`제품 생성: ${product.name} (ID: ${product.id})`);

    return product;
  }

  /**
   * 제품 목록 조회 (페이징 지원)
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: number;
    isActive?: boolean;
  }): Promise<{
    data: ProductResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 20, search, categoryId, isActive } = params;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 제품 상세 조회
   */
  async findOne(id: number): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`제품 ID ${id}를 찾을 수 없습니다.`);
    }

    return product;
  }

  /**
   * 제품 수정 (관리자 전용)
   */
  async update(id: number, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    // 제품 존재 확인
    await this.findOne(id);

    // 제품 코드 중복 확인 (코드 변경 시)
    if (updateProductDto.code) {
      const existing = await this.prisma.product.findUnique({
        where: { code: updateProductDto.code },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException(`제품 코드 '${updateProductDto.code}'가 이미 존재합니다.`);
      }
    }

    // 카테고리 존재 확인 (카테고리 변경 시)
    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `카테고리 ID ${updateProductDto.categoryId}를 찾을 수 없습니다.`,
        );
      }
    }

    // HTML 설명 sanitize (XSS 방지)
    const sanitizedData = {
      ...updateProductDto,
      description:
        updateProductDto.description !== undefined
          ? sanitizeHtml(updateProductDto.description)
          : undefined,
    };

    const updated = await this.prisma.product.update({
      where: { id },
      data: sanitizedData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    this.logger.log(`제품 수정: ${updated.name} (ID: ${id})`);

    return updated;
  }

  /**
   * 제품 삭제 (소프트 삭제는 isActive=false 처리)
   */
  async remove(id: number): Promise<void> {
    // 제품 존재 확인
    await this.findOne(id);

    // 판매 이력 확인
    const salesCount = await this.prisma.sale.count({
      where: { productId: id },
    });

    if (salesCount > 0) {
      // 판매 이력이 있으면 소프트 삭제
      await this.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });

      this.logger.log(`제품 비활성화 (판매 이력 있음): ID ${id}`);
    } else {
      // 판매 이력이 없으면 하드 삭제
      await this.prisma.product.delete({
        where: { id },
      });

      this.logger.log(`제품 삭제: ID ${id}`);
    }
  }

  /**
   * 재고 조정
   */
  async adjustStock(id: number, adjustment: number): Promise<ProductResponseDto> {
    const product = await this.findOne(id);

    const newStock = product.stock + adjustment;

    if (newStock < 0) {
      throw new BadRequestException('재고가 음수가 될 수 없습니다.');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    this.logger.log(`재고 조정: ${product.name} (${product.stock} → ${newStock})`);

    return updated;
  }
}
