/**
 * Phase 1 Member Seed Script
 *
 * 14명의 회원 정보를 후원계보(sponsorId)만 적용하여 시스템에 입력합니다.
 * 추천계보(recommenderId)는 사용하지 않습니다.
 *
 * 후원계보 트리 구조:
 * 박수웅 (root, BRANCH_MANAGER)
 * ├── 김지현 [Team 1] (TEAM_LEADER)
 * │   ├── 엄민섭 [Team 1] (SALESPERSON)
 * │   │   └── 유병철 [Team 1] (SALESPERSON)
 * │   ├── 최승환 [Team 2] (SALESPERSON)
 * │   │   └── 남택수 [Team 1] (SALESPERSON)
 * │   └── 문정원 [Team 3] (SALESPERSON)
 * │       └── 김찬 [Team 1] (SALESPERSON)
 * └── 임나희 [Team 2] (TEAM_LEADER)
 *     ├── 장윤지 [Team 1] (SALESPERSON)
 *     │   └── 이명진 [Team 1] (SALESPERSON)
 *     ├── 안유진 [Team 2] (SALESPERSON)
 *     │   ├── 황지영 [Team 1] (SALESPERSON)
 *     │   └── 신종옥 [Team 2] (SALESPERSON)
 *     └── 조원찬 [Team 3] (SALESPERSON)
 *
 * 실행: docker exec kaion_backend npx ts-node prisma/seed-members-phase1.ts
 */
import { PrismaClient, MemberGrade } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// 회원 데이터 정의 (입력 순서대로)
interface MemberData {
  name: string;
  phone: string;
  username: string;
  sponsorUsername: string | null;
  teamLine: number | null;
  grade: MemberGrade;
}

const membersData: MemberData[] = [
  // 1단계: 루트 회원 (후원인 없음)
  {
    name: '박수웅',
    phone: '010-2891-2674',
    username: 'park-suwoo',
    sponsorUsername: null,
    teamLine: null,
    grade: MemberGrade.BRANCH_MANAGER,
  },

  // 2단계: 박수웅의 직접 후원 회원
  {
    name: '김지현',
    phone: '010-4162-5672',
    username: 'kim-jihyun',
    sponsorUsername: 'park-suwoo',
    teamLine: 1,
    grade: MemberGrade.TEAM_LEADER,
  },
  {
    name: '임나희',
    phone: '010-7178-6527',
    username: 'im-nahee',
    sponsorUsername: 'park-suwoo',
    teamLine: 2,
    grade: MemberGrade.TEAM_LEADER,
  },

  // 3단계: 김지현의 직접 후원 회원
  {
    name: '엄민섭',
    phone: '010-9118-6683',
    username: 'eom-minseop',
    sponsorUsername: 'kim-jihyun',
    teamLine: 1,
    grade: MemberGrade.SALESPERSON,
  },
  {
    name: '최승환',
    phone: '010-6419-9477',
    username: 'choi-seunghwan',
    sponsorUsername: 'kim-jihyun',
    teamLine: 2,
    grade: MemberGrade.SALESPERSON,
  },
  {
    name: '문정원',
    phone: '010-8770-4684',
    username: 'moon-jungwon',
    sponsorUsername: 'kim-jihyun',
    teamLine: 3,
    grade: MemberGrade.SALESPERSON,
  },

  // 3단계: 임나희의 직접 후원 회원
  {
    name: '장윤지',
    phone: '010-9915-5272',
    username: 'jang-yunji',
    sponsorUsername: 'im-nahee',
    teamLine: 1,
    grade: MemberGrade.SALESPERSON,
  },
  {
    name: '안유진',
    phone: '010-2272-3885',
    username: 'an-yujin',
    sponsorUsername: 'im-nahee',
    teamLine: 2,
    grade: MemberGrade.SALESPERSON,
  },
  {
    name: '조원찬',
    phone: '010-0000-0002',
    username: 'jo-wonchan',
    sponsorUsername: 'im-nahee',
    teamLine: 3,
    grade: MemberGrade.SALESPERSON,
  },

  // 4단계: 손자 회원
  {
    name: '유병철',
    phone: '010-4537-6560',
    username: 'yu-byungchul',
    sponsorUsername: 'eom-minseop',
    teamLine: 1,
    grade: MemberGrade.SALESPERSON,
  },
  {
    name: '남택수',
    phone: '010-4825-0548',
    username: 'nam-taeksu',
    sponsorUsername: 'choi-seunghwan',
    teamLine: 1,
    grade: MemberGrade.SALESPERSON,
  },
  {
    name: '김찬',
    phone: '010-5119-5269',
    username: 'kim-chan',
    sponsorUsername: 'moon-jungwon',
    teamLine: 1,
    grade: MemberGrade.SALESPERSON,
  },
  {
    name: '이명진',
    phone: '010-3552-6445',
    username: 'lee-myungjin',
    sponsorUsername: 'jang-yunji',
    teamLine: 1,
    grade: MemberGrade.SALESPERSON,
  },
  {
    name: '황지영',
    phone: '010-2820-6888',
    username: 'hwang-jiyoung',
    sponsorUsername: 'an-yujin',
    teamLine: 1,
    grade: MemberGrade.SALESPERSON,
  },
  {
    name: '신종옥',
    phone: '010-0000-0001',
    username: 'shin-jongok',
    sponsorUsername: 'an-yujin',
    teamLine: 2,
    grade: MemberGrade.SALESPERSON,
  },
];

async function main() {
  console.log('🌱 Phase 1 회원 데이터 입력 시작...\n');

  // 기본 비밀번호: 1234
  const hashedPassword = await bcrypt.hash('1234', 10);

  // 중복 체크
  console.log('📋 중복 체크 중...');
  const existingUsernames = await prisma.member.findMany({
    where: {
      username: { in: membersData.map((m) => m.username) },
    },
    select: { username: true },
  });

  const existingPhones = await prisma.member.findMany({
    where: {
      phone: { in: membersData.map((m) => m.phone) },
    },
    select: { phone: true },
  });

  if (existingUsernames.length > 0) {
    console.error(
      '❌ 이미 존재하는 username:',
      existingUsernames.map((u) => u.username).join(', '),
    );
    throw new Error('중복된 username이 존재합니다.');
  }

  if (existingPhones.length > 0) {
    console.error(
      '❌ 이미 존재하는 phone:',
      existingPhones.map((p) => p.phone).join(', '),
    );
    throw new Error('중복된 phone이 존재합니다.');
  }

  console.log('✅ 중복 없음\n');

  // 트랜잭션으로 회원 생성
  const createdMembers = await prisma.$transaction(async (tx) => {
    const memberMap: Map<string, { id: number; name: string }> = new Map();
    const results: Array<{ id: number; name: string; username: string; grade: string }> = [];

    for (const memberData of membersData) {
      // 후원인 ID 조회
      let sponsorId: number | null = null;
      if (memberData.sponsorUsername) {
        const sponsor = memberMap.get(memberData.sponsorUsername);
        if (!sponsor) {
          throw new Error(
            `후원인 '${memberData.sponsorUsername}'을 찾을 수 없습니다. 입력 순서를 확인하세요.`,
          );
        }
        sponsorId = sponsor.id;
      }

      // 회원 생성
      const member = await tx.member.create({
        data: {
          username: memberData.username,
          password: hashedPassword,
          name: memberData.name,
          phone: memberData.phone,
          grade: memberData.grade,
          sponsorId: sponsorId,
          teamLine: memberData.teamLine,
          recommenderId: null, // 추천계보 제거
          isActive: true,
          emailVerified: false,
          cumulativePv: 0,
        },
      });

      memberMap.set(memberData.username, { id: member.id, name: member.name });
      results.push({
        id: member.id,
        name: member.name,
        username: member.username,
        grade: member.grade,
      });

      const sponsorInfo = memberData.sponsorUsername
        ? `후원인: ${memberMap.get(memberData.sponsorUsername)?.name} (팀${memberData.teamLine})`
        : '루트 회원';
      console.log(`  ✅ ${member.name} (${member.grade}) - ${sponsorInfo}`);
    }

    return results;
  });

  console.log(`\n🎉 총 ${createdMembers.length}명의 회원이 성공적으로 생성되었습니다!`);

  // 결과 요약
  console.log('\n📊 등급별 인원:');
  const gradeCount = createdMembers.reduce(
    (acc, m) => {
      acc[m.grade] = (acc[m.grade] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  Object.entries(gradeCount).forEach(([grade, count]) => {
    console.log(`  - ${grade}: ${count}명`);
  });

  console.log('\n🔑 로그인 정보:');
  console.log('  비밀번호: 1234');
  console.log('  사용자명 예시: park-suwoo, kim-jihyun, im-nahee ...');
}

main()
  .catch((e) => {
    console.error('\n❌ 오류 발생:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
