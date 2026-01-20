import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecognizedSalesDto } from './dto/create-recognized-sales.dto';
import { UpdateRecognizedSalesDto } from './dto/update-recognized-sales.dto';
import { RecognizedSalesQueryDto } from './dto/recognized-sales-query.dto';
import { MemberGrade, RecognizedSalesStatus, RecognitionType, Prisma } from '@prisma/client';

// 등급 계층 순서 (낮은 인덱스 = 높은 등급)
const GRADE_ORDER: MemberGrade[] = [
  MemberGrade.ADMIN,
  MemberGrade.CENTER,
  MemberGrade.DIVISION_CHIEF,
  MemberGrade.BRANCH_CHIEF,
  MemberGrade.MANAGER,
  MemberGrade.AGENT,
  MemberGrade.MEMBER,
];

// 인정 가능한 등급 목록
const RECOGNIZABLE_GRADES: MemberGrade[] = [
  MemberGrade.AGENT,
  MemberGrade.MANAGER,
  MemberGrade.BRANCH_CHIEF,
  MemberGrade.DIVISION_CHIEF,
];

@Injectable()
export class RecognizedSalesService {
  private readonly logger = new Logger(RecognizedSalesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 인정매출 등록
   */
  async create(dto: CreateRecognizedSalesDto, adminId: number) {
    // 1. 회원 존재 확인
    const member = await this.prisma.member.findUnique({
      where: { id: dto.memberId },
    });

    if (!member) {
      throw new NotFoundException(`회원 ID ${dto.memberId}를 찾을 수 없습니다`);
    }

    // 2. 인정 가능한 등급인지 확인
    if (!RECOGNIZABLE_GRADES.includes(dto.recognizedGrade)) {
      throw new BadRequestException(
        `인정 가능한 등급: ${RECOGNIZABLE_GRADES.join(', ')}`,
      );
    }

    // 3. 인정 유형 결정 (기본값: GRADE)
    const recognitionType = dto.recognitionType || RecognitionType.GRADE;
    const typeLabel = recognitionType === RecognitionType.LICENSE ? '인정판권' : '인정매출';

    // 4. 이미 동일 등급/유형으로 활성 인정이 있는지 확인
    const existingActive = await this.prisma.recognizedSales.findFirst({
      where: {
        memberId: dto.memberId,
        recognizedGrade: dto.recognizedGrade,
        recognitionType: recognitionType,
        status: RecognizedSalesStatus.ACTIVE,
      },
    });

    if (existingActive) {
      throw new ConflictException(
        `이미 ${dto.recognizedGrade} 등급으로 활성 ${typeLabel}이 존재합니다`,
      );
    }

    // 5. 인정매출/판권 생성
    const recognizedSales = await this.prisma.recognizedSales.create({
      data: {
        memberId: dto.memberId,
        recognizedGrade: dto.recognizedGrade,
        recognitionType: recognitionType,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        reason: dto.reason,
        createdBy: adminId,
      },
      include: {
        member: {
          select: {
            id: true,
            username: true,
            name: true,
            grade: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(
      `${typeLabel} 등록: 회원 ${member.name}(ID: ${dto.memberId})에게 ${dto.recognizedGrade} 인정 (관리자 ID: ${adminId})`,
    );

    return recognizedSales;
  }

  /**
   * 인정매출/판권 목록 조회 (페이지네이션)
   */
  async findAll(query: RecognizedSalesQueryDto) {
    const { page = 1, limit = 20, memberId, recognizedGrade, status, recognitionType, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RecognizedSalesWhereInput = {};

    if (memberId) {
      where.memberId = memberId;
    }

    if (recognizedGrade) {
      where.recognizedGrade = recognizedGrade;
    }

    if (status) {
      where.status = status;
    }

    if (recognitionType) {
      where.recognitionType = recognitionType;
    }

    if (search) {
      where.member = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.recognizedSales.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          member: {
            select: {
              id: true,
              username: true,
              name: true,
              grade: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          deactivator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.recognizedSales.count({ where }),
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
   * 인정매출 상세 조회
   */
  async findOne(id: number) {
    const recognizedSales = await this.prisma.recognizedSales.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            id: true,
            username: true,
            name: true,
            grade: true,
            phone: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        deactivator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!recognizedSales) {
      throw new NotFoundException(`인정매출 ID ${id}를 찾을 수 없습니다`);
    }

    return recognizedSales;
  }

  /**
   * 인정매출 수정
   */
  async update(id: number, dto: UpdateRecognizedSalesDto) {
    const existing = await this.findOne(id);

    if (existing.status !== RecognizedSalesStatus.ACTIVE) {
      throw new BadRequestException('활성 상태의 인정매출만 수정할 수 있습니다');
    }

    const updateData: Prisma.RecognizedSalesUpdateInput = {};

    if (dto.endDate !== undefined) {
      updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }

    if (dto.reason !== undefined) {
      updateData.reason = dto.reason;
    }

    return this.prisma.recognizedSales.update({
      where: { id },
      data: updateData,
      include: {
        member: {
          select: {
            id: true,
            username: true,
            name: true,
            grade: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * 인정매출 취소
   */
  async cancel(id: number, adminId: number) {
    const existing = await this.findOne(id);

    if (existing.status !== RecognizedSalesStatus.ACTIVE) {
      throw new BadRequestException('활성 상태의 인정매출만 취소할 수 있습니다');
    }

    const cancelled = await this.prisma.recognizedSales.update({
      where: { id },
      data: {
        status: RecognizedSalesStatus.CANCELLED,
        deactivatedAt: new Date(),
        deactivatedBy: adminId,
      },
      include: {
        member: {
          select: {
            id: true,
            username: true,
            name: true,
            grade: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        deactivator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(
      `인정매출 취소: ID ${id}, 회원 ${existing.member.name} (관리자 ID: ${adminId})`,
    );

    return cancelled;
  }

  /**
   * 회원의 활성 인정매출 조회
   * 보너스 계산에서 사용
   */
  async getActiveRecognition(memberId: number) {
    const now = new Date();

    // 활성 상태이면서 기간 내인 인정매출 조회
    const recognition = await this.prisma.recognizedSales.findFirst({
      where: {
        memberId,
        status: RecognizedSalesStatus.ACTIVE,
        startDate: { lte: now },
        OR: [
          { endDate: null }, // 무기한
          { endDate: { gte: now } }, // 종료일 이전
        ],
      },
      orderBy: {
        // 가장 높은 인정 등급 우선
        recognizedGrade: 'asc',
      },
    });

    return recognition;
  }

  /**
   * 회원의 유효 등급 조회 (실제 등급과 인정 등급 중 높은 것)
   * 보너스 계산에서 사용
   */
  async getEffectiveGrade(memberId: number): Promise<MemberGrade> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { grade: true },
    });

    if (!member) {
      throw new NotFoundException(`회원 ID ${memberId}를 찾을 수 없습니다`);
    }

    const recognition = await this.getActiveRecognition(memberId);

    if (!recognition) {
      return member.grade;
    }

    // 실제 등급과 인정 등급 중 높은 것 반환
    const actualIndex = GRADE_ORDER.indexOf(member.grade);
    const recognizedIndex = GRADE_ORDER.indexOf(recognition.recognizedGrade);

    // 인덱스가 작을수록 높은 등급
    return recognizedIndex < actualIndex ? recognition.recognizedGrade : member.grade;
  }

  /**
   * 회원의 인정 상태 확인 (프론트엔드용)
   */
  async checkMemberRecognitionStatus(memberId: number) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        username: true,
        name: true,
        grade: true,
      },
    });

    if (!member) {
      throw new NotFoundException(`회원 ID ${memberId}를 찾을 수 없습니다`);
    }

    const activeRecognition = await this.getActiveRecognition(memberId);
    const effectiveGrade = await this.getEffectiveGrade(memberId);

    return {
      member,
      actualGrade: member.grade,
      effectiveGrade,
      hasActiveRecognition: !!activeRecognition,
      activeRecognition: activeRecognition
        ? {
            id: activeRecognition.id,
            recognizedGrade: activeRecognition.recognizedGrade,
            startDate: activeRecognition.startDate,
            endDate: activeRecognition.endDate,
            reason: activeRecognition.reason,
          }
        : null,
    };
  }

  /**
   * 만료된 인정매출 자동 처리 (배치용)
   */
  async expireOutdated() {
    const now = new Date();

    const result = await this.prisma.recognizedSales.updateMany({
      where: {
        status: RecognizedSalesStatus.ACTIVE,
        endDate: { lt: now },
      },
      data: {
        status: RecognizedSalesStatus.EXPIRED,
        deactivatedAt: now,
      },
    });

    if (result.count > 0) {
      this.logger.log(`만료된 인정매출 ${result.count}건 처리 완료`);
    }

    return result;
  }

  /**
   * 회원에게 특정 등급의 활성 LICENSE 인정판권이 있는지 확인
   * LICENSE 보너스 팀 조건 우회에 사용
   *
   * @param memberId 회원 ID
   * @param targetGrade 대상 등급 (MANAGER, BRANCH_CHIEF, DIVISION_CHIEF)
   * @returns 해당 등급의 활성 인정판권 존재 여부
   */
  async hasActiveLicenseRecognition(memberId: number, targetGrade: MemberGrade): Promise<boolean> {
    const now = new Date();

    // LICENSE 유형, 활성 상태, 기간 내인 인정판권 확인
    const recognition = await this.prisma.recognizedSales.findFirst({
      where: {
        memberId,
        recognizedGrade: targetGrade,
        recognitionType: RecognitionType.LICENSE,
        status: RecognizedSalesStatus.ACTIVE,
        startDate: { lte: now },
        OR: [
          { endDate: null }, // 무기한
          { endDate: { gte: now } }, // 종료일 이전
        ],
      },
    });

    return !!recognition;
  }
}
