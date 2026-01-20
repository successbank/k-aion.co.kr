const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reconnectOrphans() {
  console.log('=== 고아 회원 연결 시작 ===\n');

  // 새 admin ID 찾기
  const admin = await prisma.member.findUnique({
    where: { username: 'admin' },
    select: { id: true, name: true, grade: true },
  });

  if (!admin) {
    console.log('Admin 계정이 없습니다. 먼저 create-admin.js를 실행하세요.');
    return;
  }

  console.log(`Admin 계정: ID ${admin.id}, ${admin.name}, ${admin.grade}`);

  // 고아 회원 확인 (sponsorId가 NULL인 회원, admin 제외)
  const orphansBySponsor = await prisma.member.findMany({
    where: {
      sponsorId: null,
      id: { not: admin.id },
      isActive: true,
    },
    select: { id: true, name: true, grade: true },
  });

  console.log(`\n후원 계보 고아 회원: ${orphansBySponsor.length}명`);
  if (orphansBySponsor.length > 0 && orphansBySponsor.length <= 10) {
    orphansBySponsor.forEach((m) => console.log(`  - ID: ${m.id}, ${m.name}, ${m.grade}`));
  }

  // 고아 회원 확인 (recommenderId가 NULL인 회원, admin 제외)
  const orphansByRecommender = await prisma.member.findMany({
    where: {
      recommenderId: null,
      id: { not: admin.id },
      isActive: true,
    },
    select: { id: true, name: true, grade: true },
  });

  console.log(`추천 계보 고아 회원: ${orphansByRecommender.length}명`);

  // 고아 회원들을 admin 하위로 연결
  console.log('\n고아 회원들을 Admin 하위로 연결 중...');

  const sponsorResult = await prisma.member.updateMany({
    where: {
      sponsorId: null,
      id: { not: admin.id },
      isActive: true,
    },
    data: {
      sponsorId: admin.id,
    },
  });

  const recommenderResult = await prisma.member.updateMany({
    where: {
      recommenderId: null,
      id: { not: admin.id },
      isActive: true,
    },
    data: {
      recommenderId: admin.id,
    },
  });

  console.log(`\n=== 연결 완료 ===`);
  console.log(`후원 계보: ${sponsorResult.count}명 연결`);
  console.log(`추천 계보: ${recommenderResult.count}명 연결`);

  // 최종 확인
  const finalOrphans = await prisma.member.count({
    where: {
      OR: [{ sponsorId: null }, { recommenderId: null }],
      id: { not: admin.id },
      isActive: true,
    },
  });

  console.log(`\n남은 고아 회원: ${finalOrphans}명 (0이어야 정상)`);
}

reconnectOrphans()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
