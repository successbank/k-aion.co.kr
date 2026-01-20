import { Test, TestingModule } from '@nestjs/testing';
import { BonusCalculatorService } from './bonus-calculator.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GenealogyService } from '../../members/genealogy.service';
import { CommissionRatesService } from '../../commission-rates/commission-rates.service';
import { RecognizedSalesService } from '../../recognized-sales/recognized-sales.service';
import { MemberGrade, RecognizedSalesStatus, TreeType, BonusType } from '@prisma/client';

/**
 * 보너스 계산기와 인정매출 연동 테스트
 *
 * SHARING 보너스는 매니저 이상 등급만 받을 수 있으며,
 * 인정매출 기능을 통해 AGENT도 MANAGER 인정을 받으면 자격을 얻을 수 있습니다.
 */
describe('BonusCalculatorService - 인정매출 연동', () => {
  let service: BonusCalculatorService;
  let recognizedSalesService: RecognizedSalesService;

  // Mock 데이터
  const mockAgentMember = {
    id: 1,
    username: 'agent1',
    name: '에이전트회원',
    grade: MemberGrade.AGENT,
  };

  const mockManagerMember = {
    id: 2,
    username: 'manager1',
    name: '매니저회원',
    grade: MemberGrade.MANAGER,
  };

  const mockBranchChiefMember = {
    id: 3,
    username: 'branchChief1',
    name: '지부장회원',
    grade: MemberGrade.BRANCH_CHIEF,
  };

  const mockBonus = {
    id: 1,
    memberId: 1,
    bonusType: 'SHARING',
    amount: 20000,
    description: '공유 보너스',
    weekCode: '2025-W01',
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock Services
  const mockPrismaService = {
    member: {
      findUnique: jest.fn(),
    },
    bonus: {
      create: jest.fn(),
    },
    cultivationRecord: {
      findUnique: jest.fn(),
    },
  };

  const mockGenealogyService = {
    getTeamGradeStatisticsForQualification: jest.fn(),
  };

  const mockCommissionRatesService = {
    findActiveByBonusType: jest.fn(),
  };

  const mockRecognizedSalesService = {
    getEffectiveGrade: jest.fn(),
    getActiveRecognition: jest.fn(),
    hasActiveLicenseRecognition: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BonusCalculatorService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: GenealogyService, useValue: mockGenealogyService },
        { provide: CommissionRatesService, useValue: mockCommissionRatesService },
        { provide: RecognizedSalesService, useValue: mockRecognizedSalesService },
      ],
    }).compile();

    service = module.get<BonusCalculatorService>(BonusCalculatorService);
    recognizedSalesService = module.get<RecognizedSalesService>(RecognizedSalesService);

    jest.clearAllMocks();

    // 기본 수당률 설정 (fallback to 20000)
    mockCommissionRatesService.findActiveByBonusType.mockResolvedValue(null);
  });

  describe('SHARING Bonus with Recognition (공유 보너스 인정매출 연동)', () => {
    it('AGENT에게 MANAGER 인정 → SHARING 보너스 자격 획득', async () => {
      // Arrange: AGENT가 MANAGER 인정을 받은 상태
      mockPrismaService.member.findUnique.mockResolvedValue(mockAgentMember);
      // 유효 등급이 MANAGER로 반환됨 (인정매출 적용)
      mockRecognizedSalesService.getEffectiveGrade.mockResolvedValue(MemberGrade.MANAGER);
      mockPrismaService.bonus.create.mockResolvedValue(mockBonus);

      // Act
      const result = await service.calculateSharingBonus(1, '2025-W01');

      // Assert: 보너스가 정상 생성됨
      expect(result).toBeDefined();
      expect(result.amount).toBe(20000);
      expect(mockRecognizedSalesService.getEffectiveGrade).toHaveBeenCalledWith(1);
      expect(mockPrismaService.bonus.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            memberId: 1,
            bonusType: 'SHARING',
          }),
        }),
      );
    });

    it('인정 만료 후 → SHARING 보너스 자격 상실 (에러 발생)', async () => {
      // Arrange: AGENT의 인정이 만료되어 실제 등급(AGENT)만 유효
      mockPrismaService.member.findUnique.mockResolvedValue(mockAgentMember);
      // 인정 만료 → 실제 등급 AGENT 반환
      mockRecognizedSalesService.getEffectiveGrade.mockResolvedValue(MemberGrade.AGENT);

      // Act & Assert: 매니저 이상만 가능하므로 에러 발생
      await expect(service.calculateSharingBonus(1, '2025-W01')).rejects.toThrow(
        '공유 보너스는 매니저 이상만 받을 수 있습니다',
      );
      expect(mockPrismaService.bonus.create).not.toHaveBeenCalled();
    });

    it('인정 취소 후 → SHARING 보너스 자격 상실 (에러 발생)', async () => {
      // Arrange: AGENT의 인정이 취소됨 (CANCELLED)
      mockPrismaService.member.findUnique.mockResolvedValue(mockAgentMember);
      // 인정 취소 → 실제 등급 AGENT 반환
      mockRecognizedSalesService.getEffectiveGrade.mockResolvedValue(MemberGrade.AGENT);

      // Act & Assert: 매니저 이상만 가능하므로 에러 발생
      await expect(service.calculateSharingBonus(1, '2025-W01')).rejects.toThrow(
        '공유 보너스는 매니저 이상만 받을 수 있습니다',
      );
    });

    it('실제 등급 > 인정 등급 → 실제 등급 사용', async () => {
      // Arrange: 지부장(BRANCH_CHIEF)이 MANAGER 인정을 받았으나 실제 등급이 더 높음
      mockPrismaService.member.findUnique.mockResolvedValue(mockBranchChiefMember);
      // 지부장(실제) > 매니저(인정) → 지부장 등급 반환
      mockRecognizedSalesService.getEffectiveGrade.mockResolvedValue(MemberGrade.BRANCH_CHIEF);
      const branchChiefBonus = { ...mockBonus, memberId: 3 };
      mockPrismaService.bonus.create.mockResolvedValue(branchChiefBonus);

      // Act
      const result = await service.calculateSharingBonus(3, '2025-W01');

      // Assert: 실제 등급(지부장)으로 보너스 자격 판정 → 성공
      expect(result).toBeDefined();
      expect(mockRecognizedSalesService.getEffectiveGrade).toHaveBeenCalledWith(3);
      // 지부장은 eligibleGrades에 포함되므로 성공
      expect(mockPrismaService.bonus.create).toHaveBeenCalled();
    });
  });

  // ============================================================
  // 시나리오 14-20: LICENSE 보너스 인정판권 연동 테스트
  // ============================================================
  describe('LICENSE Bonus with License Recognition (판권 보너스 인정판권 연동)', () => {
    // CultivationRecord Mock 데이터
    const mockCultivationRecord = {
      id: 1,
      cultivatorId: 1,
      cultivatedMemberId: 10,
      achievedGrade: MemberGrade.MANAGER,
      treeType: TreeType.SPONSOR,
      teamNumber: 1,
      achievedAt: new Date(),
      cultivator: mockAgentMember,
      cultivatedMember: {
        id: 10,
        username: 'cultivated1',
        name: '피양성자',
        grade: MemberGrade.MANAGER,
      },
    };

    // 팀 통계 Mock - 조건 미달 (2팀만 있음)
    const mockTeamStatsInsufficient = {
      teams: [
        { teamLine: 1, agentCount: 3, managerCount: 0, branchChiefCount: 0, divisionChiefCount: 0 },
        { teamLine: 2, agentCount: 2, managerCount: 0, branchChiefCount: 0, divisionChiefCount: 0 },
      ],
      totals: { agentCount: 5, managerCount: 0, branchChiefCount: 0, divisionChiefCount: 0 },
    };

    // 팀 통계 Mock - 조건 충족 (3팀, 에이전트 합 15명 이상)
    const mockTeamStatsSufficient = {
      teams: [
        { teamLine: 1, agentCount: 5, managerCount: 0, branchChiefCount: 0, divisionChiefCount: 0 },
        { teamLine: 2, agentCount: 5, managerCount: 0, branchChiefCount: 0, divisionChiefCount: 0 },
        { teamLine: 3, agentCount: 5, managerCount: 0, branchChiefCount: 0, divisionChiefCount: 0 },
      ],
      totals: { agentCount: 15, managerCount: 0, branchChiefCount: 0, divisionChiefCount: 0 },
    };

    // LICENSE 보너스 Mock 데이터
    const mockLicenseBonus = {
      id: 2,
      memberId: 1,
      bonusType: BonusType.LICENSE,
      amount: 150000,
      description: '판권 보너스 - 매니저 승급',
      weekCode: '2025-W01',
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 시나리오 14: 인정판권 있음 → 팀 조건 우회
    it('시나리오 14: MANAGER 인정판권 있음 + 2팀만 있음 → qualified=true (팀 조건 무시)', async () => {
      // Arrange: 인정판권 있음 → 팀 조건 우회
      mockPrismaService.cultivationRecord.findUnique.mockResolvedValue(mockCultivationRecord);
      mockRecognizedSalesService.hasActiveLicenseRecognition.mockResolvedValue(true);
      mockPrismaService.bonus.create.mockResolvedValue(mockLicenseBonus);

      // Act
      const result = await service.calculateLicenseBonus(1);

      // Assert: 팀 조건 검사 없이 보너스 생성
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(150000);
      expect(mockRecognizedSalesService.hasActiveLicenseRecognition).toHaveBeenCalledWith(1, MemberGrade.MANAGER);
      // 팀 통계 조회는 하지 않음 (인정판권으로 우회)
      expect(mockGenealogyService.getTeamGradeStatisticsForQualification).not.toHaveBeenCalled();
    });

    // 시나리오 15: 인정판권 없음 + 팀 조건 미달
    it('시나리오 15: 인정판권 없음 + 2팀만 있음 → qualified=false (에러 발생)', async () => {
      // Arrange: 인정판권 없음, 팀 조건 미달
      mockPrismaService.cultivationRecord.findUnique.mockResolvedValue(mockCultivationRecord);
      mockRecognizedSalesService.hasActiveLicenseRecognition.mockResolvedValue(false);
      mockGenealogyService.getTeamGradeStatisticsForQualification.mockResolvedValue(mockTeamStatsInsufficient);

      // Act & Assert
      await expect(service.calculateLicenseBonus(1)).rejects.toThrow('자격 조건 미달');
      expect(mockRecognizedSalesService.hasActiveLicenseRecognition).toHaveBeenCalledWith(1, MemberGrade.MANAGER);
      expect(mockGenealogyService.getTeamGradeStatisticsForQualification).toHaveBeenCalledWith(1);
    });

    // 시나리오 16: 인정판권 없음 + 팀 조건 충족
    it('시나리오 16: 인정판권 없음 + 3팀 + 에이전트 15명 → qualified=true', async () => {
      // Arrange: 인정판권 없음, 팀 조건 충족
      mockPrismaService.cultivationRecord.findUnique.mockResolvedValue(mockCultivationRecord);
      mockRecognizedSalesService.hasActiveLicenseRecognition.mockResolvedValue(false);
      mockGenealogyService.getTeamGradeStatisticsForQualification.mockResolvedValue(mockTeamStatsSufficient);
      mockPrismaService.bonus.create.mockResolvedValue(mockLicenseBonus);

      // Act
      const result = await service.calculateLicenseBonus(1);

      // Assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(150000);
      expect(mockRecognizedSalesService.hasActiveLicenseRecognition).toHaveBeenCalled();
      expect(mockGenealogyService.getTeamGradeStatisticsForQualification).toHaveBeenCalled();
    });

    // 시나리오 17: BRANCH_CHIEF 인정판권 우회
    it('시나리오 17: BRANCH_CHIEF 인정판권 + 각팀 매니저 부족 → qualified=true (팀 조건 우회)', async () => {
      // Arrange: 지부장 육성 기록
      const branchChiefCultivationRecord = {
        ...mockCultivationRecord,
        achievedGrade: MemberGrade.BRANCH_CHIEF,
        cultivatedMember: { ...mockCultivationRecord.cultivatedMember, grade: MemberGrade.BRANCH_CHIEF },
      };
      mockPrismaService.cultivationRecord.findUnique.mockResolvedValue(branchChiefCultivationRecord);
      mockRecognizedSalesService.hasActiveLicenseRecognition.mockResolvedValue(true);
      const branchChiefBonus = { ...mockLicenseBonus, amount: 200000 };
      mockPrismaService.bonus.create.mockResolvedValue(branchChiefBonus);

      // Act
      const result = await service.calculateLicenseBonus(1);

      // Assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(200000);
      expect(mockRecognizedSalesService.hasActiveLicenseRecognition).toHaveBeenCalledWith(1, MemberGrade.BRANCH_CHIEF);
      expect(mockGenealogyService.getTeamGradeStatisticsForQualification).not.toHaveBeenCalled();
    });

    // 시나리오 18: DIVISION_CHIEF 인정판권 우회
    it('시나리오 18: DIVISION_CHIEF 인정판권 + 각팀 지부장 부족 → qualified=true (팀 조건 우회)', async () => {
      // Arrange: 본부장 육성 기록
      const divisionChiefCultivationRecord = {
        ...mockCultivationRecord,
        achievedGrade: MemberGrade.DIVISION_CHIEF,
        cultivatedMember: { ...mockCultivationRecord.cultivatedMember, grade: MemberGrade.DIVISION_CHIEF },
      };
      mockPrismaService.cultivationRecord.findUnique.mockResolvedValue(divisionChiefCultivationRecord);
      mockRecognizedSalesService.hasActiveLicenseRecognition.mockResolvedValue(true);
      const divisionChiefBonus = { ...mockLicenseBonus, amount: 240000 };
      mockPrismaService.bonus.create.mockResolvedValue(divisionChiefBonus);

      // Act
      const result = await service.calculateLicenseBonus(1);

      // Assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(240000);
      expect(mockRecognizedSalesService.hasActiveLicenseRecognition).toHaveBeenCalledWith(1, MemberGrade.DIVISION_CHIEF);
      expect(mockGenealogyService.getTeamGradeStatisticsForQualification).not.toHaveBeenCalled();
    });

    // 시나리오 19: 인정판권 만료 후 팀 조건 검증
    it('시나리오 19: 인정판권 만료 + 팀 조건 미달 → qualified=false (에러 발생)', async () => {
      // Arrange: 인정판권 만료됨 (false 반환), 팀 조건 미달
      mockPrismaService.cultivationRecord.findUnique.mockResolvedValue(mockCultivationRecord);
      mockRecognizedSalesService.hasActiveLicenseRecognition.mockResolvedValue(false); // 만료됨
      mockGenealogyService.getTeamGradeStatisticsForQualification.mockResolvedValue(mockTeamStatsInsufficient);

      // Act & Assert
      await expect(service.calculateLicenseBonus(1)).rejects.toThrow('자격 조건 미달');
      // 만료된 인정판권이므로 팀 조건 검증 수행
      expect(mockRecognizedSalesService.hasActiveLicenseRecognition).toHaveBeenCalled();
      expect(mockGenealogyService.getTeamGradeStatisticsForQualification).toHaveBeenCalled();
    });

    // 시나리오 20: calculateLicenseBonus 전체 흐름
    it('시나리오 20: 인정판권으로 LICENSE 보너스 생성 전체 흐름', async () => {
      // Arrange: 전체 흐름 - 인정판권으로 팀 조건 우회하여 보너스 생성
      mockPrismaService.cultivationRecord.findUnique.mockResolvedValue(mockCultivationRecord);
      mockRecognizedSalesService.hasActiveLicenseRecognition.mockResolvedValue(true);
      mockPrismaService.bonus.create.mockResolvedValue(mockLicenseBonus);

      // Act
      const result = await service.calculateLicenseBonus(1);

      // Assert: 전체 흐름 검증
      // 1. CultivationRecord 조회
      expect(mockPrismaService.cultivationRecord.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { cultivator: true, cultivatedMember: true },
      });
      // 2. 인정판권 확인
      expect(mockRecognizedSalesService.hasActiveLicenseRecognition).toHaveBeenCalledWith(1, MemberGrade.MANAGER);
      // 3. 팀 조건 검사 우회 (호출 안 됨)
      expect(mockGenealogyService.getTeamGradeStatisticsForQualification).not.toHaveBeenCalled();
      // 4. 보너스 생성
      expect(mockPrismaService.bonus.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            memberId: 1,
            bonusType: BonusType.LICENSE,
            amount: 150000,
            status: 'PENDING',
          }),
        }),
      );
      // 5. 결과 검증
      expect(result).not.toBeNull();
      expect(result!.bonusType).toBe(BonusType.LICENSE);
      expect(result!.amount).toBe(150000);
    });
  });
});
