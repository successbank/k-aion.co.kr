/**
 * 회원 패스워드 일괄 초기화 스크립트
 * CENTER, ADMIN 등급 제외 모든 회원의 패스워드를 1234로 변경
 */

import { PrismaClient, MemberGrade } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPasswords() {
  const newPassword = '1234';
  const saltRounds = 10;

  console.log('패스워드 해싱 중...');
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  console.log('대상 회원 조회 중...');
  // CENTER, ADMIN 제외한 모든 등급 (신규 등급 체계)
  const targetGrades = [
    MemberGrade.SALESPERSON,
    MemberGrade.TEAM_LEADER,
    MemberGrade.BRANCH_MANAGER,
  ];

  // 대상 회원 수 확인
  const targetCount = await prisma.member.count({
    where: {
      grade: { in: targetGrades },
    },
  });

  console.log(`대상 회원 수: ${targetCount}명`);
  console.log('제외 등급: CENTER, ADMIN');

  // 패스워드 일괄 업데이트
  const result = await prisma.member.updateMany({
    where: {
      grade: { in: targetGrades },
    },
    data: {
      password: hashedPassword,
    },
  });

  console.log(`✅ 패스워드 변경 완료: ${result.count}명`);

  return result.count;
}

resetPasswords()
  .then((count) => {
    console.log(`\n총 ${count}명의 패스워드가 1234로 변경되었습니다.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('오류 발생:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
