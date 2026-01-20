const { PrismaClient, MemberGrade } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('🔐 Admin 계정 생성 시작...\n');

  // 기존 admin 계정 확인
  const existingAdmin = await prisma.member.findUnique({
    where: { username: 'admin' },
  });

  if (existingAdmin) {
    console.log('⚠️  이미 admin 계정이 존재합니다.');
    console.log(`   ID: ${existingAdmin.id}, 이름: ${existingAdmin.name}\n`);
    return;
  }

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash('admin123!@#', 10);

  // Admin 계정 생성
  const admin = await prisma.member.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      name: '시스템 관리자',
      phone: '010-0000-0000',
      email: 'admin@kaion.com',
      grade: MemberGrade.ADMIN,
      isActive: true,
      cumulativePv: 0,
    },
  });

  console.log('✅ Admin 계정이 성공적으로 생성되었습니다!');
  console.log(`   ID: ${admin.id}`);
  console.log(`   Username: ${admin.username}`);
  console.log(`   Name: ${admin.name}`);
  console.log(`   Grade: ${admin.grade}`);
  console.log(`\n🔑 로그인 정보:`);
  console.log(`   아이디: admin`);
  console.log(`   비밀번호: admin123!@#\n`);

  await prisma.$disconnect();
}

createAdmin()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
