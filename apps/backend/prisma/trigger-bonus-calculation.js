const { PrismaClient, BonusType, BonusStatus, MemberGrade } = require('@prisma/client');

const prisma = new PrismaClient();

// 보너스 금액 (Fallback - DB 설정이 없을 때 사용)
const BONUS_AMOUNTS = {
  SALES: 500000, // 판매 보너스
  SALES_MANAGEMENT: 150000, // 판매 관리 보너스
  SHARING: 20000, // 공유 보너스
};

// 상위 라인 조회 (추천계보 기준)
async function findUplineLeaders(memberId, maxDepth = 20) {
  const leaders = [];
  let currentId = memberId;
  let depth = 0;

  while (currentId && depth < maxDepth) {
    const member = await prisma.member.findUnique({
      where: { id: currentId },
      select: {
        id: true,
        name: true,
        grade: true,
        recommenderId: true,
      },
    });

    if (!member || !member.recommenderId) break;

    // BRANCH_CHIEF 또는 DIVISION_CHIEF만 수집
    if (member.grade === MemberGrade.BRANCH_CHIEF || member.grade === MemberGrade.DIVISION_CHIEF) {
      leaders.push({
        id: member.id,
        name: member.name,
        grade: member.grade,
      });
    }

    currentId = member.recommenderId;
    depth++;
  }

  return leaders;
}

async function main() {
  console.log('🌱 수당 계산 시작...\n');

  // 기존 보너스 데이터 삭제
  console.log('🗑️  기존 보너스 데이터 삭제...');
  await prisma.bonus.deleteMany();
  console.log('  - Bonus 삭제 완료\n');

  // CONFIRMED 상태의 모든 판매 조회
  console.log('📥 CONFIRMED 판매 데이터 조회...');
  const sales = await prisma.sale.findMany({
    where: { status: 'CONFIRMED' },
    include: {
      seller: {
        include: {
          recommender: true,
        },
      },
      product: true,
    },
    orderBy: { soldAt: 'asc' },
  });

  console.log(`  - 총 ${sales.length}건의 판매 데이터 발견\n`);

  // 보너스 통계
  const bonusStats = {
    SALES: 0,
    SALES_MANAGEMENT: 0,
    SHARING: 0,
    totalAmount: 0,
  };

  console.log('💰 보너스 계산 및 생성...\n');

  for (const sale of sales) {
    const bonuses = [];

    // 1. SALES 보너스 (판매자에게)
    const salesBonus = {
      memberId: sale.sellerId,
      saleId: sale.id,
      bonusType: BonusType.SALES,
      amount: BONUS_AMOUNTS.SALES,
      weekCode: sale.weekCode,
      status: BonusStatus.PENDING,
      calculationBasis: JSON.stringify({
        type: 'SALES',
        saleCode: sale.saleCode,
        sellerName: sale.seller.name,
      }),
    };
    bonuses.push(salesBonus);
    bonusStats.SALES++;
    bonusStats.totalAmount += BONUS_AMOUNTS.SALES;

    // 2. SALES_MANAGEMENT 보너스 (추천인에게)
    if (sale.seller.recommender) {
      const salesMgmtBonus = {
        memberId: sale.seller.recommender.id,
        saleId: sale.id,
        bonusType: BonusType.SALES_MANAGEMENT,
        amount: BONUS_AMOUNTS.SALES_MANAGEMENT,
        weekCode: sale.weekCode,
        status: BonusStatus.PENDING,
        calculationBasis: JSON.stringify({
          type: 'SALES_MANAGEMENT',
          saleCode: sale.saleCode,
          sellerName: sale.seller.name,
          recommenderName: sale.seller.recommender.name,
        }),
      };
      bonuses.push(salesMgmtBonus);
      bonusStats.SALES_MANAGEMENT++;
      bonusStats.totalAmount += BONUS_AMOUNTS.SALES_MANAGEMENT;
    }

    // 3. SHARING 보너스 (상위 BRANCH_CHIEF/DIVISION_CHIEF에게)
    const uplineLeaders = await findUplineLeaders(sale.sellerId);

    for (const leader of uplineLeaders) {
      const sharingBonus = {
        memberId: leader.id,
        saleId: sale.id,
        bonusType: BonusType.SHARING,
        amount: BONUS_AMOUNTS.SHARING,
        weekCode: sale.weekCode,
        status: BonusStatus.PENDING,
        calculationBasis: JSON.stringify({
          type: 'SHARING',
          saleCode: sale.saleCode,
          sellerName: sale.seller.name,
          leaderName: leader.name,
          leaderGrade: leader.grade,
        }),
      };
      bonuses.push(sharingBonus);
      bonusStats.SHARING++;
      bonusStats.totalAmount += BONUS_AMOUNTS.SHARING;
    }

    // 보너스 일괄 생성
    for (const bonus of bonuses) {
      await prisma.bonus.create({ data: bonus });
    }

    console.log(
      `  ✓ ${sale.saleCode} (${sale.seller.name}) → ${bonuses.length}개 보너스 생성 (판매: ${BONUS_AMOUNTS.SALES.toLocaleString()}원${sale.seller.recommender ? `, 추천: ${BONUS_AMOUNTS.SALES_MANAGEMENT.toLocaleString()}원` : ''}${uplineLeaders.length > 0 ? `, 공유: ${uplineLeaders.length}명×${BONUS_AMOUNTS.SHARING.toLocaleString()}원` : ''})`,
    );
  }

  console.log('\n✅ 모든 보너스 생성 완료\n');

  // 통계 출력
  console.log('📊 보너스 타입별 통계:');
  console.log(
    `  - SALES (판매 보너스): ${bonusStats.SALES}건, ${(bonusStats.SALES * BONUS_AMOUNTS.SALES).toLocaleString()}원`,
  );
  console.log(
    `  - SALES_MANAGEMENT (판매 관리): ${bonusStats.SALES_MANAGEMENT}건, ${(bonusStats.SALES_MANAGEMENT * BONUS_AMOUNTS.SALES_MANAGEMENT).toLocaleString()}원`,
  );
  console.log(
    `  - SHARING (공유 보너스): ${bonusStats.SHARING}건, ${(bonusStats.SHARING * BONUS_AMOUNTS.SHARING).toLocaleString()}원`,
  );
  console.log(`  - 총 보너스 금액: ${bonusStats.totalAmount.toLocaleString()}원\n`);

  // 회원별 보너스 TOP 10
  console.log('🏆 회원별 보너스 합계 TOP 10:');
  const topBonuses = await prisma.bonus.groupBy({
    by: ['memberId'],
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _sum: {
        amount: 'desc',
      },
    },
    take: 10,
  });

  for (const [index, item] of topBonuses.entries()) {
    const member = await prisma.member.findUnique({
      where: { id: item.memberId },
      select: { name: true, grade: true },
    });
    console.log(
      `  ${index + 1}. ${member.name} (${member.grade}) → ${item._count.id}건, ${item._sum.amount.toLocaleString()}원`,
    );
  }

  console.log('\n📅 주차별 보너스 통계:');
  const weeklyBonuses = await prisma.bonus.groupBy({
    by: ['weekCode'],
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      weekCode: 'asc',
    },
  });

  for (const week of weeklyBonuses) {
    console.log(`  ${week.weekCode}: ${week._count.id}건, ${week._sum.amount.toLocaleString()}원`);

    // Settlement에 보너스 합계 업데이트
    await prisma.settlement.updateMany({
      where: { weekCode: week.weekCode },
      data: {
        totalBonuses: week._sum.amount,
      },
    });
  }

  console.log('\n✅ Settlement 테이블 업데이트 완료\n');

  // 최종 검증
  console.log('🔍 최종 검증:');
  const totalBonuses = await prisma.bonus.count();
  const totalAmount = await prisma.bonus.aggregate({
    _sum: { amount: true },
  });

  console.log(`  - 총 보너스 건수: ${totalBonuses}건`);
  console.log(`  - 총 보너스 금액: ${totalAmount._sum.amount.toLocaleString()}원\n`);

  console.log('✨ 수당 계산 완료!\n');
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
