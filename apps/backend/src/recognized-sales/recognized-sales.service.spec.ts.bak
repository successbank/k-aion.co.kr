import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { RecognizedSalesService } from './recognized-sales.service';
import { PrismaService } from '../prisma/prisma.service';
import { MemberGrade, RecognizedSalesStatus, RecognitionType } from '@prisma/client';

describe('RecognizedSalesService', () => {
  let service: RecognizedSalesService;
  let prisma: PrismaService;

  // Mock 데이터
  const mockMember = {
    id: 1,
    username: 'testuser',
    name: '테스트회원',
    grade: MemberGrade.AGENT,
    phone: '010-1234-5678',
    email: 'test@example.com',
  };

  const mockAdmin = {
    id: 100,
    name: '관리자',
  };

  const mockRecognizedSales = {
    id: 1,
    memberId: 1,
    recognizedGrade: MemberGrade.MANAGER,
    status: RecognizedSalesStatus.ACTIVE,
    startDate: new Date('2025-01-01'),
    endDate: null,
    reason: '특별 인정',
    createdBy: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    deactivatedAt: null,
    deactivatedBy: null,
    member: mockMember,
    creator: mockAdmin,
    deactivator: null,
  };

  // Mock PrismaService
  const mockPrismaService = {
    member: {
      findUnique: jest.fn(),
    },
    recognizedSales: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecognizedSalesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RecognizedSalesService>(RecognizedSalesService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('create()', () => {
    const validDto = {
      memberId: 1,
      recognizedGrade: MemberGrade.MANAGER,
      startDate: '2025-01-01',
      reason: '특별 인정',
    };

    it('유효한 MANAGER 인정 등록 시 성공', async () => {
      // Arrange
      mockPrismaService.member.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.recognizedSales.findFirst.mockResolvedValue(null);
      mockPrismaService.recognizedSales.create.mockResolvedValue(mockRecognizedSales);

      // Act
      const result = await service.create(validDto, 100);

      // Assert
      expect(result).toEqual(mockRecognizedSales);
      expect(mockPrismaService.member.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrismaService.recognizedSales.create).toHaveBeenCalled();
    });

    it('존재하지 않는 회원 ID로 등록 시 NotFoundException 발생', async () => {
      // Arrange
      mockPrismaService.member.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(validDto, 100)).rejects.toThrow(NotFoundException);
      await expect(service.create(validDto, 100)).rejects.toThrow(
        '회원 ID 1를 찾을 수 없습니다',
      );
    });

    it('유효하지 않은 등급 (ADMIN)으로 등록 시 BadRequestException 발생', async () => {
      // Arrange
      mockPrismaService.member.findUnique.mockResolvedValue(mockMember);
      const invalidDto = { ...validDto, recognizedGrade: MemberGrade.ADMIN };

      // Act & Assert
      await expect(service.create(invalidDto, 100)).rejects.toThrow(BadRequestException);
      await expect(service.create(invalidDto, 100)).rejects.toThrow('인정 가능한 등급');
    });

    it('동일 등급으로 중복 ACTIVE 인정 시 ConflictException 발생', async () => {
      // Arrange
      mockPrismaService.member.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.recognizedSales.findFirst.mockResolvedValue(mockRecognizedSales);

      // Act & Assert
      await expect(service.create(validDto, 100)).rejects.toThrow(ConflictException);
      await expect(service.create(validDto, 100)).rejects.toThrow('이미');
    });
  });

  describe('findAll()', () => {
    it('기본 페이지네이션 (page=1, limit=20) 정상 동작', async () => {
      // Arrange
      const mockData = [mockRecognizedSales];
      mockPrismaService.recognizedSales.findMany.mockResolvedValue(mockData);
      mockPrismaService.recognizedSales.count.mockResolvedValue(1);

      // Act
      const result = await service.findAll({ page: 1, limit: 20 });

      // Assert
      expect(result).toEqual({
        data: mockData,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockPrismaService.recognizedSales.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });

    it('상태 필터 (status=ACTIVE) 적용 시 ACTIVE만 반환', async () => {
      // Arrange
      const mockData = [mockRecognizedSales];
      mockPrismaService.recognizedSales.findMany.mockResolvedValue(mockData);
      mockPrismaService.recognizedSales.count.mockResolvedValue(1);

      // Act
      const result = await service.findAll({
        page: 1,
        limit: 20,
        status: RecognizedSalesStatus.ACTIVE,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(mockPrismaService.recognizedSales.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: RecognizedSalesStatus.ACTIVE,
          }),
        }),
      );
    });

    it('회원명 검색 시 검색어 포함 회원만 반환', async () => {
      // Arrange
      mockPrismaService.recognizedSales.findMany.mockResolvedValue([mockRecognizedSales]);
      mockPrismaService.recognizedSales.count.mockResolvedValue(1);

      // Act
      const result = await service.findAll({
        page: 1,
        limit: 20,
        search: '테스트',
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(mockPrismaService.recognizedSales.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            member: {
              OR: [
                { name: { contains: '테스트', mode: 'insensitive' } },
                { username: { contains: '테스트', mode: 'insensitive' } },
              ],
            },
          }),
        }),
      );
    });
  });

  describe('findOne()', () => {
    it('유효한 ID 조회 시 상세 정보 + relations 반환', async () => {
      // Arrange
      mockPrismaService.recognizedSales.findUnique.mockResolvedValue(mockRecognizedSales);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result).toEqual(mockRecognizedSales);
      expect(mockPrismaService.recognizedSales.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.objectContaining({
          member: expect.any(Object),
          creator: expect.any(Object),
          deactivator: expect.any(Object),
        }),
      });
    });

    it('존재하지 않는 ID 조회 시 NotFoundException 발생', async () => {
      // Arrange
      mockPrismaService.recognizedSales.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('인정매출 ID 999를 찾을 수 없습니다');
    });
  });

  describe('cancel()', () => {
    it('ACTIVE 상태 취소 시 status=CANCELLED, deactivatedAt 설정', async () => {
      // Arrange
      const cancelledSales = {
        ...mockRecognizedSales,
        status: RecognizedSalesStatus.CANCELLED,
        deactivatedAt: new Date(),
        deactivatedBy: 100,
      };
      mockPrismaService.recognizedSales.findUnique.mockResolvedValue(mockRecognizedSales);
      mockPrismaService.recognizedSales.update.mockResolvedValue(cancelledSales);

      // Act
      const result = await service.cancel(1, 100);

      // Assert
      expect(result.status).toBe(RecognizedSalesStatus.CANCELLED);
      expect(mockPrismaService.recognizedSales.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: RecognizedSalesStatus.CANCELLED,
          deactivatedBy: 100,
        }),
        include: expect.any(Object),
      });
    });

    it('이미 CANCELLED 상태 취소 시도 시 BadRequestException 발생', async () => {
      // Arrange
      const cancelledSales = {
        ...mockRecognizedSales,
        status: RecognizedSalesStatus.CANCELLED,
      };
      mockPrismaService.recognizedSales.findUnique.mockResolvedValue(cancelledSales);

      // Act & Assert
      await expect(service.cancel(1, 100)).rejects.toThrow(BadRequestException);
      await expect(service.cancel(1, 100)).rejects.toThrow('활성 상태의 인정매출만 취소');
    });
  });

  describe('getEffectiveGrade()', () => {
    it('인정 등급 > 실제 등급 시 인정 등급 반환', async () => {
      // Arrange: AGENT가 MANAGER로 인정받은 경우
      mockPrismaService.member.findUnique.mockResolvedValue({
        ...mockMember,
        grade: MemberGrade.AGENT,
      });
      // 활성 인정 - 현재 시점 기준 유효
      const activeRecognition = {
        ...mockRecognizedSales,
        recognizedGrade: MemberGrade.MANAGER,
        startDate: new Date(Date.now() - 86400000), // 어제
        endDate: null, // 무기한
      };
      mockPrismaService.recognizedSales.findFirst.mockResolvedValue(activeRecognition);

      // Act
      const result = await service.getEffectiveGrade(1);

      // Assert
      expect(result).toBe(MemberGrade.MANAGER);
    });
  });

  // ============================================================
  // 시나리오 1-6: recognitionType 처리 테스트
  // ============================================================
  describe('recognitionType 처리', () => {
    const validDto = {
      memberId: 1,
      recognizedGrade: MemberGrade.MANAGER,
      startDate: '2025-01-01',
      reason: '특별 인정',
    };

    // 시나리오 1: create - recognitionType 미지정 시 기본값
    it('시나리오 1: create - recognitionType 미지정 시 GRADE 타입으로 생성', async () => {
      // Arrange
      mockPrismaService.member.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.recognizedSales.findFirst.mockResolvedValue(null);
      const createdRecognition = {
        ...mockRecognizedSales,
        recognitionType: RecognitionType.GRADE,
      };
      mockPrismaService.recognizedSales.create.mockResolvedValue(createdRecognition);

      // Act
      const result = await service.create(validDto, 100);

      // Assert
      expect(result.recognitionType).toBe(RecognitionType.GRADE);
      expect(mockPrismaService.recognizedSales.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recognitionType: RecognitionType.GRADE,
          }),
        }),
      );
    });

    // 시나리오 2: create - LICENSE 타입 명시 생성
    it('시나리오 2: create - LICENSE 타입 명시 생성 시 LICENSE 타입으로 생성', async () => {
      // Arrange
      const dtoWithLicense = {
        ...validDto,
        recognitionType: RecognitionType.LICENSE,
      };
      mockPrismaService.member.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.recognizedSales.findFirst.mockResolvedValue(null);
      const createdRecognition = {
        ...mockRecognizedSales,
        recognitionType: RecognitionType.LICENSE,
      };
      mockPrismaService.recognizedSales.create.mockResolvedValue(createdRecognition);

      // Act
      const result = await service.create(dtoWithLicense, 100);

      // Assert
      expect(result.recognitionType).toBe(RecognitionType.LICENSE);
      expect(mockPrismaService.recognizedSales.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recognitionType: RecognitionType.LICENSE,
          }),
        }),
      );
    });

    // 시나리오 3: create - 동일 회원/등급 GRADE + LICENSE 동시 가능
    it('시나리오 3: 동일 회원/등급에 GRADE와 LICENSE 각각 등록 가능', async () => {
      // Arrange: GRADE 타입으로 등록 시 LICENSE 타입이 이미 있는 경우에도 성공
      const dtoGrade = { ...validDto, recognitionType: RecognitionType.GRADE };
      mockPrismaService.member.findUnique.mockResolvedValue(mockMember);
      // findFirst는 동일 등급 + 동일 타입(GRADE)이 없음을 반환
      mockPrismaService.recognizedSales.findFirst.mockResolvedValue(null);
      const createdRecognition = {
        ...mockRecognizedSales,
        recognitionType: RecognitionType.GRADE,
      };
      mockPrismaService.recognizedSales.create.mockResolvedValue(createdRecognition);

      // Act
      const result = await service.create(dtoGrade, 100);

      // Assert
      expect(result).toBeDefined();
      expect(mockPrismaService.recognizedSales.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            recognitionType: RecognitionType.GRADE,
          }),
        }),
      );
    });

    // 시나리오 4: create - 동일 회원/등급/타입 중복 불가
    it('시나리오 4: 동일 회원/등급/타입으로 중복 등록 시 ConflictException 발생', async () => {
      // Arrange: 이미 동일한 GRADE 인정이 있는 경우
      const existingGradeRecognition = {
        ...mockRecognizedSales,
        recognitionType: RecognitionType.GRADE,
      };
      mockPrismaService.member.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.recognizedSales.findFirst.mockResolvedValue(existingGradeRecognition);

      // Act & Assert
      await expect(service.create(validDto, 100)).rejects.toThrow(ConflictException);
      await expect(service.create(validDto, 100)).rejects.toThrow('이미');
    });

    // 시나리오 5: findAll - recognitionType=GRADE 필터
    it('시나리오 5: findAll - recognitionType=GRADE 필터 시 GRADE 타입만 반환', async () => {
      // Arrange
      const gradeRecognition = {
        ...mockRecognizedSales,
        recognitionType: RecognitionType.GRADE,
      };
      mockPrismaService.recognizedSales.findMany.mockResolvedValue([gradeRecognition]);
      mockPrismaService.recognizedSales.count.mockResolvedValue(1);

      // Act
      const result = await service.findAll({
        page: 1,
        limit: 20,
        recognitionType: RecognitionType.GRADE,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(mockPrismaService.recognizedSales.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            recognitionType: RecognitionType.GRADE,
          }),
        }),
      );
    });

    // 시나리오 6: findAll - recognitionType=LICENSE 필터
    it('시나리오 6: findAll - recognitionType=LICENSE 필터 시 LICENSE 타입만 반환', async () => {
      // Arrange
      const licenseRecognition = {
        ...mockRecognizedSales,
        recognitionType: RecognitionType.LICENSE,
      };
      mockPrismaService.recognizedSales.findMany.mockResolvedValue([licenseRecognition]);
      mockPrismaService.recognizedSales.count.mockResolvedValue(1);

      // Act
      const result = await service.findAll({
        page: 1,
        limit: 20,
        recognitionType: RecognitionType.LICENSE,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(mockPrismaService.recognizedSales.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            recognitionType: RecognitionType.LICENSE,
          }),
        }),
      );
    });
  });

  // ============================================================
  // 시나리오 7-13: hasActiveLicenseRecognition() 테스트
  // ============================================================
  describe('hasActiveLicenseRecognition()', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000);
    const tomorrow = new Date(now.getTime() + 86400000);

    // 시나리오 7: 활성 LICENSE 인정 존재
    it('시나리오 7: ACTIVE + 기간 내 + LICENSE 타입 → true 반환', async () => {
      // Arrange
      const activeLicenseRecognition = {
        ...mockRecognizedSales,
        recognitionType: RecognitionType.LICENSE,
        recognizedGrade: MemberGrade.MANAGER,
        status: RecognizedSalesStatus.ACTIVE,
        startDate: yesterday,
        endDate: tomorrow,
      };
      mockPrismaService.recognizedSales.findFirst.mockResolvedValue(activeLicenseRecognition);

      // Act
      const result = await service.hasActiveLicenseRecognition(1, MemberGrade.MANAGER);

      // Assert
      expect(result).toBe(true);
      expect(mockPrismaService.recognizedSales.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            memberId: 1,
            recognizedGrade: MemberGrade.MANAGER,
            recognitionType: RecognitionType.LICENSE,
            status: RecognizedSalesStatus.ACTIVE,
          }),
        }),
      );
    });

    // 시나리오 8: 활성 LICENSE 인정 없음 (GRADE만 있음)
    it('시나리오 8: GRADE 타입만 존재 → false 반환', async () => {
      // Arrange: LICENSE 타입 조회 결과 없음
      mockPrismaService.recognizedSales.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.hasActiveLicenseRecognition(1, MemberGrade.MANAGER);

      // Assert
      expect(result).toBe(false);
    });

    // 시나리오 9: LICENSE 인정 만료 (endDate 지남)
    it('시나리오 9: LICENSE 인정 만료 (endDate < 현재) → false 반환', async () => {
      // Arrange: findFirst 쿼리에서 endDate 조건으로 필터되어 null 반환
      mockPrismaService.recognizedSales.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.hasActiveLicenseRecognition(1, MemberGrade.MANAGER);

      // Assert
      expect(result).toBe(false);
    });

    // 시나리오 10: LICENSE 인정 취소됨 (CANCELLED)
    it('시나리오 10: LICENSE 인정 취소됨 (status=CANCELLED) → false 반환', async () => {
      // Arrange: ACTIVE가 아니므로 findFirst에서 필터됨
      mockPrismaService.recognizedSales.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.hasActiveLicenseRecognition(1, MemberGrade.MANAGER);

      // Assert
      expect(result).toBe(false);
    });

    // 시나리오 11: LICENSE 인정 시작 전 (startDate 미래)
    it('시나리오 11: LICENSE 인정 시작 전 (startDate > 현재) → false 반환', async () => {
      // Arrange: startDate 조건으로 필터되어 null 반환
      mockPrismaService.recognizedSales.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.hasActiveLicenseRecognition(1, MemberGrade.MANAGER);

      // Assert
      expect(result).toBe(false);
    });

    // 시나리오 12: LICENSE 인정 무기한 (endDate=null)
    it('시나리오 12: LICENSE 인정 무기한 (endDate=null) → true 반환', async () => {
      // Arrange
      const indefiniteLicenseRecognition = {
        ...mockRecognizedSales,
        recognitionType: RecognitionType.LICENSE,
        recognizedGrade: MemberGrade.MANAGER,
        status: RecognizedSalesStatus.ACTIVE,
        startDate: yesterday,
        endDate: null, // 무기한
      };
      mockPrismaService.recognizedSales.findFirst.mockResolvedValue(indefiniteLicenseRecognition);

      // Act
      const result = await service.hasActiveLicenseRecognition(1, MemberGrade.MANAGER);

      // Assert
      expect(result).toBe(true);
    });

    // 시나리오 13: 다른 등급의 LICENSE 인정
    it('시나리오 13: MANAGER 조회 시 BRANCH_CHIEF만 있음 → false 반환', async () => {
      // Arrange: MANAGER 등급 조회지만 BRANCH_CHIEF만 있음
      mockPrismaService.recognizedSales.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.hasActiveLicenseRecognition(1, MemberGrade.MANAGER);

      // Assert
      expect(result).toBe(false);
      expect(mockPrismaService.recognizedSales.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            recognizedGrade: MemberGrade.MANAGER,
          }),
        }),
      );
    });
  });
});
