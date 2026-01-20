import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenealogyService } from '../../members/genealogy.service';
import { Bonus, BonusType, MemberGrade } from '@prisma/client';

// 등급 계층 순서 (낮은 인덱스 = 높은 등급)
const GRADE_ORDER: MemberGrade[] = [
  MemberGrade.ADMIN,
  MemberGrade.CENTER,
  MemberGrade.BRANCH_MANAGER,
  MemberGrade.TEAM_LEADER,
  MemberGrade.SALESPERSON,
];

/**
 * 보상플랜 보너스 계산 서비스 (신규 수당 체계)
 *
 * 2가지 보너스 유형:
 * 1. SALES_COMMISSION - 판매 수수료 (판매원, 팀장)
 * 2. EDUCATION_MANAGEMENT - 교육 관리 (지사장, 센터)
 *
 * 제품별 고정 수당율 (ProductCommissionRate 테이블 참조):
 * - 온체: 판매원 50만 / 팀장 100만 / 지사장 20만 / 센터 5만
 * - 펄스온: 판매원 40만 / 팀장 80만 / 지사장 15만 / 센터 5만
 * - 제트5: 판매원 25만 / 팀장 50만 / 지사장 5만 / 센터 5만
 * - 통증 패치: 팀장 2만 / 지사장 4,800 / 센터 2,400
 * - 전용젤: 팀장 1.5만 / 지사장 3,000 / 센터 1,500
 */
@Injectable()
export class BonusCalculatorService {
  private readonly logger = new Logger(BonusCalculatorService.name);

  constructor(
    private prisma: PrismaService,
    private genealogyService: GenealogyService,
  ) {}

  /**
   * 등급이 특정 기준 이상인지 확인
   */
  private isGradeAtLeast(grade: MemberGrade, minGrade: MemberGrade): boolean {
    const gradeIndex = GRADE_ORDER.indexOf(grade);
    const minGradeIndex = GRADE_ORDER.indexOf(minGrade);
    return gradeIndex <= minGradeIndex;
  }

  /**
   * 제품별 등급별 수당 금액 조회
   */
  private async getCommissionAmount(productId: number, grade: MemberGrade): Promise<number> {
    const rate = await this.prisma.productCommissionRate.findUnique({
      where: {
        productId_recipientGrade: {
          productId,
          recipientGrade: grade,
        },
      },
    });
    return rate?.amount || 0;
  }

  /**
   * 판매 발생 시 모든 관련 보너스 자동 계산
   * 신규 수당 체계: 제품별 고정 금액
   *
   * @param saleId 판매 ID
   * @returns 생성된 모든 보너스 레코드
   */
  async processSaleBonuses(saleId: number): Promise<Bonus[]> {
    const bonuses: Bonus[] = [];

    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        seller: true,
        product: true,
      },
    });

    if (!sale) {
      this.logger.warn(`판매 ID ${saleId}를 찾을 수 없습니다.`);
      return [];
    }

    // 인정매출은 보너스 계산에서 제외
    if (sale.isRecognizedSale) {
      this.logger.log(`인정매출(ID: ${saleId}, ${sale.saleCode})은 보너스 계산에서 제외됩니다.`);
      return [];
    }

    const weekCode = this.getWeekCode(sale.soldAt);
    const productId = sale.productId;

    // ============================================================
    // 1. 판매원 수수료 (SALES_COMMISSION) - 본인
    // ============================================================
    if (sale.seller.grade !== MemberGrade.ADMIN) {
      const sellerAmount = await this.getCommissionAmount(productId, sale.seller.grade);

      if (sellerAmount > 0) {
        const bonusType = this.getBonusTypeForGrade(sale.seller.grade);
        const sellerBonus = await this.prisma.bonus.create({
          data: {
            memberId: sale.sellerId,
            saleId: sale.id,
            bonusType,
            amount: sellerAmount,
            description: `${this.getBonusTypeKorean(bonusType)} - ${sale.product.name} 판매`,
            weekCode,
            status: 'PENDING',
            calculationBasis: JSON.stringify({
              productId,
              productCode: sale.product.code,
              sellerGrade: sale.seller.grade,
            }),
          },
        });
        bonuses.push(sellerBonus);
        this.logger.log(
          `${this.getGradeKorean(sale.seller.grade)} 수수료: ${sale.seller.name}님 ← ${sellerAmount.toLocaleString()}원`,
        );
      }
    }

    // ============================================================
    // 2. 상위 라인 수수료 - 후원계보 기준 (추천계보에서 전환됨)
    // ============================================================
    const upline = await this.genealogyService.getUpline(sale.sellerId, 100, 'sponsor');

    for (const ancestor of upline) {
      // ADMIN은 수수료 대상 제외
      if (ancestor.grade === MemberGrade.ADMIN) continue;

      // 판매원 등급은 자신의 직접 판매만 수수료 대상
      if (ancestor.grade === MemberGrade.SALESPERSON) continue;

      const amount = await this.getCommissionAmount(productId, ancestor.grade);

      if (amount > 0) {
        const bonusType = this.getBonusTypeForGrade(ancestor.grade);
        const ancestorBonus = await this.prisma.bonus.create({
          data: {
            memberId: ancestor.id,
            saleId: sale.id,
            bonusType,
            amount,
            description: `${this.getBonusTypeKorean(bonusType)} - ${sale.seller.name}님 ${sale.product.name} 판매`,
            weekCode,
            status: 'PENDING',
            calculationBasis: JSON.stringify({
              productId,
              productCode: sale.product.code,
              sellerId: sale.sellerId,
              sellerName: sale.seller.name,
              recipientGrade: ancestor.grade,
              level: ancestor.level,
            }),
          },
        });
        bonuses.push(ancestorBonus);
        this.logger.log(
          `${this.getGradeKorean(ancestor.grade)} 수수료: ${ancestor.name}님 ← ${amount.toLocaleString()}원 (Level ${ancestor.level})`,
        );
      }
    }

    return bonuses;
  }

  /**
   * 판매 보너스 계산 (트랜잭션 컨텍스트 전용)
   */
  async processSaleBonusesInTx(
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
    saleId: number,
  ): Promise<Bonus[]> {
    const bonuses: Bonus[] = [];

    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      include: {
        seller: true,
        product: true,
      },
    });

    if (!sale) {
      throw new Error(`Sale with ID ${saleId} not found`);
    }

    if (sale.isRecognizedSale) {
      return [];
    }

    const weekCode = this.getWeekCode(sale.soldAt);
    const productId = sale.productId;

    // 본인 수수료
    if (sale.seller.grade !== MemberGrade.ADMIN) {
      const rate = await tx.productCommissionRate.findUnique({
        where: {
          productId_recipientGrade: {
            productId,
            recipientGrade: sale.seller.grade,
          },
        },
      });

      if (rate && rate.amount > 0) {
        const bonusType = this.getBonusTypeForGrade(sale.seller.grade);
        const sellerBonus = await tx.bonus.create({
          data: {
            memberId: sale.sellerId,
            saleId: sale.id,
            bonusType,
            amount: rate.amount,
            description: `${this.getBonusTypeKorean(bonusType)} - ${sale.product.name} 판매`,
            weekCode,
            status: 'PENDING',
          },
        });
        bonuses.push(sellerBonus);
      }
    }

    // 상위 라인 수수료 (후원계보 - 추천계보에서 전환됨)
    const upline = await this.genealogyService.getUpline(sale.sellerId, 100, 'sponsor');

    for (const ancestor of upline) {
      if (ancestor.grade === MemberGrade.ADMIN) continue;
      if (ancestor.grade === MemberGrade.SALESPERSON) continue;

      const rate = await tx.productCommissionRate.findUnique({
        where: {
          productId_recipientGrade: {
            productId,
            recipientGrade: ancestor.grade,
          },
        },
      });

      if (rate && rate.amount > 0) {
        const bonusType = this.getBonusTypeForGrade(ancestor.grade);
        const ancestorBonus = await tx.bonus.create({
          data: {
            memberId: ancestor.id,
            saleId: sale.id,
            bonusType,
            amount: rate.amount,
            description: `${this.getBonusTypeKorean(bonusType)} - ${sale.seller.name}님 ${sale.product.name} 판매`,
            weekCode,
            status: 'PENDING',
          },
        });
        bonuses.push(ancestorBonus);
      }
    }

    return bonuses;
  }

  /**
   * 판매 보너스 미리보기 (실제 생성 없이 계산만)
   */
  async previewSaleBonuses(sellerId: number, productId: number, quantity: number): Promise<{
    totalPrice: number;
    totalPv: number;
    bonuses: Array<{
      type: string;
      typeKorean: string;
      recipientId: number;
      recipientName: string;
      recipientGrade: string;
      recipientGradeKorean: string;
      amount: number;
      description: string;
    }>;
    totalBonus: number;
  }> {
    const seller = await this.prisma.member.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      throw new Error(`판매자 ID ${sellerId}를 찾을 수 없습니다.`);
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`제품 ID ${productId}를 찾을 수 없습니다.`);
    }

    const totalPrice = product.price * quantity;
    const totalPv = product.pv * quantity;
    const bonuses: Array<{
      type: string;
      typeKorean: string;
      recipientId: number;
      recipientName: string;
      recipientGrade: string;
      recipientGradeKorean: string;
      amount: number;
      description: string;
    }> = [];

    // 1. 판매원 본인 수수료
    if (seller.grade !== MemberGrade.ADMIN) {
      const sellerAmount = await this.getCommissionAmount(productId, seller.grade);
      if (sellerAmount > 0) {
        const bonusType = this.getBonusTypeForGrade(seller.grade);
        bonuses.push({
          type: bonusType,
          typeKorean: this.getBonusTypeKorean(bonusType),
          recipientId: seller.id,
          recipientName: seller.name,
          recipientGrade: seller.grade,
          recipientGradeKorean: this.getGradeKorean(seller.grade),
          amount: sellerAmount * quantity,
          description: `직접 판매 수수료 (${this.getGradeKorean(seller.grade)})`,
        });
      }
    }

    // 2. 상위 라인 수수료 (후원계보 기준)
    const upline = await this.genealogyService.getUpline(sellerId, 100, 'sponsor');

    for (const ancestor of upline) {
      if (ancestor.grade === MemberGrade.ADMIN) continue;
      if (ancestor.grade === MemberGrade.SALESPERSON) continue;

      const amount = await this.getCommissionAmount(productId, ancestor.grade);
      if (amount > 0) {
        const bonusType = this.getBonusTypeForGrade(ancestor.grade);
        bonuses.push({
          type: bonusType,
          typeKorean: this.getBonusTypeKorean(bonusType),
          recipientId: ancestor.id,
          recipientName: ancestor.name,
          recipientGrade: ancestor.grade,
          recipientGradeKorean: this.getGradeKorean(ancestor.grade),
          amount: amount * quantity,
          description: `하위 회원(${seller.name}) 판매 수수료`,
        });
      }
    }

    const totalBonus = bonuses.reduce((sum, b) => sum + b.amount, 0);

    return {
      totalPrice,
      totalPv,
      bonuses,
      totalBonus,
    };
  }

  /**
   * 등급에 따른 보너스 유형 결정
   */
  private getBonusTypeForGrade(grade: MemberGrade): BonusType {
    // 판매원, 팀장 → SALES_COMMISSION
    // 지사장, 센터 → EDUCATION_MANAGEMENT
    if (grade === MemberGrade.SALESPERSON || grade === MemberGrade.TEAM_LEADER) {
      return BonusType.SALES_COMMISSION;
    }
    return BonusType.EDUCATION_MANAGEMENT;
  }

  /**
   * 날짜를 주차 코드로 변환 (예: "2026-W03")
   */
  private getWeekCode(date: Date): string {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  /**
   * 등급을 한글로 변환
   */
  private getGradeKorean(grade: MemberGrade): string {
    const gradeNames: Record<MemberGrade, string> = {
      [MemberGrade.SALESPERSON]: '판매원',
      [MemberGrade.TEAM_LEADER]: '팀장',
      [MemberGrade.BRANCH_MANAGER]: '지사장',
      [MemberGrade.CENTER]: '센터',
      [MemberGrade.ADMIN]: '관리자',
    };
    return gradeNames[grade] || grade;
  }

  /**
   * 보너스 유형을 한글로 변환
   */
  private getBonusTypeKorean(type: BonusType): string {
    const typeNames: Record<BonusType, string> = {
      [BonusType.SALES_COMMISSION]: '판매 수수료',
      [BonusType.EDUCATION_MANAGEMENT]: '교육 관리 수수료',
    };
    return typeNames[type] || type;
  }
}
