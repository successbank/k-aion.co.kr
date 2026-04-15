import { PrismaClient, BonusType, MemberGrade, QualificationType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCommissionRates() {
  console.log('🌱 보너스 설정 시드 데이터 생성 시작...');

  // 1. 판매 보너스 (SALES) - 등급별 차등
  console.log('1/6: 판매 보너스 (SALES) 생성...');
  const sales = await prisma.commissionRate.create({
    data: {
      bonusType: BonusType.SALES,
      name: 'Sales Bonus',
      nameKo: '판매 보너스',
      description: '직접 판매 시 지급되는 보너스',
      basePercentage: 25.0,
      basePv: 2000000,
      isGradeTiered: true,
      isActive: true,
      version: 1,
      tiers: {
        create: [
          {
            applicableGrade: MemberGrade.MEMBER,
            amount: 250000,
            percentage: 12.5,
            tierOrder: 1,
          },
          {
            applicableGrade: MemberGrade.AGENT,
            amount: 500000,
            percentage: 25.0,
            tierOrder: 2,
          },
          {
            applicableGrade: MemberGrade.MANAGER,
            amount: 500000,
            percentage: 25.0,
            tierOrder: 3,
          },
          {
            applicableGrade: MemberGrade.BRANCH_CHIEF,
            amount: 500000,
            percentage: 25.0,
            tierOrder: 4,
          },
          {
            applicableGrade: MemberGrade.DIVISION_CHIEF,
            amount: 500000,
            percentage: 25.0,
            tierOrder: 5,
          },
        ],
      },
      qualifications: {
        create: [
          {
            qualificationType: QualificationType.MINIMUM_GRADE,
            requiredGrade: MemberGrade.MEMBER,
          },
        ],
      },
    },
  });
  console.log(`✓ 판매 보너스 생성됨: ${sales.nameKo} (v${sales.version})`);

  // 2. 판매 관리 보너스 (SALES_MANAGEMENT)
  console.log('2/6: 판매 관리 보너스 (SALES_MANAGEMENT) 생성...');
  const salesMgmt = await prisma.commissionRate.create({
    data: {
      bonusType: BonusType.SALES_MANAGEMENT,
      name: 'Sales Management Bonus',
      nameKo: '판매 관리 보너스',
      description: '하위 회원 판매 시 추천인에게 지급되는 보너스',
      baseAmount: 150000,
      basePercentage: 7.5,
      basePv: 2000000,
      isActive: true,
      version: 1,
      qualifications: {
        create: [
          {
            qualificationType: QualificationType.MINIMUM_GRADE,
            requiredGrade: MemberGrade.AGENT,
          },
        ],
      },
    },
  });
  console.log(`✓ 판매 관리 보너스 생성됨: ${salesMgmt.nameKo} (v${salesMgmt.version})`);

  // 3. 판권 보너스 (LICENSE) - 등급별 + 차액 지급
  console.log('3/6: 판권 보너스 (LICENSE) 생성...');
  const license = await prisma.commissionRate.create({
    data: {
      bonusType: BonusType.LICENSE,
      name: 'License Bonus',
      nameKo: '판권 보너스',
      description: '하위 회원 승급 시 지급되는 보너스 (차액 지급)',
      basePercentage: 12.0,
      basePv: 2000000,
      isGradeTiered: true,
      isDifferential: true, // 차액 지급
      isActive: true,
      version: 1,
      tiers: {
        create: [
          {
            applicableGrade: MemberGrade.AGENT,
            amount: 100000,
            percentage: 5.0,
            tierOrder: 1,
          },
          {
            applicableGrade: MemberGrade.MANAGER,
            amount: 180000,
            percentage: 9.0,
            tierOrder: 2,
          },
          {
            applicableGrade: MemberGrade.BRANCH_CHIEF,
            amount: 240000,
            percentage: 12.0,
            tierOrder: 3,
          },
          {
            applicableGrade: MemberGrade.DIVISION_CHIEF,
            amount: 240000,
            percentage: 12.0,
            tierOrder: 4,
          },
        ],
      },
      qualifications: {
        create: [
          {
            qualificationType: QualificationType.TEAM_COUNT,
            requiredTeamCount: 3,
            minMembersPerTeam: 1,
          },
          {
            qualificationType: QualificationType.MIN_GRADE_COUNT,
            requiredGrade: MemberGrade.AGENT,
            requiredCount: 15, // 에이전트 15명
          },
        ],
      },
    },
  });
  console.log(`✓ 판권 보너스 생성됨: ${license.nameKo} (v${license.version})`);

  // 4. 판권관리 보너스 (LICENSE_MANAGEMENT) - 동급간, 1대만
  console.log('4/6: 판권관리 보너스 (LICENSE_MANAGEMENT) 생성...');
  const licenseMgmt = await prisma.commissionRate.create({
    data: {
      bonusType: BonusType.LICENSE_MANAGEMENT,
      name: 'License Management Bonus',
      nameKo: '판권관리 보너스',
      description: '동급 회원의 판권 보너스에 대한 관리 보너스 (1대만, 동급간)',
      basePercentage: 6.0,
      basePv: 2000000,
      isGradeTiered: true,
      isSameRankOnly: true,
      isFirstGenOnly: true,
      isActive: true,
      version: 1,
      tiers: {
        create: [
          {
            applicableGrade: MemberGrade.MANAGER,
            amount: 150000,
            percentage: 7.5,
            tierOrder: 1,
          },
          {
            applicableGrade: MemberGrade.BRANCH_CHIEF,
            amount: 140000,
            percentage: 7.0,
            tierOrder: 2,
          },
          {
            applicableGrade: MemberGrade.DIVISION_CHIEF,
            amount: 130000,
            percentage: 6.5,
            tierOrder: 3,
          },
        ],
      },
      qualifications: {
        create: [
          {
            qualificationType: QualificationType.SAME_RANK_ONLY,
          },
          {
            qualificationType: QualificationType.FIRST_GEN_ONLY,
          },
        ],
      },
    },
  });
  console.log(`✓ 판권관리 보너스 생성됨: ${licenseMgmt.nameKo} (v${licenseMgmt.version})`);

  // 5. 공유 보너스 (SHARING)
  console.log('5/6: 공유 보너스 (SHARING) 생성...');
  const sharing = await prisma.commissionRate.create({
    data: {
      bonusType: BonusType.SHARING,
      name: 'Sharing Bonus',
      nameKo: '공유 보너스',
      description: '하위 조직 판매 시 상위 지부장/본부장에게 지급되는 공유 보너스',
      baseAmount: 20000,
      basePercentage: 1.0,
      basePv: 2000000,
      isActive: true,
      version: 1,
      qualifications: {
        create: [
          {
            qualificationType: QualificationType.MINIMUM_GRADE,
            requiredGrade: MemberGrade.BRANCH_CHIEF,
          },
        ],
      },
    },
  });
  console.log(`✓ 공유 보너스 생성됨: ${sharing.nameKo} (v${sharing.version})`);

  // 6. 지정 운영 보너스 (BRANCH_OPERATION)
  console.log('6/6: 지정 운영 보너스 (BRANCH_OPERATION) 생성...');
  const branchOp = await prisma.commissionRate.create({
    data: {
      bonusType: BonusType.BRANCH_OPERATION,
      name: 'Branch Operation Bonus',
      nameKo: '지정 운영 보너스',
      description: '사무실, 세미나, 법인, TV 등 시설 운영 시 지급되는 보너스',
      baseAmount: 50000,
      basePercentage: 2.5,
      basePv: 2000000,
      isActive: true,
      version: 1,
      qualifications: {
        create: [
          {
            qualificationType: QualificationType.MINIMUM_GRADE,
            requiredGrade: MemberGrade.MANAGER,
          },
          {
            qualificationType: QualificationType.OFFICE_FACILITY,
            requiresOffice: true,
            requiresSeminar: true,
            requiresCorporation: true,
            requiresTV: true,
          },
        ],
      },
    },
  });
  console.log(`✓ 지정 운영 보너스 생성됨: ${branchOp.nameKo} (v${branchOp.version})`);

  console.log('\n✅ 보너스 설정 시드 데이터 생성 완료!');
  console.log(`총 ${6}개 보너스 유형 생성됨\n`);

  // 요약 출력
  console.log('📊 생성된 보너스 설정 요약:');
  console.log('1. 판매 보너스 (SALES): 회원 250K / 에이전트+ 500K');
  console.log('2. 판매 관리 보너스 (SALES_MANAGEMENT): 150K');
  console.log('3. 판권 보너스 (LICENSE): 100K~240K (등급별, 차액 지급)');
  console.log('4. 판권관리 보너스 (LICENSE_MANAGEMENT): 150K/140K/130K (동급간, 1대만)');
  console.log('5. 공유 보너스 (SHARING): 20K');
  console.log('6. 지정 운영 보너스 (BRANCH_OPERATION): 50K (시설 요구사항)');
}

seedCommissionRates()
  .catch((e) => {
    console.error('❌ 시드 데이터 생성 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
