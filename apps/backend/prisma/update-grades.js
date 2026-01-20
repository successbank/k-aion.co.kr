const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateGrades() {
  console.log('🔄 회원 등급 업데이트 시작...\n');

  // 모든 회원과 추천/후원 수 조회 (ADMIN 제외)
  const members = await prisma.member.findMany({
    where: { grade: { not: 'ADMIN' } },
    select: {
      id: true,
      name: true,
      recommenderId: true,
      sponsorId: true,
      _count: { select: { recommendees: true, sponsorees: true } },
    },
  });

  // 등급 결정 로직
  // 1. 루트 회원 (추천/후원인 없음) + 추천 5명 이상 → 본부장
  // 2. 추천 5명 이상 → 지부장
  // 3. 추천 3-4명 또는 후원 3명 → 매니저
  // 4. 추천 1-2명 또는 후원 1-2명 → 에이전트
  // 5. 나머지 → 회원

  const updates = {
    DIVISION_CHIEF: [],
    BRANCH_CHIEF: [],
    MANAGER: [],
    AGENT: [],
    MEMBER: [],
  };

  for (const m of members) {
    const recCount = m._count.recommendees;
    const sponCount = m._count.sponsorees;
    const isRoot = !m.recommenderId || !m.sponsorId;

    let newGrade;
    if (isRoot && recCount >= 5) {
      newGrade = 'DIVISION_CHIEF';
    } else if (recCount >= 5) {
      newGrade = 'BRANCH_CHIEF';
    } else if (recCount >= 3 || sponCount >= 3) {
      newGrade = 'MANAGER';
    } else if (recCount >= 1 || sponCount >= 1) {
      newGrade = 'AGENT';
    } else {
      newGrade = 'MEMBER';
    }

    updates[newGrade].push({ id: m.id, name: m.name });
  }

  // 업데이트 실행
  for (const [grade, memberList] of Object.entries(updates)) {
    if (memberList.length > 0) {
      await prisma.member.updateMany({
        where: { id: { in: memberList.map((m) => m.id) } },
        data: { grade },
      });
      console.log('✅ ' + grade + ': ' + memberList.length + '명 업데이트');
      memberList.slice(0, 5).forEach((m) => console.log('   - ' + m.name + ' (ID:' + m.id + ')'));
      if (memberList.length > 5) console.log('   ... 외 ' + (memberList.length - 5) + '명');
    }
  }

  // 결과 확인
  console.log('\n📊 업데이트 후 등급별 분포:');
  const distribution = await prisma.member.groupBy({
    by: ['grade'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });
  distribution.forEach((g) => {
    console.log('   ' + g.grade + ': ' + g._count.id + '명');
  });

  await prisma.$disconnect();
}

updateGrades().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
