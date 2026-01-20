import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemberGrade } from '@prisma/client';
import {
  GradeRateDto,
  ProductCommissionRateResponseDto,
} from './dto/update-product-commission-rate.dto';

/**
 * 제품별 수당률 관리 서비스
 * 보너스 계산에 직접 사용되는 ProductCommissionRate 테이블 관리
 */
@Injectable()
export class ProductCommissionRatesService {
  private readonly logger = new Logger(ProductCommissionRatesService.name);

  // 수당률 적용 대상 등급 (ADMIN 제외)
  private readonly applicableGrades: MemberGrade[] = [
    'SALESPERSON',
    'TEAM_LEADER',
    'BRANCH_MANAGER',
    'CENTER',
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 모든 제품의 수당률 조회 (제품별 그룹핑)
   */
  async findAllGroupedByProduct(): Promise<ProductCommissionRateResponseDto[]> {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: {
        commissionRates: {
          where: { isActive: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((product) => ({
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      price: product.price,
      rates: this.buildRatesMap(product.commissionRates),
    }));
  }

  /**
   * 특정 제품의 등급별 수당률 조회
   */
  async findByProduct(productId: number): Promise<ProductCommissionRateResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        commissionRates: {
          where: { isActive: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`제품 ID ${productId}를 찾을 수 없습니다.`);
    }

    return {
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      price: product.price,
      rates: this.buildRatesMap(product.commissionRates),
    };
  }

  /**
   * 제품별 수당률 일괄 업데이트 (upsert)
   */
  async updateByProduct(
    productId: number,
    rates: GradeRateDto[],
  ): Promise<ProductCommissionRateResponseDto> {
    // 제품 존재 확인
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`제품 ID ${productId}를 찾을 수 없습니다.`);
    }

    // 트랜잭션으로 일괄 upsert
    await this.prisma.$transaction(async (tx) => {
      for (const rate of rates) {
        await tx.productCommissionRate.upsert({
          where: {
            productId_recipientGrade: {
              productId,
              recipientGrade: rate.grade,
            },
          },
          update: {
            amount: rate.amount,
            isActive: true,
          },
          create: {
            productId,
            recipientGrade: rate.grade,
            amount: rate.amount,
            isActive: true,
          },
        });
      }
    });

    this.logger.log(
      `제품 수당률 업데이트: ${product.name} (ID: ${productId}), ${rates.length}개 등급`,
    );

    return this.findByProduct(productId);
  }

  /**
   * 개별 수당률 수정
   */
  async update(
    id: number,
    data: { amount?: number; isActive?: boolean },
  ): Promise<any> {
    const rate = await this.prisma.productCommissionRate.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!rate) {
      throw new NotFoundException(`수당률 ID ${id}를 찾을 수 없습니다.`);
    }

    const updated = await this.prisma.productCommissionRate.update({
      where: { id },
      data,
      include: { product: true },
    });

    this.logger.log(
      `수당률 수정: ${rate.product.name} - ${rate.recipientGrade} (ID: ${id})`,
    );

    return updated;
  }

  /**
   * 수당률 배열을 등급별 맵으로 변환
   */
  private buildRatesMap(
    commissionRates: Array<{ recipientGrade: MemberGrade; amount: number }>,
  ): Record<MemberGrade, number | null> {
    const ratesMap: Record<MemberGrade, number | null> = {
      SALESPERSON: null,
      TEAM_LEADER: null,
      BRANCH_MANAGER: null,
      CENTER: null,
      ADMIN: null,
    };

    for (const rate of commissionRates) {
      ratesMap[rate.recipientGrade] = rate.amount;
    }

    return ratesMap;
  }
}
