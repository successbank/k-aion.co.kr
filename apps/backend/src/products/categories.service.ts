import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * 카테고리 관리 서비스
 */
@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 카테고리 생성
   */
  async create(createCategoryDto: CreateCategoryDto) {
    const { name, level, parentId } = createCategoryDto;

    // 레벨 검증
    if (level === 1 && parentId) {
      throw new BadRequestException('대분류 카테고리는 상위 카테고리를 가질 수 없습니다.');
    }

    if (level === 2 && !parentId) {
      throw new BadRequestException('소분류 카테고리는 상위 카테고리가 필요합니다.');
    }

    // 상위 카테고리 검증 (소분류인 경우)
    if (parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        throw new NotFoundException(`상위 카테고리 ID ${parentId}를 찾을 수 없습니다.`);
      }

      if (parent.level !== 1) {
        throw new BadRequestException('상위 카테고리는 대분류(level=1)여야 합니다.');
      }
    }

    const category = await this.prisma.category.create({
      data: {
        name,
        level,
        parentId,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    this.logger.log(`카테고리 생성: ${category.name} (ID: ${category.id})`);

    return category;
  }

  /**
   * 카테고리 목록 조회 (계층 구조)
   */
  async findAll() {
    // 모든 카테고리 조회 (parent와 children 포함)
    const categories = await this.prisma.category.findMany({
      include: {
        parent: true,
        children: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: [
        { level: 'asc' },
        { displayOrder: 'asc' },
      ],
    });

    return categories;
  }

  /**
   * 카테고리 상세 조회
   */
  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        products: {
          select: {
            id: true,
            code: true,
            name: true,
            price: true,
            pv: true,
            isActive: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`카테고리 ID ${id}를 찾을 수 없습니다.`);
    }

    return category;
  }

  /**
   * 카테고리 수정
   */
  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    // 카테고리 존재 확인
    await this.findOne(id);

    // 레벨 변경 시 검증
    if (updateCategoryDto.level !== undefined || updateCategoryDto.parentId !== undefined) {
      const category = await this.prisma.category.findUnique({
        where: { id },
      });

      const newLevel = updateCategoryDto.level ?? category!.level;
      const newParentId = updateCategoryDto.parentId ?? category!.parentId;

      if (newLevel === 1 && newParentId) {
        throw new BadRequestException('대분류 카테고리는 상위 카테고리를 가질 수 없습니다.');
      }

      if (newLevel === 2 && !newParentId) {
        throw new BadRequestException('소분류 카테고리는 상위 카테고리가 필요합니다.');
      }

      // 상위 카테고리 검증
      if (newParentId) {
        const parent = await this.prisma.category.findUnique({
          where: { id: newParentId },
        });

        if (!parent) {
          throw new NotFoundException(`상위 카테고리 ID ${newParentId}를 찾을 수 없습니다.`);
        }

        if (parent.level !== 1) {
          throw new BadRequestException('상위 카테고리는 대분류(level=1)여야 합니다.');
        }
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: true,
        children: true,
      },
    });

    this.logger.log(`카테고리 수정: ${updated.name} (ID: ${id})`);

    return updated;
  }

  /**
   * 카테고리 삭제
   */
  async remove(id: number) {
    // 카테고리 존재 확인
    const category = await this.findOne(id);

    // 하위 카테고리 확인
    if (category.children.length > 0) {
      throw new BadRequestException(
        `하위 카테고리가 ${category.children.length}개 존재하여 삭제할 수 없습니다.`
      );
    }

    // 제품 확인
    if (category.products.length > 0) {
      throw new BadRequestException(
        `이 카테고리에 ${category.products.length}개의 제품이 등록되어 있어 삭제할 수 없습니다.`
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    this.logger.log(`카테고리 삭제: ${category.name} (ID: ${id})`);
  }
}
