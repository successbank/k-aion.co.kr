/**
 * 등급 재계산 스크립트
 *
 * 새로운 승급 기준:
 * - 회원 (MEMBER): 본인 누적 PV < 200만
 * - 에이전트 (AGENT): 본인 누적 PV >= 200만
 * - 매니저 (MANAGER): 직접 후원 회원 중 AGENT 이상 15명
 * - 지부장 (BRANCH_CHIEF): 직접 후원 회원 중 MANAGER 이상 4명
 * - 본부장 (DIVISION_CHIEF): 직접 후원 회원 중 BRANCH_CHIEF 이상 5명
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 승급 기준 상수
const AGENT_PV_THRESHOLD = 2000000;
const MANAGER_AGENT_COUNT = 15;
const BRANCH_CHIEF_MANAGER_COUNT = 4;
const DIVISION_CHIEF_BRANCH_CHIEF_COUNT = 5;

async function recalculateGrades() {
  console.log('🔄 등급 재계산 시작...\n');

  // 1. ADMIN 제외 모든 회원 조회
  const members = await prisma.member.findMany({
    where: {
      grade: { not: 'ADMIN' },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      grade: true,
      cumulativePv: true,
      sponsorId: true,
    },
  });

  console.log(`📊 총 ${members.length}명 회원 처리 예정\n`);

  // 2. 먼저 모든 회원을 MEMBER로 리셋 (ADMIN 제외)
  console.log('1단계: 모든 회원 등급을 MEMBER로 리셋...');
  await prisma.member.updateMany({
    where: {
      grade: { not: 'ADMIN' },
      isActive: true,
    },
    data: { grade: 'MEMBER' },
  });
  console.log('   ✅ 리셋 완료\n');

  // 3. MEMBER → AGENT 승급 (PV 기준)
  console.log('2단계: AGENT 승급 처리 (누적 PV >= 200만)...');
  const agentResult = await prisma.member.updateMany({
    where: {
      grade: 'MEMBER',
      cumulativePv: { gte: AGENT_PV_THRESHOLD },
      isActive: true,
    },
    data: {
      grade: 'AGENT',
      agentPromotedAt: new Date(),
    },
  });
  console.log(`   ✅ ${agentResult.count}명 AGENT 승급\n`);

  // 4. AGENT → MANAGER 승급 (직하 AGENT 15명 이상)
  console.log('3단계: MANAGER 승급 처리 (직하 AGENT 이상 15명)...');
  let managerCount = 0;

  // AGENT 등급 회원 중 조건 만족자 확인
  const agents = await prisma.member.findMany({
    where: { grade: 'AGENT', isActive: true },
    select: { id: true, name: true },
  });

  for (const agent of agents) {
    const directAgentCount = await prisma.member.count({
      where: {
        sponsorId: agent.id,
        grade: { in: ['AGENT', 'MANAGER', 'BRANCH_CHIEF', 'DIVISION_CHIEF'] },
        isActive: true,
      },
    });

    if (directAgentCount >= MANAGER_AGENT_COUNT) {
      await prisma.member.update({
        where: { id: agent.id },
        data: { grade: 'MANAGER' },
      });
      managerCount++;
      console.log(`   - ${agent.name} (ID:${agent.id}) → MANAGER (직하 ${directAgentCount}명)`);
    }
  }
  console.log(`   ✅ ${managerCount}명 MANAGER 승급\n`);

  // 5. MANAGER → BRANCH_CHIEF 승급 (직하 MANAGER 4명 이상)
  console.log('4단계: BRANCH_CHIEF 승급 처리 (직하 MANAGER 이상 4명)...');
  let branchChiefCount = 0;

  const managers = await prisma.member.findMany({
    where: { grade: 'MANAGER', isActive: true },
    select: { id: true, name: true },
  });

  for (const manager of managers) {
    const directManagerCount = await prisma.member.count({
      where: {
        sponsorId: manager.id,
        grade: { in: ['MANAGER', 'BRANCH_CHIEF', 'DIVISION_CHIEF'] },
        isActive: true,
      },
    });

    if (directManagerCount >= BRANCH_CHIEF_MANAGER_COUNT) {
      await prisma.member.update({
        where: { id: manager.id },
        data: { grade: 'BRANCH_CHIEF' },
      });
      branchChiefCount++;
      console.log(
        `   - ${manager.name} (ID:${manager.id}) → BRANCH_CHIEF (직하 ${directManagerCount}명)`,
      );
    }
  }
  console.log(`   ✅ ${branchChiefCount}명 BRANCH_CHIEF 승급\n`);

  // 6. BRANCH_CHIEF → DIVISION_CHIEF 승급 (직하 BRANCH_CHIEF 5명 이상)
  console.log('5단계: DIVISION_CHIEF 승급 처리 (직하 BRANCH_CHIEF 이상 5명)...');
  let divisionChiefCount = 0;

  const branchChiefs = await prisma.member.findMany({
    where: { grade: 'BRANCH_CHIEF', isActive: true },
    select: { id: true, name: true },
  });

  for (const branchChief of branchChiefs) {
    const directBranchChiefCount = await prisma.member.count({
      where: {
        sponsorId: branchChief.id,
        grade: { in: ['BRANCH_CHIEF', 'DIVISION_CHIEF'] },
        isActive: true,
      },
    });

    if (directBranchChiefCount >= DIVISION_CHIEF_BRANCH_CHIEF_COUNT) {
      await prisma.member.update({
        where: { id: branchChief.id },
        data: { grade: 'DIVISION_CHIEF' },
      });
      divisionChiefCount++;
      console.log(
        `   - ${branchChief.name} (ID:${branchChief.id}) → DIVISION_CHIEF (직하 ${directBranchChiefCount}명)`,
      );
    }
  }
  console.log(`   ✅ ${divisionChiefCount}명 DIVISION_CHIEF 승급\n`);

  // 7. 최종 결과 출력
  console.log('='.repeat(50));
  console.log('📊 최종 등급 분포:');
  const distribution = await prisma.member.groupBy({
    by: ['grade'],
    _count: { id: true },
    where: { isActive: true },
    orderBy: { _count: { id: 'desc' } },
  });

  distribution.forEach((g) => {
    console.log(`   ${g.grade}: ${g._count.id}명`);
  });

  console.log('='.repeat(50));
  console.log('\n✅ 등급 재계산 완료!');
}

recalculateGrades()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
