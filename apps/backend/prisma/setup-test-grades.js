/**
 * 테스트용 등급 구조 설정 스크립트
 *
 * 새로운 승급 기준을 테스트하기 위해 PV를 조정하고 등급을 재계산합니다.
 *
 * 승급 기준:
 * - AGENT: PV >= 2,000,000
 * - MANAGER: 직하 AGENT 15명
 * - BRANCH_CHIEF: 직하 MANAGER 4명
 * - DIVISION_CHIEF: 직하 BRANCH_CHIEF 5명
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupTestGrades() {
  console.log('🧪 테스트용 등급 구조 설정 시작...\n');

  // 1. 모든 비-ADMIN 회원 조회
  const members = await prisma.member.findMany({
    where: {
      grade: { not: 'ADMIN' },
      isActive: true,
    },
    orderBy: { id: 'asc' },
    select: { id: true, name: true, sponsorId: true, cumulativePv: true },
  });

  console.log(`📊 총 ${members.length}명 회원\n`);

  // 2. 테스트를 위해 모든 회원의 PV를 200만 이상으로 설정
  console.log('1단계: 모든 회원 PV를 200만 이상으로 설정...');
  for (const member of members) {
    const newPv = 2000000 + Math.floor(Math.random() * 1000000); // 200만 ~ 300만
    await prisma.member.update({
      where: { id: member.id },
      data: {
        cumulativePv: newPv,
        grade: 'AGENT',
        agentPromotedAt: new Date(),
      },
    });
  }
  console.log(`   ✅ ${members.length}명 PV 업데이트 및 AGENT 승급\n`);

  // 3. 후원 관계 기반으로 상위 등급 설정
  // 직하 회원이 많은 순으로 정렬
  const membersWithDownline = [];
  for (const member of members) {
    const downlineCount = await prisma.member.count({
      where: { sponsorId: member.id, isActive: true },
    });
    membersWithDownline.push({ ...member, downlineCount });
  }
  membersWithDownline.sort((a, b) => b.downlineCount - a.downlineCount);

  console.log('📊 직하 회원 수 상위 10명:');
  membersWithDownline.slice(0, 10).forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.name} (ID:${m.id}): 직하 ${m.downlineCount}명`);
  });
  console.log();

  // 4. 직하 15명 이상 → MANAGER (테스트용: 3명으로 낮춤)
  console.log('2단계: MANAGER 승급 처리 (테스트용: 직하 3명 이상)...');
  let managerCount = 0;
  const testManagerThreshold = 3; // 테스트용 낮은 기준

  for (const member of membersWithDownline) {
    if (member.downlineCount >= testManagerThreshold) {
      await prisma.member.update({
        where: { id: member.id },
        data: { grade: 'MANAGER' },
      });
      managerCount++;
      console.log(`   - ${member.name} → MANAGER (직하 ${member.downlineCount}명)`);
    }
  }
  console.log(`   ✅ ${managerCount}명 MANAGER 승급\n`);

  // 5. 직하 MANAGER 2명 이상 → BRANCH_CHIEF (테스트용: 2명)
  console.log('3단계: BRANCH_CHIEF 승급 처리 (테스트용: 직하 MANAGER 2명 이상)...');
  let branchChiefCount = 0;

  const managersWithManagerDownline = [];
  const currentManagers = await prisma.member.findMany({
    where: { grade: 'MANAGER', isActive: true },
    select: { id: true, name: true },
  });

  for (const manager of currentManagers) {
    const managerDownlineCount = await prisma.member.count({
      where: {
        sponsorId: manager.id,
        grade: { in: ['MANAGER', 'BRANCH_CHIEF', 'DIVISION_CHIEF'] },
        isActive: true,
      },
    });
    managersWithManagerDownline.push({ ...manager, managerDownlineCount });
  }

  for (const manager of managersWithManagerDownline) {
    if (manager.managerDownlineCount >= 2) {
      await prisma.member.update({
        where: { id: manager.id },
        data: { grade: 'BRANCH_CHIEF' },
      });
      branchChiefCount++;
      console.log(
        `   - ${manager.name} → BRANCH_CHIEF (직하 MANAGER ${manager.managerDownlineCount}명)`,
      );
    }
  }
  console.log(`   ✅ ${branchChiefCount}명 BRANCH_CHIEF 승급\n`);

  // 6. 직하 BRANCH_CHIEF 2명 이상 → DIVISION_CHIEF (테스트용: 2명)
  console.log('4단계: DIVISION_CHIEF 승급 처리 (테스트용: 직하 BRANCH_CHIEF 2명 이상)...');
  let divisionChiefCount = 0;

  const currentBranchChiefs = await prisma.member.findMany({
    where: { grade: 'BRANCH_CHIEF', isActive: true },
    select: { id: true, name: true },
  });

  for (const bc of currentBranchChiefs) {
    const bcDownlineCount = await prisma.member.count({
      where: {
        sponsorId: bc.id,
        grade: { in: ['BRANCH_CHIEF', 'DIVISION_CHIEF'] },
        isActive: true,
      },
    });

    if (bcDownlineCount >= 2) {
      await prisma.member.update({
        where: { id: bc.id },
        data: { grade: 'DIVISION_CHIEF' },
      });
      divisionChiefCount++;
      console.log(`   - ${bc.name} → DIVISION_CHIEF (직하 BRANCH_CHIEF ${bcDownlineCount}명)`);
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
  console.log('\n✅ 테스트용 등급 설정 완료!');
  console.log('\n📌 참고: 이 스크립트는 테스트를 위해 낮은 기준을 사용했습니다.');
  console.log('   실제 운영 기준은 recalculate-grades.js를 사용하세요.');
}

setupTestGrades()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
