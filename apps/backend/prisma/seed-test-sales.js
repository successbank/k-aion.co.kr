const { PrismaClient, SaleStatus, SettlementStatus, MemberGrade } = require('@prisma/client');

const prisma = new PrismaClient();

// ISO 주차 계산 함수
function getISOWeekCode(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-${String(weekNo).padStart(2, '0')}`;
}

// ISO 주차 코드에서 시작일/종료일 계산
function getWeekDates(weekCode) {
  const [year, week] = weekCode.split('-').map(Number);

  // ISO 8601 Week 1: 첫 목요일이 속한 주
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1); // 월요일로 이동

  // 해당 주차의 시작일 (월요일)
  const startDate = new Date(startOfWeek1);
  startDate.setDate(startOfWeek1.getDate() + (week - 1) * 7);

  // 해당 주차의 종료일 (일요일)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return { startDate, endDate };
}

// 날짜 범위에서 무작위 날짜 생성
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🌱 테스트 판매 데이터 생성 시작...\n');

  // 기존 판매 및 정산 데이터 삭제
  console.log('🗑️  기존 판매 및 정산 데이터 삭제...');
  await prisma.sale.deleteMany();
  console.log('  - Sale 삭제 완료');
  await prisma.settlement.deleteMany();
  console.log('  - Settlement 삭제 완료\n');

  // 회원 및 제품 조회
  console.log('📥 회원 및 제품 데이터 조회...');
  const members = await prisma.member.findMany({
    where: { isActive: true },
  });
  const products = await prisma.product.findMany({
    where: { isActive: true },
  });

  console.log(`  - 활성 회원: ${members.length}명`);
  console.log(`  - 활성 제품: ${products.length}개\n`);

  // 무작위 40-50명 선택
  const sellerCount = Math.floor(Math.random() * 11) + 40; // 40-50
  const shuffled = members.sort(() => 0.5 - Math.random());
  const sellers = shuffled.slice(0, sellerCount);

  console.log(`💰 ${sellers.length}명의 회원에게 판매 데이터 생성...\n`);

  // 날짜 범위: 최근 2주 (2024-12-28 ~ 2025-01-11)
  const startDate = new Date('2024-12-28');
  const endDate = new Date('2025-01-11');

  // 정산 주차 수집
  const weekCodes = new Set();
  const sales = [];
  let saleCounter = 1;

  // 각 판매자마다 1-5건의 판매 생성
  for (const seller of sellers) {
    const saleCount = Math.floor(Math.random() * 5) + 1; // 1-5

    for (let i = 0; i < saleCount; i++) {
      // 무작위 제품 선택
      const product = products[Math.floor(Math.random() * products.length)];

      // 무작위 수량 (1-3)
      const quantity = Math.floor(Math.random() * 3) + 1;

      // 판매일
      const saleDate = randomDate(startDate, endDate);
      const weekCode = getISOWeekCode(saleDate);
      weekCodes.add(weekCode);

      // 판매 코드 생성 (SALE-YYYYMMDD-XXXX 형식)
      const dateStr = saleDate.toISOString().slice(0, 10).replace(/-/g, '');
      const saleCode = `SALE-${dateStr}-${String(saleCounter).padStart(4, '0')}`;
      saleCounter++;

      // 판매 데이터 생성
      const sale = await prisma.sale.create({
        data: {
          saleCode,
          sellerId: seller.id,
          productId: product.id,
          quantity,
          unitPrice: product.price,
          totalPrice: product.price * quantity,
          unitPv: product.pv,
          totalPv: product.pv * quantity,
          soldAt: saleDate,
          weekCode,
          status: SaleStatus.CONFIRMED,
        },
      });

      sales.push(sale);

      // PV 누적
      await prisma.member.update({
        where: { id: seller.id },
        data: {
          cumulativePv: {
            increment: product.pv * quantity,
          },
        },
      });

      console.log(
        `  ✓ ${seller.name} → ${product.name} × ${quantity}개 (${(product.price * quantity).toLocaleString()}원, ${(product.pv * quantity).toLocaleString()} PV) [${weekCode}]`,
      );
    }
  }

  console.log(`\n✅ 총 ${sales.length}건의 판매 데이터 생성 완료\n`);

  // PV 1,000,000 이상 회원 AGENT 승급
  console.log('📈 누적 PV 기준 자동 승급 처리...');
  const promotionCandidates = await prisma.member.findMany({
    where: {
      cumulativePv: { gte: 1000000 },
      grade: MemberGrade.MEMBER,
      isActive: true,
    },
  });

  for (const candidate of promotionCandidates) {
    await prisma.member.update({
      where: { id: candidate.id },
      data: {
        grade: MemberGrade.AGENT,
        agentPromotedAt: new Date(),
      },
    });
    console.log(
      `  ✓ ${candidate.name} → AGENT 승급 (누적 PV: ${candidate.cumulativePv.toLocaleString()})`,
    );
  }

  console.log(`\n✅ ${promotionCandidates.length}명 AGENT 승급 완료\n`);

  // Settlement 생성
  console.log('📅 정산 기간 생성...');
  const weekCodesArray = Array.from(weekCodes).sort();

  for (const weekCode of weekCodesArray) {
    // 해당 주차의 판매 통계
    const weekSales = await prisma.sale.aggregate({
      where: { weekCode, status: SaleStatus.CONFIRMED },
      _sum: {
        totalPrice: true,
        totalPv: true,
      },
      _count: {
        id: true,
      },
    });

    // 주차 시작일/종료일 계산
    const { startDate, endDate } = getWeekDates(weekCode);

    await prisma.settlement.create({
      data: {
        weekCode,
        startDate,
        endDate,
        status: SettlementStatus.OPEN,
        totalSales: weekSales._sum.totalPrice || 0,
        totalPv: weekSales._sum.totalPv || 0,
        totalBonuses: 0, // 보너스는 아직 계산 안됨
      },
    });

    console.log(
      `  ✓ ${weekCode} 정산: 판매 ${weekSales._count.id}건, 금액 ${(weekSales._sum.totalPrice || 0).toLocaleString()}원, PV ${(weekSales._sum.totalPv || 0).toLocaleString()}`,
    );
  }

  console.log(`\n✅ ${weekCodesArray.length}주차 정산 기간 생성 완료\n`);

  // 최종 통계
  console.log('📊 최종 통계:');

  const totalSales = await prisma.sale.count();
  const totalAmount = await prisma.sale.aggregate({
    _sum: { totalPrice: true, totalPv: true },
  });
  const agentCount = await prisma.member.count({
    where: { grade: MemberGrade.AGENT },
  });

  console.log(`  - 총 판매 건수: ${totalSales}건`);
  console.log(`  - 총 판매 금액: ${(totalAmount._sum.totalPrice || 0).toLocaleString()}원`);
  console.log(`  - 총 PV: ${(totalAmount._sum.totalPv || 0).toLocaleString()}`);
  console.log(`  - AGENT 회원 수: ${agentCount}명`);
  console.log(`  - 정산 주차: ${weekCodesArray.length}주차\n`);

  console.log('✨ 테스트 판매 데이터 생성 완료!\n');
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
