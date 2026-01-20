import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BonusType,
  CommissionRate,
  Prisma,
  CommissionRateTier,
  CommissionQualification,
} from '@prisma/client';
import { CreateCommissionRateDto } from './dto/create-commission-rate.dto';
import { UpdateCommissionRateDto } from './dto/update-commission-rate.dto';

// 관계 포함 타입 정의
export type CommissionRateWithRelations = CommissionRate & {
  tiers: CommissionRateTier[];
  qualifications: CommissionQualification[];
};

@Injectable()
export class CommissionRatesService {
  private readonly logger = new Logger(CommissionRatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 활성 보너스 설정 조회 (보너스 타입별)
   * @param type 보너스 유형
   * @returns 활성화된 보너스 설정 (tiers, qualifications 포함)
   */
  async findActiveByBonusType(type: BonusType): Promise<CommissionRateWithRelations | null> {
    const rate = await this.prisma.commissionRate.findFirst({
      where: { bonusType: type, isActive: true },
      include: {
        tiers: { orderBy: { tierOrder: 'asc' } },
        qualifications: true,
      },
    });

    return rate;
  }

  /**
   * 전체 보너스 설정 목록 조회
   * @param filters 필터 조건
   * @returns 보너스 설정 목록
   */
  async findAll(filters?: {
    bonusType?: BonusType;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const where: Prisma.CommissionRateWhereInput = {};
    if (filters?.bonusType) where.bonusType = filters.bonusType;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.commissionRate.findMany({
        where,
        include: {
          tiers: { orderBy: { tierOrder: 'asc' } },
          qualifications: true,
        },
        orderBy: [{ bonusType: 'asc' }, { version: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.commissionRate.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 보너스 설정 상세 조회
   * @param id 보너스 설정 ID
   * @returns 보너스 설정 상세
   */
  async findOne(id: number) {
    const rate = await this.prisma.commissionRate.findUnique({
      where: { id },
      include: {
        tiers: { orderBy: { tierOrder: 'asc' } },
        qualifications: true,
      },
    });

    if (!rate) {
      throw new NotFoundException(`Commission rate with ID ${id} not found`);
    }

    return rate;
  }

  /**
   * 7가지 보너스 요약 조회
   * @returns 모든 보너스 유형의 활성 설정
   */
  async getSummary() {
    const bonusTypes = Object.values(BonusType);

    const summaries = await Promise.all(
      bonusTypes.map(async (type) => {
        const rate = await this.findActiveByBonusType(type);
        return {
          bonusType: type,
          isConfigured: !!rate,
          config: rate,
        };
      }),
    );

    return summaries;
  }

  /**
   * 보너스 설정 생성
   * @param dto 생성 DTO
   * @returns 생성된 보너스 설정
   */
  async create(dto: CreateCommissionRateDto) {
    // 최신 버전 조회
    const latestVersion = await this.prisma.commissionRate.findFirst({
      where: { bonusType: dto.bonusType },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const newVersion = latestVersion ? latestVersion.version + 1 : 1;

    // Validation: isGradeTiered=true인 경우 tiers 필수
    if (dto.isGradeTiered && (!dto.tiers || dto.tiers.length === 0)) {
      throw new ConflictException('Tiers are required when isGradeTiered is true');
    }

    // Validation: baseAmount 또는 basePercentage 중 하나는 필수
    if (!dto.baseAmount && !dto.basePercentage) {
      throw new ConflictException('Either baseAmount or basePercentage is required');
    }

    const rate = await this.prisma.commissionRate.create({
      data: {
        bonusType: dto.bonusType,
        name: dto.name,
        nameKo: dto.nameKo,
        description: dto.description,
        baseAmount: dto.baseAmount,
        basePercentage: dto.basePercentage,
        basePv: dto.basePv,
        isGradeTiered: dto.isGradeTiered,
        isSameRankOnly: dto.isSameRankOnly,
        isFirstGenOnly: dto.isFirstGenOnly,
        isDifferential: dto.isDifferential,
        centerBonusMode: dto.centerBonusMode,
        version: newVersion,
        isActive: dto.isActive,
        tiers: dto.tiers
          ? {
              create: dto.tiers.map((tier) => ({
                applicableGrade: tier.applicableGrade,
                amount: tier.amount,
                percentage: tier.percentage,
                tierOrder: tier.tierOrder,
              })),
            }
          : undefined,
        qualifications: dto.qualifications
          ? {
              create: dto.qualifications.map((qual) => ({
                qualificationType: qual.qualificationType,
                requiredGrade: qual.requiredGrade,
                requiredCount: qual.requiredCount,
                requiredTeamCount: qual.requiredTeamCount,
                minMembersPerTeam: qual.minMembersPerTeam,
                requiresOffice: qual.requiresOffice,
                requiresSeminar: qual.requiresSeminar,
                requiresCorporation: qual.requiresCorporation,
                requiresTV: qual.requiresTV,
              })),
            }
          : undefined,
      },
      include: {
        tiers: true,
        qualifications: true,
      },
    });

    this.logger.log(`Created commission rate: ${rate.nameKo} (v${rate.version})`);

    return rate;
  }

  /**
   * 보너스 설정 수정
   * @param id 보너스 설정 ID
   * @param dto 수정 DTO
   * @returns 수정된 보너스 설정
   */
  async update(id: number, dto: UpdateCommissionRateDto) {
    // 존재 여부 확인
    await this.findOne(id);

    // 기존 tiers, qualifications 삭제 후 재생성
    const rate = await this.prisma.$transaction(async (tx) => {
      // 기존 관계 삭제
      if (dto.tiers) {
        await tx.commissionRateTier.deleteMany({
          where: { commissionRateId: id },
        });
      }
      if (dto.qualifications) {
        await tx.commissionQualification.deleteMany({
          where: { commissionRateId: id },
        });
      }

      // 업데이트
      return tx.commissionRate.update({
        where: { id },
        data: {
          name: dto.name,
          nameKo: dto.nameKo,
          description: dto.description,
          baseAmount: dto.baseAmount,
          basePercentage: dto.basePercentage,
          basePv: dto.basePv,
          isGradeTiered: dto.isGradeTiered,
          isSameRankOnly: dto.isSameRankOnly,
          isFirstGenOnly: dto.isFirstGenOnly,
          isDifferential: dto.isDifferential,
          centerBonusMode: dto.centerBonusMode,
          isActive: dto.isActive,
          tiers: dto.tiers
            ? {
                create: dto.tiers.map((tier) => ({
                  applicableGrade: tier.applicableGrade,
                  amount: tier.amount,
                  percentage: tier.percentage,
                  tierOrder: tier.tierOrder,
                })),
              }
            : undefined,
          qualifications: dto.qualifications
            ? {
                create: dto.qualifications.map((qual) => ({
                  qualificationType: qual.qualificationType,
                  requiredGrade: qual.requiredGrade,
                  requiredCount: qual.requiredCount,
                  requiredTeamCount: qual.requiredTeamCount,
                  minMembersPerTeam: qual.minMembersPerTeam,
                  requiresOffice: qual.requiresOffice,
                  requiresSeminar: qual.requiresSeminar,
                  requiresCorporation: qual.requiresCorporation,
                  requiresTV: qual.requiresTV,
                })),
              }
            : undefined,
        },
        include: {
          tiers: true,
          qualifications: true,
        },
      });
    });

    this.logger.log(`Updated commission rate: ${rate.nameKo} (ID: ${id})`);

    return rate;
  }

  /**
   * 보너스 설정 삭제 (소프트 삭제)
   * @param id 보너스 설정 ID
   */
  async remove(id: number) {
    await this.findOne(id);

    const rate = await this.prisma.commissionRate.update({
      where: { id },
      data: {
        isActive: false,
        effectiveTo: new Date(),
      },
    });

    this.logger.log(`Deactivated commission rate: ${rate.nameKo} (ID: ${id})`);

    return { message: 'Commission rate deactivated successfully' };
  }

  /**
   * 버전 활성화 (기존 활성 버전 비활성화)
   * @param id 활성화할 보너스 설정 ID
   */
  async activate(id: number) {
    const rate = await this.findOne(id);

    await this.prisma.$transaction([
      // 동일 bonusType의 다른 활성 버전 비활성화
      this.prisma.commissionRate.updateMany({
        where: {
          bonusType: rate.bonusType,
          isActive: true,
          id: { not: id },
        },
        data: {
          isActive: false,
          effectiveTo: new Date(),
        },
      }),
      // 해당 버전 활성화
      this.prisma.commissionRate.update({
        where: { id },
        data: {
          isActive: true,
          effectiveFrom: new Date(),
          effectiveTo: null,
        },
      }),
    ]);

    this.logger.log(`Activated commission rate: ${rate.nameKo} (v${rate.version})`);

    return { message: 'Commission rate activated successfully' };
  }

  /**
   * 버전 복제 (새 버전 생성)
   * @param id 복제할 보너스 설정 ID
   * @returns 복제된 보너스 설정
   */
  async duplicate(id: number) {
    const original = await this.findOne(id);

    // 최신 버전 조회
    const latestVersion = await this.prisma.commissionRate.findFirst({
      where: { bonusType: original.bonusType },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const newVersion = (latestVersion?.version || 0) + 1;

    const duplicated = await this.prisma.commissionRate.create({
      data: {
        bonusType: original.bonusType,
        name: original.name,
        nameKo: original.nameKo,
        description: original.description,
        baseAmount: original.baseAmount,
        basePercentage: original.basePercentage ? Number(original.basePercentage) : null,
        basePv: original.basePv,
        isGradeTiered: original.isGradeTiered,
        isSameRankOnly: original.isSameRankOnly,
        isFirstGenOnly: original.isFirstGenOnly,
        isDifferential: original.isDifferential,
        centerBonusMode: original.centerBonusMode,
        version: newVersion,
        isActive: false, // 복제본은 비활성 상태로
        tiers: {
          create: original.tiers.map((tier) => ({
            applicableGrade: tier.applicableGrade,
            amount: tier.amount,
            percentage: tier.percentage ? Number(tier.percentage) : null,
            tierOrder: tier.tierOrder,
          })),
        },
        qualifications: {
          create: original.qualifications.map((qual) => ({
            qualificationType: qual.qualificationType,
            requiredGrade: qual.requiredGrade,
            requiredCount: qual.requiredCount,
            requiredTeamCount: qual.requiredTeamCount,
            minMembersPerTeam: qual.minMembersPerTeam,
            requiresOffice: qual.requiresOffice,
            requiresSeminar: qual.requiresSeminar,
            requiresCorporation: qual.requiresCorporation,
            requiresTV: qual.requiresTV,
          })),
        },
      },
      include: {
        tiers: true,
        qualifications: true,
      },
    });

    this.logger.log(`Duplicated commission rate: ${duplicated.nameKo} (v${duplicated.version})`);

    return duplicated;
  }
}
