import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BonusCalculatorService } from '../compensation-plan/services/bonus-calculator.service';
import { MembersService } from '../members/members.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateRecognizedSaleDto } from './dto/create-recognized-sale.dto';
import { UpdateSaleStatusDto } from './dto/update-sale-status.dto';
import { SaleResponseDto } from './dto/sale-response.dto';
import { SaleStatus, MemberGrade } from '@prisma/client';

/**
 * 판매 관리 서비스
 */
@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bonusCalculator: BonusCalculatorService,
    private readonly membersService: MembersService,
  ) {}

  /**
   * 판매 코드 생성 (SALE-YYYYMMDD-XXXX)
   */
  private async generateSaleCode(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;

    // 오늘 날짜의 마지막 판매 코드 조회
    const lastSale = await this.prisma.sale.findFirst({
      where: {
        saleCode: {
          startsWith: `SALE-${datePrefix}`,
        },
      },
      orderBy: {
        saleCode: 'desc',
      },
    });

    let sequence = 1;
    if (lastSale) {
      const lastSeq = parseInt(lastSale.saleCode.split('-')[2]);
      sequence = lastSeq + 1;
    }

    const seqStr = String(sequence).padStart(4, '0');
    return `SALE-${datePrefix}-${seqStr}`;
  }

  /**
   * 정산 주차 계산 (YYYY-WW)
   * 일요일~월요일 판매 → 화요일 정산 → 정산 주차는 화요일이 속한 주
   */
  private calculateWeekCode(saleDate: Date): string {
    const year = saleDate.getFullYear();

    // ISO Week 계산 (월요일 시작)
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor((saleDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const weekNumber = Math.ceil(dayOfYear / 7);

    return `${year}-${String(weekNumber).padStart(2, '0')}`;
  }

  /**
   * 판매 등록 (AGENT 이상)
   */
  async create(
    sellerId: number,
    createSaleDto: CreateSaleDto,
  ): Promise<SaleResponseDto> {
    const { productId, quantity } = createSaleDto;

    // 판매자 확인 및 등급 검증
    const seller = await this.prisma.member.findUnique({
      where: { id: sellerId },
      select: { id: true, name: true, email: true, grade: true, isActive: true },
    });

    if (!seller) {
      throw new NotFoundException(`판매자 ID ${sellerId}를 찾을 수 없습니다.`);
    }

    if (!seller.isActive) {
      throw new ForbiddenException('비활성화된 회원은 판매를 등록할 수 없습니다.');
    }

    // 판매원 이상만 판매 가능 (신규 등급 체계)
    const allowedGrades: MemberGrade[] = [
      MemberGrade.SALESPERSON,
      MemberGrade.TEAM_LEADER,
      MemberGrade.BRANCH_MANAGER,
      MemberGrade.ADMIN,
    ];

    if (!(allowedGrades as readonly MemberGrade[]).includes(seller.grade)) {
      throw new ForbiddenException('회원 이상 등급만 판매를 등록할 수 있습니다.');
    }

    // 제품 확인
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`제품 ID ${productId}를 찾을 수 없습니다.`);
    }

    if (!product.isActive) {
      throw new BadRequestException('비활성화된 제품은 판매할 수 없습니다.');
    }

    // 재고 확인
    if (product.stock < quantity) {
      throw new BadRequestException(
        `재고가 부족합니다. (현재 재고: ${product.stock}, 요청 수량: ${quantity})`
      );
    }

    // 판매 코드 생성
    const saleCode = await this.generateSaleCode();

    // 판매 일자 결정 (saleDate 지정 시 해당 날짜, 미지정 시 현재 시간)
    const saleDate = createSaleDto.saleDate
      ? new Date(createSaleDto.saleDate)
      : new Date();

    // 정산 주차 계산 (판매 일자 기준)
    const weekCode = this.calculateWeekCode(saleDate);

    // 가격 계산
    const unitPrice = product.price;
    const totalPrice = unitPrice * quantity;
    const unitPv = product.pv;
    const totalPv = unitPv * quantity;

    // ✅ 트랜잭션으로 원자성 보장 (판매, 재고, 보너스, PV 모두 포함)
    return this.prisma.$transaction(async (tx) => {
      // 1. 판매 등록
      const sale = await tx.sale.create({
        data: {
          saleCode,
          sellerId,
          productId,
          quantity,
          unitPrice,
          totalPrice,
          unitPv,
          totalPv,
          weekCode,
          status: SaleStatus.PENDING,
          soldAt: saleDate,
        },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              grade: true,
            },
          },
          product: {
            select: {
              id: true,
              code: true,
              name: true,
              price: true,
              pv: true,
            },
          },
        },
      });

      this.logger.log(
        `판매 등록 완료: ${saleCode} | 판매자: ${seller.name} | 제품: ${product.name} | 수량: ${quantity}`
      );

      // 2. 재고 차감 (atomic decrement)
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: {
            decrement: quantity,
          },
        },
      });

      this.logger.log(
        `재고 차감 완료: ${product.name} (${product.stock - quantity}개 남음)`
      );

      // ✅ 3. 보너스 자동 생성 (트랜잭션 내부)
      // 보너스 계산 실패 시 판매도 함께 롤백됨
      const bonuses = await this.bonusCalculator.processSaleBonusesInTx(tx, sale.id);
      this.logger.log(`보너스 계산 완료: ${saleCode} | ${bonuses.length}건 생성`);

      // ✅ 4. PV 누적 및 자동 승급 체크 (트랜잭션 내부)
      // PV 누적 실패 시 판매도 함께 롤백됨
      const result = await this.membersService.accumulatePvInTx(tx, sellerId, totalPv);

      if (result.promoted) {
        this.logger.log(
          `회원 자동 승급: ${seller.name} (ID: ${sellerId}) → ${result.newGrade}`,
        );
      }

      return sale;
    });
  }

  /**
   * 판매 목록 조회 (페이징)
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    sellerId?: number;
    status?: SaleStatus;
    weekCode?: string;
  }): Promise<{
    data: SaleResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, sellerId, status, weekCode } = params;

    const where: any = {};

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (status) {
      where.status = status;
    }

    if (weekCode) {
      where.weekCode = weekCode;
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              grade: true,
            },
          },
          product: {
            select: {
              id: true,
              code: true,
              name: true,
              price: true,
              pv: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data: sales,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 판매 상세 조회
   */
  async findOne(id: number): Promise<SaleResponseDto> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            grade: true,
          },
        },
        product: {
          select: {
            id: true,
            code: true,
            name: true,
            price: true,
            pv: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`판매 ID ${id}를 찾을 수 없습니다.`);
    }

    return sale;
  }

  /**
   * 판매 상태 변경 (BRANCH_CHIEF 이상 또는 ADMIN)
   */
  async updateStatus(
    id: number,
    updateSaleStatusDto: UpdateSaleStatusDto,
    userId: number,
  ): Promise<SaleResponseDto> {
    // 판매 존재 확인
    const sale = await this.findOne(id);

    // 사용자 권한 확인
    const user = await this.prisma.member.findUnique({
      where: { id: userId },
      select: { id: true, grade: true },
    });

    if (!user) {
      throw new NotFoundException(`사용자 ID ${userId}를 찾을 수 없습니다.`);
    }

    // 지사장 이상 또는 ADMIN만 상태 변경 가능 (신규 등급 체계)
    const allowedGrades: MemberGrade[] = [
      MemberGrade.BRANCH_MANAGER,
      MemberGrade.CENTER,
      MemberGrade.ADMIN,
    ];

    if (!(allowedGrades as readonly MemberGrade[]).includes(user.grade)) {
      throw new ForbiddenException(
        '지사장 이상 등급만 판매 상태를 변경할 수 있습니다.'
      );
    }

    const { status } = updateSaleStatusDto;

    // 취소 시 재고 복구
    if (status === SaleStatus.CANCELLED && sale.status !== SaleStatus.CANCELLED) {
      await this.prisma.product.update({
        where: { id: sale.productId },
        data: {
          stock: {
            increment: sale.quantity,
          },
        },
      });
    }

    const updated = await this.prisma.sale.update({
      where: { id },
      data: { status },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            grade: true,
          },
        },
        product: {
          select: {
            id: true,
            code: true,
            name: true,
            price: true,
            pv: true,
          },
        },
      },
    });

    this.logger.log(
      `판매 상태 변경: ${sale.saleCode} | ${sale.status} → ${status} | By: User ${userId}`
    );

    return updated;
  }

  /**
   * 판매 취소 (재고 복구)
   */
  async cancel(id: number, userId: number): Promise<SaleResponseDto> {
    return this.updateStatus(
      id,
      { status: SaleStatus.CANCELLED },
      userId
    );
  }

  /**
   * 판매 확정
   */
  async confirm(id: number, userId: number): Promise<SaleResponseDto> {
    return this.updateStatus(
      id,
      { status: SaleStatus.CONFIRMED },
      userId
    );
  }

  /**
   * 판매 보너스 미리보기
   * 실제 보너스 생성 없이 예상 보너스 금액을 계산하여 반환
   */
  async previewBonus(sellerId: number, productId: number, quantity: number): Promise<{
    totalPrice: number;
    totalPv: number;
    bonuses: Array<{
      type: string;
      amount: number;
      description: string;
      recipientId?: number;
      recipientName?: string;
    }>;
    totalBonus: number;
  }> {
    // 판매자 확인
    const seller = await this.prisma.member.findUnique({
      where: { id: sellerId },
      select: { id: true, name: true, grade: true, isActive: true },
    });

    if (!seller) {
      throw new NotFoundException(`판매자 ID ${sellerId}를 찾을 수 없습니다.`);
    }

    if (!seller.isActive) {
      throw new BadRequestException('비활성화된 회원은 판매를 등록할 수 없습니다.');
    }

    // 제품 확인
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`제품 ID ${productId}를 찾을 수 없습니다.`);
    }

    if (!product.isActive) {
      throw new BadRequestException('비활성화된 제품은 판매할 수 없습니다.');
    }

    // 보너스 계산기 서비스를 통해 실제 보너스 미리보기 계산
    const preview = await this.bonusCalculator.previewSaleBonuses(sellerId, productId, quantity);

    // 프론트엔드와 호환되는 형식으로 변환
    return {
      totalPrice: preview.totalPrice,
      totalPv: preview.totalPv,
      bonuses: preview.bonuses.map(b => ({
        type: b.typeKorean,
        amount: b.amount,
        description: b.description,
        recipientId: b.recipientId,
        recipientName: b.recipientName,
      })),
      totalBonus: preview.totalBonus,
    };
  }

  // ========================================
  // 인정매출 관련 메서드
  // ========================================

  /**
   * 인정매출 등록 (ADMIN 전용)
   * 회사 설립 시 구성원들의 등급 설정을 위한 가상 매출
   * - 보너스 지급 발생하지 않음
   * - 등급 직접 지정
   * - PV 누적 (자동 승급은 안 함)
   */
  async createRecognizedSale(
    dto: CreateRecognizedSaleDto,
    adminId: number,
  ): Promise<any> {
    const { memberId, productId, quantity, targetGrade, description } = dto;

    // 관리자 권한 확인
    const admin = await this.prisma.member.findUnique({
      where: { id: adminId },
      select: { id: true, name: true, grade: true },
    });

    if (!admin) {
      throw new NotFoundException(`관리자 ID ${adminId}를 찾을 수 없습니다.`);
    }

    if (admin.grade !== MemberGrade.ADMIN) {
      throw new ForbiddenException('ADMIN 등급만 인정매출을 등록할 수 있습니다.');
    }

    // 대상 회원 확인
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, name: true, grade: true, isActive: true, cumulativePv: true },
    });

    if (!member) {
      throw new NotFoundException(`회원 ID ${memberId}를 찾을 수 없습니다.`);
    }

    if (!member.isActive) {
      throw new BadRequestException('비활성화된 회원에게는 인정매출을 등록할 수 없습니다.');
    }

    // 목표 등급 유효성 검사 (ADMIN 등급은 지정 불가)
    if (targetGrade === MemberGrade.ADMIN) {
      throw new BadRequestException('ADMIN 등급은 인정매출로 지정할 수 없습니다.');
    }

    // 제품 확인
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`제품 ID ${productId}를 찾을 수 없습니다.`);
    }

    // 판매 코드 생성
    const saleCode = await this.generateSaleCode();

    // 정산 주차 계산
    const now = new Date();
    const weekCode = this.calculateWeekCode(now);

    // 가격 계산
    const unitPrice = product.price;
    const totalPrice = unitPrice * quantity;
    const unitPv = product.pv;
    const totalPv = unitPv * quantity;

    // 트랜잭션으로 원자성 보장
    return this.prisma.$transaction(async (tx) => {
      // 1. 인정매출 레코드 생성 (isRecognizedSale: true)
      const sale = await tx.sale.create({
        data: {
          saleCode,
          sellerId: memberId,
          productId,
          quantity,
          unitPrice,
          totalPrice,
          unitPv,
          totalPv,
          weekCode,
          status: SaleStatus.CONFIRMED, // 즉시 확정
          soldAt: now,
          // 인정매출 관련 필드
          isRecognizedSale: true,
          recognizedGrade: targetGrade,
          recognizedBy: adminId,
          recognizedAt: now,
          description: description || `인정매출 - ${targetGrade} 등급 설정`,
        },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              grade: true,
            },
          },
          product: {
            select: {
              id: true,
              code: true,
              name: true,
              price: true,
              pv: true,
            },
          },
          recognizer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(
        `인정매출 등록: ${saleCode} | 대상: ${member.name} (ID: ${memberId}) | 등급: ${targetGrade} | 관리자: ${admin.name}`
      );

      // 2. 회원 등급 직접 변경 + PV 누적
      await tx.member.update({
        where: { id: memberId },
        data: {
          grade: targetGrade,
          cumulativePv: {
            increment: totalPv,
          },
        },
      });

      this.logger.log(
        `회원 등급 변경: ${member.name} | ${member.grade} → ${targetGrade} | PV 누적: ${member.cumulativePv} → ${member.cumulativePv + totalPv}`
      );

      // 3. 보너스 계산 건너뛰기 (인정매출이므로)
      // processSaleBonuses() 호출 안 함!
      this.logger.log(`인정매출이므로 보너스 계산 건너뜀: ${saleCode}`);

      // 4. 재고는 차감하지 않음 (가상 매출이므로)

      return {
        sale,
        message: `인정매출이 등록되었습니다. ${member.name}님의 등급이 ${targetGrade}(으)로 변경되었습니다.`,
      };
    });
  }

  /**
   * 인정매출 목록 조회 (ADMIN 전용)
   */
  async findRecognizedSales(params: {
    page?: number;
    limit?: number;
    memberId?: number;
    targetGrade?: MemberGrade;
  }): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, memberId, targetGrade } = params;

    const where: any = {
      isRecognizedSale: true,
    };

    if (memberId) {
      where.sellerId = memberId;
    }

    if (targetGrade) {
      where.recognizedGrade = targetGrade;
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              grade: true,
              cumulativePv: true,
            },
          },
          product: {
            select: {
              id: true,
              code: true,
              name: true,
              price: true,
              pv: true,
            },
          },
          recognizer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { recognizedAt: 'desc' },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data: sales,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
