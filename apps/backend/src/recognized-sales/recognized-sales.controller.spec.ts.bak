import { Test, TestingModule } from '@nestjs/testing';
import { RecognizedSalesController } from './recognized-sales.controller';
import { RecognizedSalesService } from './recognized-sales.service';
import { MemberGrade, RecognizedSalesStatus } from '@prisma/client';

describe('RecognizedSalesController', () => {
  let controller: RecognizedSalesController;
  let service: RecognizedSalesService;

  // Mock 데이터
  const mockMember = {
    id: 1,
    username: 'testuser',
    name: '테스트회원',
    grade: MemberGrade.AGENT,
  };

  const mockCreator = {
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
    creator: mockCreator,
    deactivator: null,
  };

  // Mock RecognizedSalesService
  const mockRecognizedSalesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
    checkMemberRecognitionStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecognizedSalesController],
      providers: [
        { provide: RecognizedSalesService, useValue: mockRecognizedSalesService },
      ],
    }).compile();

    controller = module.get<RecognizedSalesController>(RecognizedSalesController);
    service = module.get<RecognizedSalesService>(RecognizedSalesService);

    jest.clearAllMocks();
  });

  describe('POST /recognized-sales', () => {
    it('유효한 요청 시 201, 생성된 레코드 반환', async () => {
      // Arrange
      const dto = {
        memberId: 1,
        recognizedGrade: MemberGrade.MANAGER,
        startDate: '2025-01-01',
        reason: '특별 인정',
      };
      mockRecognizedSalesService.create.mockResolvedValue(mockRecognizedSales);

      // Act
      const result = await controller.create(dto, 100);

      // Assert
      expect(result).toEqual(mockRecognizedSales);
      expect(mockRecognizedSalesService.create).toHaveBeenCalledWith(dto, 100);
    });
  });

  describe('GET /recognized-sales', () => {
    it('목록 조회 시 200, paginated 결과 반환', async () => {
      // Arrange
      const paginatedResult = {
        data: [mockRecognizedSales],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      mockRecognizedSalesService.findAll.mockResolvedValue(paginatedResult);

      // Act
      const result = await controller.findAll({ page: 1, limit: 20 });

      // Assert
      expect(result).toEqual(paginatedResult);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockRecognizedSalesService.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });
  });

  describe('PATCH /recognized-sales/:id', () => {
    it('수정 요청 시 200, 수정된 레코드 반환', async () => {
      // Arrange
      const updateDto = {
        endDate: '2025-12-31',
        reason: '연말까지 연장',
      };
      const updatedSales = {
        ...mockRecognizedSales,
        endDate: new Date('2025-12-31'),
        reason: '연말까지 연장',
      };
      mockRecognizedSalesService.update.mockResolvedValue(updatedSales);

      // Act
      const result = await controller.update(1, updateDto);

      // Assert
      expect(result).toEqual(updatedSales);
      expect(result.reason).toBe('연말까지 연장');
      expect(mockRecognizedSalesService.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('POST /recognized-sales/:id/cancel', () => {
    it('취소 요청 시 200, 취소된 레코드 반환', async () => {
      // Arrange
      const cancelledSales = {
        ...mockRecognizedSales,
        status: RecognizedSalesStatus.CANCELLED,
        deactivatedAt: new Date(),
        deactivatedBy: 100,
        deactivator: mockCreator,
      };
      mockRecognizedSalesService.cancel.mockResolvedValue(cancelledSales);

      // Act
      const result = await controller.cancel(1, 100);

      // Assert
      expect(result.status).toBe(RecognizedSalesStatus.CANCELLED);
      expect(result.deactivatedBy).toBe(100);
      expect(mockRecognizedSalesService.cancel).toHaveBeenCalledWith(1, 100);
    });
  });
});
