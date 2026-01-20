const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTopMembers() {
  console.log('🔍 최상위 회원 조회 중...\n');

  const topMembers = await prisma.member.findMany({
    where: {
      OR: [{ recommenderId: null }, { sponsorId: null }],
    },
    select: {
      id: true,
      name: true,
      grade: true,
      recommenderId: true,
      sponsorId: true,
    },
    orderBy: { id: 'asc' },
    take: 10,
  });

  console.log('최상위 회원 목록 (추천인 또는 후원인이 없는 회원):');
  console.log('================================================\n');

  topMembers.forEach((m) => {
    console.log(`ID: ${m.id}`);
    console.log(`이름: ${m.name}`);
    console.log(`등급: ${m.grade}`);
    console.log(`추천인ID: ${m.recommenderId || 'null'}`);
    console.log(`후원인ID: ${m.sponsorId || 'null'}`);
    console.log('---');
  });

  console.log(`\n총 ${topMembers.length}명의 최상위 회원 발견`);

  await prisma.$disconnect();
}

checkTopMembers()
  .catch((e) => {
    console.error('❌ 오류:', e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
