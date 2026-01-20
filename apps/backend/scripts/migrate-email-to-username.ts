import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationResult {
  email: string;
  username: string;
  status: 'success' | 'duplicate_resolved' | 'error';
}

/**
 * email에서 username 생성
 * 규칙:
 * - @ 앞부분 추출
 * - 특수문자 제거, 소문자 변환
 * - 영문으로 시작하지 않으면 'user' 접두사 추가
 * - 최소 4글자, 최대 50글자
 * - 중복 시 숫자 suffix 추가
 */
async function generateUsername(email: string, usedUsernames: Set<string>): Promise<string> {
  // 1. @ 앞부분 추출
  const emailPrefix = email.split('@')[0];

  // 2. 특수문자 제거, 소문자 변환 (영문, 숫자, _, - 만 허용)
  let username = emailPrefix.toLowerCase().replace(/[^a-z0-9_-]/g, '');

  // 3. 영문으로 시작하지 않으면 'user' 접두사 추가
  if (!/^[a-z]/.test(username)) {
    username = 'user' + username;
  }

  // 4. 여전히 영문으로 시작하지 않으면 (특수문자만 있는 경우) 기본값 사용
  if (!/^[a-z]/.test(username)) {
    username = 'user0000';
  }

  // 5. 최소 길이 체크 (4글자 미만이면 '0' 패딩)
  if (username.length < 4) {
    username = username.padEnd(4, '0');
  }

  // 6. 최대 길이 제한 (50글자)
  if (username.length > 50) {
    username = username.substring(0, 50);
  }

  // 7. 중복 해결
  let finalUsername = username;
  let counter = 1;
  while (usedUsernames.has(finalUsername)) {
    const suffix = String(counter);
    const maxBaseLength = 50 - suffix.length;
    finalUsername = username.substring(0, maxBaseLength) + suffix;
    counter++;

    // 무한루프 방지
    if (counter > 10000) {
      throw new Error(`Cannot generate unique username for ${email} after 10000 attempts`);
    }
  }

  return finalUsername;
}

/**
 * email → username 마이그레이션
 * @param dryRun true면 실제 DB 업데이트 없이 시뮬레이션만
 */
async function migrateEmailToUsername(dryRun = true): Promise<MigrationResult[]> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Email → Username 마이그레이션 시작`);
  console.log(`모드: ${dryRun ? '🔍 DRY-RUN (시뮬레이션)' : '⚠️  실제 적용'}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // 모든 회원 조회 (id 순서대로)
    const members = await prisma.member.findMany({
      select: { id: true, email: true },
      orderBy: { id: 'asc' },
    });

    console.log(`📊 총 ${members.length}명의 회원 처리 예정\n`);

    if (members.length === 0) {
      console.log('⚠️  처리할 회원이 없습니다.\n');
      return [];
    }

    const usedUsernames = new Set<string>();
    const results: MigrationResult[] = [];
    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const member of members) {
      try {
        // email이 null인 경우 건너뛰기
        if (!member.email) {
          console.log(`⚠️ [${member.id}] 이메일이 없어 건너뜁니다.`);
          continue;
        }

        // username 생성
        const username = await generateUsername(member.email, usedUsernames);
        usedUsernames.add(username);

        // 원본과 비교하여 중복 여부 확인
        const originalUsername = member.email
          .split('@')[0]
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '');
        const isDuplicate = username !== originalUsername;

        // 실제 DB 업데이트 (dryRun이 아닐 때)
        if (!dryRun) {
          await prisma.member.update({
            where: { id: member.id },
            data: { username },
          });
        }

        const status = isDuplicate ? 'duplicate_resolved' : 'success';
        results.push({
          email: member.email,
          username,
          status,
        });

        if (isDuplicate) {
          duplicateCount++;
          console.log(
            `${dryRun ? '(DRY)' : '✓'} [${member.id}] ${member.email} → ${username} (중복 해결: ${originalUsername})`,
          );
        } else {
          successCount++;
          console.log(`${dryRun ? '(DRY)' : '✓'} [${member.id}] ${member.email} → ${username}`);
        }
      } catch (error: any) {
        errorCount++;
        const emailStr = member.email || 'no-email';
        console.error(`❌ [${member.id}] ${emailStr} 처리 실패:`, error.message);
        results.push({
          email: member.email || '',
          username: '',
          status: 'error',
        });
      }
    }

    // 결과 통계
    console.log(`\n${'='.repeat(60)}`);
    console.log('📈 마이그레이션 결과 통계');
    console.log(`${'='.repeat(60)}`);
    console.log(`  총 회원 수: ${members.length}명`);
    console.log(`  ✓ 성공: ${successCount}명`);
    console.log(`  ⚠  중복 해결: ${duplicateCount}명`);
    console.log(`  ❌ 실패: ${errorCount}명`);
    console.log(`${'='.repeat(60)}\n`);

    if (errorCount > 0) {
      console.log('⚠️  에러가 발생한 회원이 있습니다. 로그를 확인하세요.\n');
    }

    if (dryRun) {
      console.log('💡 DRY-RUN 모드입니다. 실제 DB는 변경되지 않았습니다.');
      console.log('💡 실제 적용하려면 --apply 옵션을 추가하세요:\n');
      console.log('   npm run ts-node scripts/migrate-email-to-username.ts -- --apply\n');
    } else {
      console.log('✅ 마이그레이션이 실제로 적용되었습니다.\n');
    }

    return results;
  } catch (error: any) {
    console.error('\n❌ 마이그레이션 실행 중 치명적 오류 발생:', error);
    throw error;
  }
}

// 메인 실행
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--apply');

  if (!isDryRun) {
    console.log('\n⚠️  실제 DB를 변경합니다. 5초 후 시작...\n');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  try {
    await migrateEmailToUsername(isDryRun);
    console.log('🎉 마이그레이션 완료!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 마이그레이션 실패\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
main();
