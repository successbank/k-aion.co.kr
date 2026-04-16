/**
 * 목업 센터 20개 + BRANCH_MANAGER 40명 생성 스크립트
 * DB-First: 모든 관계(admin, teamLine) DB 조회 기반
 */
import { PrismaClient, MemberGrade } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const REGION_NAMES = [
  '강남센터', '서초센터', '용산센터', '분당센터', '일산센터',
  '인천센터', '수원센터', '대전센터', '대구센터', '부산센터',
  '광주센터', '울산센터', '창원센터', '천안센터', '전주센터',
  '청주센터', '제주센터', '평택센터', '파주센터', '김포센터',
];

async function main() {
  console.log('=== 목업 센터 + BM 생성 시작 ===\n');

  const admin = await prisma.member.findFirst({ where: { grade: MemberGrade.ADMIN, deletedAt: null } });
  if (!admin) throw new Error('ADMIN 계정을 찾을 수 없습니다. 시드를 먼저 실행하세요.');
  console.log(`Admin ID: ${admin.id} (${admin.username})`);

  const existing = await prisma.member.count({ where: { username: { startsWith: 'mockcenter' } } });
  if (existing > 0) {
    console.log(`이미 mock 센터 ${existing}명 존재. 중복 생성 방지를 위해 종료합니다.`);
    return;
  }

  const passwordHash = await bcrypt.hash('12341234', 10);
  let centerCount = 0;
  let bmCount = 0;

  for (let i = 1; i <= 20; i++) {
    const padded = String(i).padStart(2, '0');
    const teamLine = ((i - 1) % 3) + 1;

    const center = await prisma.member.create({
      data: {
        username: `mockcenter${padded}`,
        name: `목업센터${padded}`,
        email: `mockcenter${padded}@mock.kaion.kr`,
        phone: `010-9900-${String(i).padStart(4, '0')}`,
        password: passwordHash,
        grade: MemberGrade.CENTER,
        recommenderId: admin.id,
        sponsorId: admin.id,
        teamLine,
        centerName: REGION_NAMES[i - 1],
        isActive: true,
      },
    });
    centerCount++;
    console.log(`  CENTER ${padded}: ${center.name} (${REGION_NAMES[i - 1]}) → teamLine=${teamLine}`);

    for (let j = 1; j <= 2; j++) {
      const bmTeamLine = j;
      await prisma.member.create({
        data: {
          username: `mockbm${padded}${j}`,
          name: `목업지사장${padded}-${j}`,
          email: `mockbm${padded}${j}@mock.kaion.kr`,
          phone: `010-9800-${String(i * 10 + j).padStart(4, '0')}`,
          password: passwordHash,
          grade: MemberGrade.BRANCH_MANAGER,
          recommenderId: center.id,
          sponsorId: center.id,
          teamLine: bmTeamLine,
          centerName: REGION_NAMES[i - 1],
          isActive: true,
        },
      });
      bmCount++;
    }
  }

  console.log(`\n=== 생성 완료: CENTER ${centerCount}명, BRANCH_MANAGER ${bmCount}명 ===`);

  const verification = await prisma.member.groupBy({
    by: ['grade'],
    where: { username: { startsWith: 'mock' } },
    _count: true,
  });
  console.log('\n검증 결과:');
  verification.forEach((v) => console.log(`  ${v.grade}: ${v._count}명`));
}

main()
  .then(() => { console.log('\n✅ 목업 센터 생성 완료'); process.exit(0); })
  .catch((e) => { console.error('❌ 오류:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
