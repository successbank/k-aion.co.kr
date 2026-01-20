const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteMember1537() {
  const memberId = 1537;

  console.log('=== 회원 ID 1537 삭제 시작 ===\n');

  // 회원 존재 여부 확인
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true, name: true, email: true, grade: true },
  });

  if (!member) {
    console.log('회원 ID 1537이 존재하지 않습니다.');
    return;
  }

  console.log('삭제 대상 회원:');
  console.log(`  - ID: ${member.id}`);
  console.log(`  - 이름: ${member.name}`);
  console.log(`  - 이메일: ${member.email}`);
  console.log(`  - 등급: ${member.grade}\n`);

  // 1. 의존 데이터 확인
  const [sales, seminars, settlements, childMembers] = await Promise.all([
    prisma.sale.count({ where: { sellerId: memberId } }),
    prisma.seminar.count({ where: { hostId: memberId } }),
    prisma.settlement.count({ where: { confirmedBy: memberId } }),
    prisma.member.count({ where: { OR: [{ sponsorId: memberId }, { recommenderId: memberId }] } }),
  ]);

  console.log('의존 데이터:');
  console.log(`  - 판매 기록: ${sales}건`);
  console.log(`  - 세미나: ${seminars}건`);
  console.log(`  - 정산 확인: ${settlements}건`);
  console.log(`  - 하위 회원: ${childMembers}명\n`);

  // 2. 의존 데이터 정리
  console.log('의존 데이터 정리 중...\n');

  // 판매 기록 삭제
  if (sales > 0) {
    await prisma.sale.deleteMany({ where: { sellerId: memberId } });
    console.log(`  - 판매 기록 ${sales}건 삭제 완료`);
  }

  // 세미나는 hostId가 필수(NOT NULL)이므로 해당 세미나 삭제
  if (seminars > 0) {
    await prisma.seminar.deleteMany({ where: { hostId: memberId } });
    console.log(`  - 세미나 ${seminars}건 삭제 완료`);
  }

  // 정산 확인자 NULL 처리
  if (settlements > 0) {
    await prisma.settlement.updateMany({
      where: { confirmedBy: memberId },
      data: { confirmedBy: null },
    });
    console.log(`  - 정산 확인 ${settlements}건 NULL 처리 완료`);
  }

  // 하위 회원 연결 해제
  if (childMembers > 0) {
    await prisma.member.updateMany({ where: { sponsorId: memberId }, data: { sponsorId: null } });
    await prisma.member.updateMany({
      where: { recommenderId: memberId },
      data: { recommenderId: null },
    });
    console.log(`  - 하위 회원 ${childMembers}명 연결 해제 완료`);
  }

  // 3. 회원 삭제 (bonuses, cultivation_records는 CASCADE로 자동 삭제)
  console.log('\n회원 삭제 중...');
  await prisma.member.delete({ where: { id: memberId } });

  console.log('=== 회원 ID 1537 삭제 완료 ===\n');

  // 삭제 확인
  const check = await prisma.member.findUnique({ where: { id: memberId } });
  if (!check) {
    console.log('삭제 확인: 회원 ID 1537이 데이터베이스에서 완전히 삭제되었습니다.');
  }

  // 남은 ADMIN 확인
  const admins = await prisma.member.findMany({
    where: { grade: 'ADMIN' },
    select: { id: true, name: true, email: true },
  });
  console.log(`\n남은 최고관리자 수: ${admins.length}명`);
  admins.forEach((admin) => {
    console.log(`  - ID: ${admin.id}, 이름: ${admin.name}, 이메일: ${admin.email}`);
  });
}

deleteMember1537()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
