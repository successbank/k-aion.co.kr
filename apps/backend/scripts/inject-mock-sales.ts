/**
 * Kaion MLM 대규모 목업 판매 주입 스크립트
 *
 * DB-First 원칙: 제품/회원/수당매트릭스 모두 DB 조회
 * 비즈니스 로직 재현: Sale + Bonus(본인+상위라인) + PV누적 + 재고차감
 *
 * 사용법:
 *   npx ts-node scripts/inject-mock-sales.ts [--total=5000000000] [--min-daily=20000000] [--days=251]
 */
import { PrismaClient, MemberGrade, SaleStatus, BonusType, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ─── 알고리즘 파라미터 (env/CLI, 하드코딩 아님) ───
function parseArgs() {
  const args: Record<string, string> = {};
  process.argv.slice(2).forEach((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    if (k && v) args[k] = v;
  });
  return {
    TOTAL_TARGET: Number(args['total'] || process.env.MOCK_TOTAL || 5_000_000_000),
    MIN_DAILY: Number(args['min-daily'] || process.env.MOCK_MIN_DAILY || 20_000_000),
    DAYS: Number(args['days'] || process.env.MOCK_DAYS || 251),
  };
}

const PRODUCT_MIX: Record<string, number> = {
  'MED-001': 0.60,
  'MED-002': 0.22,
  'MED-003': 0.13,
  'MED-ACC-001': 0.03,
  'MED-ACC-002': 0.02,
};

// ─── 유틸리티 ───
function subDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - n);
  return r;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function isSaturday(d: Date): boolean { return d.getDay() === 6; }
function isSunday(d: Date): boolean { return d.getDay() === 0; }

function calculateWeekCode(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const weekNumber = Math.ceil(dayOfYear / 7);
  return `${year}-${String(weekNumber).padStart(2, '0')}`;
}

function getBonusTypeForGrade(grade: MemberGrade): BonusType {
  if (grade === MemberGrade.SALESPERSON || grade === MemberGrade.TEAM_LEADER) {
    return BonusType.SALES_COMMISSION;
  }
  return BonusType.EDUCATION_MANAGEMENT;
}

function getBonusTypeKorean(bt: BonusType): string {
  return bt === BonusType.SALES_COMMISSION ? '판매 수수료' : '교육 관리';
}

function gaussian(mean: number, stddev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stddev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function fmt(n: number): string {
  return n.toLocaleString('ko-KR');
}

// ─── 메인 ───
async function main() {
  const { TOTAL_TARGET, MIN_DAILY, DAYS } = parseArgs();
  const BATCH_ID = `MOCK-${formatDate(new Date())}`;
  const START = subDays(new Date(), DAYS - 1);

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Kaion 목업 판매 주입                        ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  목표 총매출: ${fmt(TOTAL_TARGET)}원`);
  console.log(`║  일 하한:     ${fmt(MIN_DAILY)}원`);
  console.log(`║  기간:        ${formatDate(START)} ~ ${formatDate(new Date())} (${DAYS}일)`);
  console.log(`║  배치 ID:     ${BATCH_ID}`);
  console.log('╚══════════════════════════════════════════════╝\n');

  // ── DB-First 조회 ──
  console.log('[1/6] DB 데이터 로딩...');
  const admin = await prisma.member.findFirst({ where: { grade: MemberGrade.ADMIN, deletedAt: null } });
  if (!admin) throw new Error('ADMIN 없음');

  const products = await prisma.product.findMany({ where: { isActive: true, deletedAt: null } });
  if (products.length === 0) throw new Error('활성 제품 없음');

  const rates = await prisma.productCommissionRate.findMany({ where: { isActive: true } });
  const rateMap = new Map<string, number>();
  rates.forEach((r) => rateMap.set(`${r.productId}-${r.recipientGrade}`, r.amount));

  const productByCode = new Map(products.map((p) => [p.code, p]));

  const sellers = await prisma.member.findMany({
    where: {
      grade: { in: [MemberGrade.SALESPERSON, MemberGrade.TEAM_LEADER] },
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, grade: true, name: true, sponsorId: true },
  });
  if (sellers.length === 0) throw new Error('판매자(SP/TL) 없음');

  const existingMockSales = await prisma.sale.count({ where: { description: { startsWith: 'MOCK-' } } });
  if (existingMockSales > 0) {
    console.log(`⚠ 이미 MOCK 판매 ${existingMockSales}건 존재. 중복 생성 방지를 위해 종료합니다.`);
    console.log('  롤백 후 재실행하세요: npx ts-node scripts/rollback-mock.ts');
    return;
  }

  console.log(`  Admin: ${admin.id} | 제품: ${products.length}종 | 수당률: ${rates.length}행 | 판매자: ${sellers.length}명`);

  // ── 후원 계보 캐시 ──
  console.log('[2/6] 후원 계보 캐시 구축...');
  const uplineCache = new Map<number, Array<{ id: number; grade: MemberGrade; name: string }>>();

  async function getUpline(memberId: number) {
    if (uplineCache.has(memberId)) return uplineCache.get(memberId)!;
    const result: Array<{ id: number; grade: MemberGrade; name: string }> = [];
    let currentId = memberId;
    for (let depth = 0; depth < 100; depth++) {
      const member = await prisma.member.findUnique({
        where: { id: currentId },
        select: { sponsorId: true },
      });
      if (!member?.sponsorId) break;
      const sponsor = await prisma.member.findUnique({
        where: { id: member.sponsorId },
        select: { id: true, grade: true, name: true },
      });
      if (!sponsor) break;
      result.push(sponsor);
      if (sponsor.grade === MemberGrade.ADMIN) break;
      currentId = sponsor.id;
    }
    uplineCache.set(memberId, result);
    return result;
  }

  for (const s of sellers) {
    await getUpline(s.id);
  }
  console.log(`  ${uplineCache.size}명 캐시 완료`);

  // ── 재고 충전 ──
  console.log('[3/6] 재고 충전...');
  const estimatedTotalSales = Math.ceil(TOTAL_TARGET / 200_000);
  for (const p of products) {
    const mix = PRODUCT_MIX[p.code] || 0.01;
    const needed = Math.ceil(estimatedTotalSales * mix * 1.2);
    const deficit = needed - p.stock;
    if (deficit > 0) {
      await prisma.product.update({
        where: { id: p.id },
        data: { stock: { increment: deficit } },
      });
      console.log(`  ${p.code}: +${deficit} (${p.stock} → ${p.stock + deficit})`);
    } else {
      console.log(`  ${p.code}: 충분 (${p.stock})`);
    }
  }

  const updatedProducts = await prisma.product.findMany({ where: { isActive: true, deletedAt: null } });
  const stockMap = new Map(updatedProducts.map((p) => [p.id, p.stock]));

  // ── 판매 코드 시퀀스 ──
  const now = new Date();
  const datePrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const lastSale = await prisma.sale.findFirst({
    where: { saleCode: { startsWith: `SALE-${datePrefix}` } },
    orderBy: { saleCode: 'desc' },
  });
  let saleSeq = lastSale ? parseInt(lastSale.saleCode.split('-').pop() || '0') : 0;

  // ── 메인 루프 ──
  console.log('[4/6] 판매 주입 시작...\n');

  let cumulativeTotal = 0;
  let totalSalesCreated = 0;
  let totalBonusesCreated = 0;
  let failures = 0;
  const dailySums: number[] = [];

  for (let d = 0; d < DAYS; d++) {
    const date = addDays(START, d);
    const weekendFactor = isSunday(date) ? 0.70 : isSaturday(date) ? 0.85 : 1.0;

    const remainingDays = DAYS - d;
    const remainingTotal = TOTAL_TARGET - cumulativeTotal;
    const rawTarget = (remainingTotal / remainingDays) * weekendFactor;
    const noisy = rawTarget * gaussian(1, 0.08);
    const dayTarget = Math.max(MIN_DAILY * 1.05, noisy);

    let dayTotal = 0;
    let daySales = 0;
    let dayBonuses = 0;

    const mixEntries = Object.entries(PRODUCT_MIX);
    for (const [code, ratio] of mixEntries) {
      const product = productByCode.get(code);
      if (!product) continue;

      const amount = dayTarget * ratio;
      const qty = Math.max(1, Math.round(amount / Number(product.price)));

      for (let q = 0; q < qty; q++) {
        const sellerIdx = (d * 17 + daySales + q) % sellers.length;
        const seller = sellers[sellerIdx];

        saleSeq++;
        const saleCode = `SALE-${datePrefix}-${String(saleSeq).padStart(5, '0')}`;
        const weekCode = calculateWeekCode(date);
        const unitPrice = Number(product.price);
        const totalPrice = unitPrice;
        const unitPv = Number(product.pv);
        const totalPv = unitPv;

        try {
          const result = await prisma.$transaction(async (tx) => {
            // 1. 판매 등록
            const sale = await tx.sale.create({
              data: {
                saleCode,
                sellerId: seller.id,
                productId: product.id,
                quantity: 1,
                unitPrice,
                totalPrice,
                unitPv,
                totalPv,
                weekCode,
                status: SaleStatus.PENDING,
                soldAt: date,
                description: `${BATCH_ID}-d${d}`,
              },
            });

            // 2. 재고 차감
            await tx.product.update({
              where: { id: product.id },
              data: { stock: { decrement: 1 } },
            });

            // 3. 보너스 생성 (본인)
            let bonusCount = 0;
            const sellerRate = rateMap.get(`${product.id}-${seller.grade}`);
            if (sellerRate && sellerRate > 0) {
              const bonusType = getBonusTypeForGrade(seller.grade);
              await tx.bonus.create({
                data: {
                  memberId: seller.id,
                  saleId: sale.id,
                  bonusType,
                  amount: sellerRate,
                  description: `${getBonusTypeKorean(bonusType)} - ${product.name} 판매`,
                  weekCode,
                  status: 'PENDING',
                },
              });
              bonusCount++;
            }

            // 4. 보너스 생성 (상위 라인)
            const upline = uplineCache.get(seller.id) || [];
            for (const ancestor of upline) {
              if (ancestor.grade === MemberGrade.ADMIN) continue;
              if (ancestor.grade === MemberGrade.SALESPERSON) continue;

              const rate = rateMap.get(`${product.id}-${ancestor.grade}`);
              if (rate && rate > 0) {
                const bonusType = getBonusTypeForGrade(ancestor.grade);
                await tx.bonus.create({
                  data: {
                    memberId: ancestor.id,
                    saleId: sale.id,
                    bonusType,
                    amount: rate,
                    description: `${getBonusTypeKorean(bonusType)} - ${seller.name}님 ${product.name} 판매`,
                    weekCode,
                    status: 'PENDING',
                  },
                });
                bonusCount++;
              }
            }

            // 5. PV 누적
            await tx.member.update({
              where: { id: seller.id },
              data: { cumulativePv: { increment: totalPv } },
            });

            return { totalPrice: sale.totalPrice, bonusCount };
          });

          dayTotal += result.totalPrice;
          daySales++;
          dayBonuses += result.bonusCount;
        } catch (e: any) {
          failures++;
          console.error(`  ⚠ 실패 d${d} ${code} q${q}: ${e.message?.slice(0, 80)}`);
          if (failures > 50) throw new Error(`실패 ${failures}건 초과 — 중단`);
        }
      }
    }

    cumulativeTotal += dayTotal;
    dailySums.push(dayTotal);
    totalSalesCreated += daySales;
    totalBonusesCreated += dayBonuses;

    if (d % 25 === 0 || d === DAYS - 1) {
      const pct = ((cumulativeTotal / TOTAL_TARGET) * 100).toFixed(1);
      console.log(
        `  [${String(d + 1).padStart(3)}/${DAYS}] ${formatDate(date)} | ` +
        `일매출 ${fmt(dayTotal)}원 | 누적 ${fmt(cumulativeTotal)}원 (${pct}%) | ` +
        `판매 ${daySales}건 보너스 ${dayBonuses}건`
      );
    }
  }

  // ── 최종 보정 ──
  const gap = TOTAL_TARGET - cumulativeTotal;
  if (Math.abs(gap) > TOTAL_TARGET * 0.005) {
    console.log(`\n[5/6] 보정: 갭 ${fmt(gap)}원`);
    const onche = productByCode.get('MED-001');
    if (onche && gap > 0) {
      const adjustQty = Math.ceil(gap / Number(onche.price));
      for (let i = 0; i < adjustQty && i < 20; i++) {
        saleSeq++;
        const seller = sellers[i % sellers.length];
        const weekCode = calculateWeekCode(new Date());
        await prisma.$transaction(async (tx) => {
          const sale = await tx.sale.create({
            data: {
              saleCode: `SALE-${datePrefix}-${String(saleSeq).padStart(5, '0')}`,
              sellerId: seller.id,
              productId: onche.id,
              quantity: 1,
              unitPrice: Number(onche.price),
              totalPrice: Number(onche.price),
              unitPv: Number(onche.pv),
              totalPv: Number(onche.pv),
              weekCode,
              status: SaleStatus.PENDING,
              soldAt: new Date(),
              description: `${BATCH_ID}-adjust`,
            },
          });
          await tx.product.update({ where: { id: onche.id }, data: { stock: { decrement: 1 } } });
          await tx.member.update({ where: { id: seller.id }, data: { cumulativePv: { increment: Number(onche.pv) } } });

          const sellerRate = rateMap.get(`${onche.id}-${seller.grade}`);
          if (sellerRate && sellerRate > 0) {
            await tx.bonus.create({
              data: {
                memberId: seller.id, saleId: sale.id,
                bonusType: getBonusTypeForGrade(seller.grade),
                amount: sellerRate,
                description: `판매 수수료 - ${onche.name} 판매 (보정)`,
                weekCode, status: 'PENDING',
              },
            });
          }
        });
        cumulativeTotal += Number(onche.price);
        totalSalesCreated++;
      }
    }
  } else {
    console.log('\n[5/6] 보정 불필요');
  }

  // ── 검증 ──
  console.log('\n[6/6] 검증 쿼리 실행...\n');

  const v1 = await prisma.sale.aggregate({
    where: { description: { startsWith: 'MOCK-' } },
    _sum: { totalPrice: true },
    _count: true,
  });

  interface DayRow { d: Date; day_sum: bigint }
  const v2: DayRow[] = await prisma.$queryRaw`
    SELECT DATE(sold_at) as d, SUM(total_price) as day_sum
    FROM sales WHERE description LIKE 'MOCK-%'
    GROUP BY DATE(sold_at)
    ORDER BY day_sum ASC
    LIMIT 1
  `;

  const v3 = await prisma.bonus.count({
    where: { sale: { description: { startsWith: 'MOCK-' } } },
  });

  const v4 = await prisma.bonus.findMany({
    where: { sale: { description: { startsWith: 'MOCK-' } } },
    distinct: ['memberId'],
    select: { memberId: true },
  });

  interface StockRow { cnt: bigint }
  const v5: StockRow[] = await prisma.$queryRaw`SELECT COUNT(*) as cnt FROM products WHERE stock < 0`;

  const totalSalesAmount = Number(v1._sum.totalPrice || 0);
  const minDaily = v2.length > 0 ? Number(v2[0].day_sum) : 0;
  const bonusPerSale = v1._count > 0 ? v3 / v1._count : 0;
  const negStock = Number(v5[0]?.cnt || 0);

  console.log('┌──────────────────────────────────────────────────┐');
  console.log('│  검증 결과                                        │');
  console.log('├──────────────────────────────────────────────────┤');
  console.log(`│  V1 총매출:        ${fmt(totalSalesAmount)}원  ${totalSalesAmount >= TOTAL_TARGET * 0.995 && totalSalesAmount <= TOTAL_TARGET * 1.005 ? '✅' : '❌'}`);
  console.log(`│  V2 최소 일매출:   ${fmt(minDaily)}원  ${minDaily >= MIN_DAILY ? '✅' : '❌'}`);
  console.log(`│  V3 보너스/판매:   ${bonusPerSale.toFixed(2)}  ${bonusPerSale >= 1.5 ? '✅' : '❌'}`);
  console.log(`│  V4 수혜 회원:     ${v4.length}명  ${v4.length >= 5 ? '✅' : '❌'}`);
  console.log(`│  V5 음수 재고:     ${negStock}건  ${negStock === 0 ? '✅' : '❌'}`);
  console.log(`│  V6 판매 건수:     ${v1._count}건`);
  console.log(`│  V7 보너스 건수:   ${v3}건`);
  console.log(`│  V8 실패:          ${failures}건`);
  console.log('└──────────────────────────────────────────────────┘');

  const allPass =
    totalSalesAmount >= TOTAL_TARGET * 0.995 &&
    totalSalesAmount <= TOTAL_TARGET * 1.005 &&
    minDaily >= MIN_DAILY &&
    bonusPerSale >= 1.5 &&
    v4.length >= 5 &&
    negStock === 0;

  if (allPass) {
    console.log('\n🎉 모든 검증 통과! 목업 주입 완료.');
  } else {
    console.log('\n⚠ 일부 검증 실패. 위 결과를 확인하세요.');
  }

  console.log(`\n총계: 판매 ${totalSalesCreated}건 | 보너스 ${totalBonusesCreated}건 | 실패 ${failures}건 | 총매출 ${fmt(cumulativeTotal)}원`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error('❌ 치명적 오류:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
