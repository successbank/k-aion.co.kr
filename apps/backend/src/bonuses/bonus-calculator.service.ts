import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CommissionRatesService,
  CommissionRateWithRelations,
} from '../commission-rates/commission-rates.service';
import { BonusType, BonusStatus, Member } from '@prisma/client';

/**
 * 보너스 계산 엔진
 * Commission PRD v2.0 기준
 * DB 기반 동적 설정 지원 (Phase 3)
 */
@Injectable()
export class BonusCalculatorService {
  private readonly logger = new Logger(BonusCalculatorService.name);

  // 보너스 금액 상수 (Fallback용 - Phase 7에서 제거 예정)
  private readonly BONUS_AMOUNTS = {
    SALES: 500000, // 판매 보너스
    SALES_MANAGEMENT: 150000, // 판매 관리 보너스
    LICENSE: {
      MANAGER: 100000, // 매니저 판권 보너스
      BRANCH_CHIEF: 180000, // 지부장 판권 보너스
      DIVISION_CHIEF: 240000, // 본부장 판권 보너스
      CENTER: 280000, // 센터 판권 보너스
    },
    LICENSE_MANAGEMENT: {
      MIN_RATE: 0.3, // 최소 30%
      MAX_RATE: 0.5, // 최대 50%
    },
    SHARING: 20000, // 공유 보너스
    BRANCH_OPERATION: 50000, // 지점 운영 보너스
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly commissionRatesService: CommissionRatesService,
  ) {}

  /**
   * DB 설정 기반 보너스 금액 계산
   * @param config 보너스 설정
   * @param member 회원 정보 (등급별 차등 시 필요)
   * @param context 계산 컨텍스트 (pv, sale 등)
   * @returns 계산된 보너스 금액
   */
  private async calculateAmount(
    config: CommissionRateWithRelations,
    member: Member | null,
    context: { pv?: number; sale?: any },
  ): Promise<number> {
    // 1. 고정 금액 (등급별 아님)
    if (config.baseAmount && !config.isGradeTiered) {
      return config.baseAmount;
    }

    // 2. 퍼센트 기반
    if (config.basePercentage) {
      const pv = context.pv || config.basePv;
      return Math.floor((Number(config.basePercentage) / 100) * pv);
    }

    // 3. 등급별 차등
    if (config.isGradeTiered && member) {
      const tier = config.tiers?.find((t) => t.applicableGrade === member.grade);
      if (!tier) {
        this.logger.warn(`No tier found for grade ${member.grade} in config ${config.id}`);
        throw new Error(`등급 ${member.grade}에 대한 보너스 설정을 찾을 수 없습니다`);
      }
      return tier.amount;
    }

    throw new Error('보너스 금액 계산 실패 - 잘못된 설정');
  }

  /**
   * Fallback을 포함한 보너스 금액 조회
   * @param bonusType 보너스 유형
   * @param member 회원 정보
   * @returns 계산된 보너스 금액
   */
  private async getAmountWithFallback(bonusType: BonusType, member?: Member): Promise<number> {
    try {
      const config = await this.commissionRatesService.findActiveByBonusType(bonusType);

      if (!config) {
        this.logger.warn(`${bonusType} 설정이 DB에 없습니다. Fallback 사용`);
        return this.getFallbackAmount(bonusType, member?.grade);
      }

      return await this.calculateAmount(config, member || null, {});
    } catch (error) {
      this.logger.error(`${bonusType} 계산 오류: ${error.message}. Fallback 사용`);
      return this.getFallbackAmount(bonusType, member?.grade);
    }
  }

  /**
   * Fallback 금액 반환
   * @param bonusType 보너스 유형
   * @param grade 회원 등급
   * @returns Fallback 금액
   */
  private getFallbackAmount(bonusType: BonusType, grade?: string): number {
    switch (bonusType) {
      case BonusType.SALES:
        return this.BONUS_AMOUNTS.SALES;
      case BonusType.SALES_MANAGEMENT:
        return this.BONUS_AMOUNTS.SALES_MANAGEMENT;
      case BonusType.LICENSE:
        if (grade === 'MANAGER') return this.BONUS_AMOUNTS.LICENSE.MANAGER;
        if (grade === 'BRANCH_CHIEF') return this.BONUS_AMOUNTS.LICENSE.BRANCH_CHIEF;
        if (grade === 'DIVISION_CHIEF') return this.BONUS_AMOUNTS.LICENSE.DIVISION_CHIEF;
        return this.BONUS_AMOUNTS.LICENSE.MANAGER;
      case BonusType.SHARING:
        return this.BONUS_AMOUNTS.SHARING;
      case BonusType.BRANCH_OPERATION:
        return this.BONUS_AMOUNTS.BRANCH_OPERATION;
      default:
        return 0;
    }
  }

  /**
   * 판매 발생 시 보너스 계산 및 생성
   * @param saleId 판매 ID
   */
  async calculateBonusesOnSale(saleId: number): Promise<void> {
    // 판매 정보 조회
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        seller: {
          include: {
            recommender: true, // 직접 추천인
          },
        },
      },
    });

    if (!sale) {
      throw new Error(`판매 ID ${saleId}를 찾을 수 없습니다.`);
    }

    // 트랜잭션으로 모든 보너스 생성
    await this.prisma.$transaction(async (tx) => {
      // 1. 판매 보너스 (SALES) - DB 기반 계산
      const salesAmount = await this.getAmountWithFallback(BonusType.SALES, sale.seller);

      await tx.bonus.create({
        data: {
          memberId: sale.sellerId,
          saleId: sale.id,
          bonusType: BonusType.SALES,
          amount: salesAmount,
          description: `판매 보너스 (판매코드: ${sale.saleCode})`,
          weekCode: sale.weekCode,
          status: BonusStatus.PENDING,
        },
      });

      this.logger.log(
        `SALES 보너스 생성: ${salesAmount}원 | 회원 ID: ${sale.sellerId} | 판매: ${sale.saleCode}`,
      );

      // 2. 판매 관리 보너스 (SALES_MANAGEMENT) - DB 기반 계산
      if (sale.seller.recommender) {
        const salesMgmtAmount = await this.getAmountWithFallback(
          BonusType.SALES_MANAGEMENT,
          sale.seller.recommender,
        );

        await tx.bonus.create({
          data: {
            memberId: sale.seller.recommender.id,
            saleId: sale.id,
            bonusType: BonusType.SALES_MANAGEMENT,
            amount: salesMgmtAmount,
            description: `판매 관리 보너스 (하위 ${sale.seller.name}의 판매)`,
            weekCode: sale.weekCode,
            status: BonusStatus.PENDING,
          },
        });

        this.logger.log(
          `SALES_MANAGEMENT 보너스 생성: ${salesMgmtAmount}원 | ` +
            `회원 ID: ${sale.seller.recommender.id} | 판매: ${sale.saleCode}`,
        );
      }

      // 3. 공유 보너스 (SHARING) - DB 기반 계산
      const uplineLeaders = await this.findUplineLeaders(tx, sale.sellerId);
      const sharingAmount = await this.getAmountWithFallback(BonusType.SHARING);

      for (const leader of uplineLeaders) {
        await tx.bonus.create({
          data: {
            memberId: leader.id,
            saleId: sale.id,
            bonusType: BonusType.SHARING,
            amount: sharingAmount,
            description: `공유 보너스 (하위 ${sale.seller.name}의 판매)`,
            weekCode: sale.weekCode,
            status: BonusStatus.PENDING,
          },
        });

        this.logger.log(
          `SHARING 보너스 생성: ${sharingAmount}원 | ` +
            `회원 ID: ${leader.id} (${leader.grade}) | 판매: ${sale.saleCode}`,
        );
      }
    });
  }

  /**
   * 추천계보 상위의 모든 지부장/본부장 탐색
   * @param tx Prisma 트랜잭션
   * @param memberId 시작 회원 ID
   * @returns 지부장/본부장 목록
   */
  private async findUplineLeaders(
    tx: any,
    memberId: number,
  ): Promise<Array<{ id: number; grade: string }>> {
    const leaders: Array<{ id: number; grade: string }> = [];
    let currentId: number | null = memberId;
    let depth = 0;
    const MAX_DEPTH = 20; // 무한 루프 방지

    while (currentId && depth < MAX_DEPTH) {
      const member = await tx.member.findUnique({
        where: { id: currentId },
        select: {
          id: true,
          grade: true,
          recommenderId: true,
        },
      });

      if (!member || !member.recommenderId) {
        break;
      }

      // 상위로 이동
      currentId = member.recommenderId;

      // 상위 회원 조회
      const upline = await tx.member.findUnique({
        where: { id: currentId },
        select: {
          id: true,
          grade: true,
          recommenderId: true,
        },
      });

      if (!upline) {
        break;
      }

      // BRANCH_CHIEF 또는 DIVISION_CHIEF면 추가
      if (upline.grade === 'BRANCH_CHIEF' || upline.grade === 'DIVISION_CHIEF') {
        leaders.push({
          id: upline.id,
          grade: upline.grade,
        });
      }

      currentId = upline.recommenderId;
      depth++;
    }

    return leaders;
  }

  /**
   * 보너스 총액 계산 (미리보기용)
   * @param sellerId 판매자 ID
   * @param saleAmount 판매 금액
   */
  async previewBonuses(
    sellerId: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _saleAmount: number,
  ): Promise<{
    totalBonus: number;
    bonuses: Array<{
      type: BonusType;
      recipient: string;
      amount: number;
      description: string;
    }>;
  }> {
    const seller = await this.prisma.member.findUnique({
      where: { id: sellerId },
      include: {
        recommender: true,
      },
    });

    if (!seller) {
      throw new Error(`판매자 ID ${sellerId}를 찾을 수 없습니다.`);
    }

    const bonuses: Array<{
      type: BonusType;
      recipient: string;
      amount: number;
      description: string;
    }> = [];
    let totalBonus = 0;

    // 1. 판매 보너스 (본인) - DB 기반 계산
    const salesAmount = await this.getAmountWithFallback(BonusType.SALES, seller);
    bonuses.push({
      type: BonusType.SALES,
      recipient: `${seller.name} (본인)`,
      amount: salesAmount,
      description: '판매 보너스',
    });
    totalBonus += salesAmount;

    // 2. 판매 관리 보너스 (직접 추천인) - DB 기반 계산
    if (seller.recommender) {
      const salesMgmtAmount = await this.getAmountWithFallback(
        BonusType.SALES_MANAGEMENT,
        seller.recommender,
      );
      bonuses.push({
        type: BonusType.SALES_MANAGEMENT,
        recipient: `${seller.recommender.name} (추천인)`,
        amount: salesMgmtAmount,
        description: '판매 관리 보너스',
      });
      totalBonus += salesMgmtAmount;
    }

    return {
      totalBonus,
      bonuses,
    };
  }
}
