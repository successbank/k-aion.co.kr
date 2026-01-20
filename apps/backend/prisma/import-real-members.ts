/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient, MemberGrade } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// CSV 파싱 함수 (내장 모듈만 사용)
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  // BOM 제거
  const firstLine = lines[0].replace(/^\uFEFF/, '');
  const headers = firstLine.split(',').map((h) => h.trim());

  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(',').map((v) => v.trim());

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    data.push(row);
  }

  return data;
}

// 한글 이름을 영문 username으로 변환
function nameToUsername(name: string): string {
  const romanizationMap: Record<string, string> = {
    김: 'kim',
    이: 'lee',
    박: 'park',
    최: 'choi',
    정: 'jung',
    강: 'kang',
    조: 'jo',
    윤: 'yoon',
    장: 'jang',
    임: 'lim',
    한: 'han',
    오: 'oh',
    서: 'seo',
    신: 'shin',
    권: 'kwon',
    황: 'hwang',
    안: 'ahn',
    송: 'song',
    전: 'jeon',
    홍: 'hong',
    고: 'go',
    문: 'moon',
    양: 'yang',
    손: 'son',
    배: 'bae',
    성: 'seong',
    백: 'baek',
    허: 'heo',
    남: 'nam',
    심: 'sim',
    노: 'noh',
    하: 'ha',
    곽: 'kwak',
    성: 'sung',
    차: 'cha',
    주: 'joo',
    우: 'woo',
    구: 'koo',
    금: 'geum',
    // 이름 로마자 매핑
    흥기: 'heunggi',
    창용: 'changyong',
    성호: 'seongho',
    일원: 'ilwon',
    경미: 'kyungmi',
    태은: 'taeeun',
    재호: 'jaeho',
    철혁: 'cheolhyuk',
    경녀: 'kyungnyeo',
    경숙: 'kyungsook',
    화분: 'hwabun',
    치화: 'chihwa',
    귀희: 'gwihee',
    희정: 'heejeong',
    영숙: 'youngsook',
    부엽: 'buyeop',
    금주: 'geumju',
    부순: 'busoon',
    숙임: 'soogim',
    말순: 'malsoon',
    미옥: 'miok',
    영주: 'youngju',
    정미: 'jungmi',
    정숙: 'jungsook',
    혜숙: 'hyesook',
    명례: 'myungrae',
    미영: 'miyoung',
    태경: 'taegyeong',
    승남: 'seungnam',
    성화: 'sunghwa',
    성여: 'sungyeo',
    민정: 'minjeong',
    수란: 'suran',
    다은: 'daeun',
    동진: 'dongjin',
    진숙: 'jinsook',
    지운: 'jiwoon',
    희자: 'heeja',
    은신: 'eunshin',
    은경: 'eunkyung',
    홍섭: 'hongseop',
    나윤: 'nayoon',
    혜랑: 'hyerang',
    유순: 'yusoon',
  };

  // 성과 이름 분리
  const lastName = name.charAt(0);
  const firstName = name.substring(1);

  const romanLastName = romanizationMap[lastName] || lastName.toLowerCase();
  const romanFirstName =
    romanizationMap[firstName] || firstName.toLowerCase().replace(/[^a-z]/g, '');

  return romanLastName + romanFirstName;
}

// 주민번호에서 생년월일 추출
function extractBirthDate(residentNumber: string): Date | null {
  if (!residentNumber || residentNumber.length < 6) return null;

  const birthPart = residentNumber.substring(0, 6).replace(/[^0-9]/g, '');
  if (birthPart.length !== 6) return null;

  const year = parseInt(birthPart.substring(0, 2));
  const month = parseInt(birthPart.substring(2, 4));
  const day = parseInt(birthPart.substring(4, 6));

  // 1900년대 또는 2000년대 추정 (50 이상이면 1900년대)
  const fullYear = year >= 50 ? 1900 + year : 2000 + year;

  try {
    const date = new Date(fullYear, month - 1, day);
    if (date.getMonth() !== month - 1) return null; // 잘못된 날짜
    return date;
  } catch {
    return null;
  }
}

// 전화번호 정규화 (공백 제거)
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-]/g, '');
}

async function main() {
  console.log('🌱 실제 회원 데이터 임포트 시작...\n');

  // CSV 파일 읽기
  const csvPath = path.join('/home/successbank/projects/beaugem', 'beaugem_mem.csv');
  console.log(`📁 CSV 파일 읽기: ${csvPath}`);

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const csvData = parseCSV(csvContent);

  console.log(`✅ CSV 파일 파싱 완료: ${csvData.length}명\n`);

  // 기존 데이터 완전 삭제
  console.log('🗑️  기존 데이터 삭제 시작...');
  await prisma.bonus.deleteMany();
  console.log('  - Bonus 삭제 완료');
  await prisma.sale.deleteMany();
  console.log('  - Sale 삭제 완료');
  await prisma.settlement.deleteMany();
  console.log('  - Settlement 삭제 완료');
  await prisma.seminar.deleteMany();
  console.log('  - Seminar 삭제 완료');
  await prisma.cultivationRecord.deleteMany();
  console.log('  - CultivationRecord 삭제 완료');
  await prisma.product.deleteMany();
  console.log('  - Product 삭제 완료');
  await prisma.category.deleteMany();
  console.log('  - Category 삭제 완료');
  await prisma.member.deleteMany();
  console.log('  - Member 삭제 완료');
  console.log('✅ 기존 데이터 삭제 완료\n');

  // 1차 패스: 모든 회원 생성 (추천인/후원인 관계 제외)
  console.log('👥 1차 패스: 회원 기본 정보 생성...');

  const hashedPassword = await bcrypt.hash('Beaugem2024!', 10);
  const createdMembers: Map<string, any> = new Map();
  const usernameCount: Map<string, number> = new Map();

  for (const row of csvData) {
    const name = row['회원명'];
    if (!name) continue;

    // username 생성 (중복 방지)
    let baseUsername = nameToUsername(name);
    const count = usernameCount.get(baseUsername) || 0;
    usernameCount.set(baseUsername, count + 1);

    const username = count > 0 ? `${baseUsername}${count}` : baseUsername;

    // 생년월일 추출
    const birthDate = extractBirthDate(row['주민번호']);

    // 회원 생성
    try {
      const member = await prisma.member.create({
        data: {
          username,
          password: hashedPassword,
          name,
          phone: normalizePhone(row['전화번호'] || ''),
          birthDate,
          bankName: row['은행'] || null,
          accountNumber: row['계좌번호']?.replace(/[\s\-]/g, '') || null,
          accountHolder: row['예금주'] || null,
          address: row['주 소'] || null,
          grade: MemberGrade.MEMBER,
          isActive: true,
          cumulativePv: 0,
        },
      });

      createdMembers.set(name, member);
      console.log(`  ✓ ${name} (${username})`);
    } catch (error) {
      console.error(`  ✗ ${name} 생성 실패:`, error);
    }
  }

  console.log(`\n✅ 1차 패스 완료: ${createdMembers.size}명 생성\n`);

  // 2차 패스: 추천인/후원인 관계 설정
  console.log('🔗 2차 패스: 추천인/후원인 관계 설정...');

  for (const row of csvData) {
    const name = row['회원명'];
    if (!name) continue;

    const member = createdMembers.get(name);
    if (!member) continue;

    const recommenderName = row['추천인'];
    const sponsorName = row['후원인'];

    let recommenderId: number | null = null;
    let sponsorId: number | null = null;

    // 추천인 조회 ("회사"는 null)
    if (recommenderName && recommenderName !== '회사') {
      const recommender = createdMembers.get(recommenderName);
      if (recommender) {
        recommenderId = recommender.id;
      } else {
        console.log(`  ⚠️  ${name}의 추천인 "${recommenderName}"을 찾을 수 없음`);
      }
    }

    // 후원인 조회 ("회사"는 null)
    if (sponsorName && sponsorName !== '회사') {
      const sponsor = createdMembers.get(sponsorName);
      if (sponsor) {
        sponsorId = sponsor.id;

        // teamLine 할당 (1, 2, 3 균등 분배)
        const teamCounts = await Promise.all(
          [1, 2, 3].map(async (teamLine) => {
            const count = await prisma.member.count({
              where: { sponsorId: sponsor.id, teamLine, isActive: true },
            });
            return { teamLine, count };
          }),
        );

        teamCounts.sort((a, b) => a.count - b.count);
        const assignedTeamLine = teamCounts[0].teamLine;

        // 회원 업데이트
        await prisma.member.update({
          where: { id: member.id },
          data: {
            recommenderId,
            sponsorId,
            teamLine: assignedTeamLine,
          },
        });

        console.log(
          `  ✓ ${name} → 추천인: ${recommenderName || '없음'}, 후원인: ${sponsorName} (팀${assignedTeamLine})`,
        );
      } else {
        console.log(`  ⚠️  ${name}의 후원인 "${sponsorName}"을 찾을 수 없음`);

        // 추천인만 업데이트
        await prisma.member.update({
          where: { id: member.id },
          data: { recommenderId },
        });
      }
    } else {
      // 후원인이 없는 경우 추천인만 업데이트
      if (recommenderId) {
        await prisma.member.update({
          where: { id: member.id },
          data: { recommenderId },
        });
      }
    }
  }

  console.log('\n✅ 2차 패스 완료\n');

  // 검증
  console.log('📊 데이터 검증...');

  const totalMembers = await prisma.member.count();
  const withRecommender = await prisma.member.count({
    where: { recommenderId: { not: null } },
  });
  const withSponsor = await prisma.member.count({
    where: { sponsorId: { not: null } },
  });
  const orphanMembers = await prisma.member.count({
    where: {
      AND: [{ recommenderId: null }, { sponsorId: null }],
    },
  });

  console.log(`  총 회원 수: ${totalMembers}명`);
  console.log(`  추천인 있는 회원: ${withRecommender}명`);
  console.log(`  후원인 있는 회원: ${withSponsor}명`);
  console.log(`  최상위 회원 (추천인/후원인 없음): ${orphanMembers}명\n`);

  // 계보 트리 샘플 출력
  console.log('🌳 추천계보 트리 샘플 (상위 5명):');
  const topRecommenders = await prisma.member.findMany({
    where: { recommenderId: null },
    take: 5,
    include: {
      _count: {
        select: { recommendees: true },
      },
    },
  });

  for (const recommender of topRecommenders) {
    console.log(`  ${recommender.name} → 직접 추천: ${recommender._count.recommendees}명`);
  }

  console.log('\n🌳 후원계보 트리 샘플 (상위 5명):');
  const topSponsors = await prisma.member.findMany({
    where: { sponsorId: null },
    take: 5,
    include: {
      _count: {
        select: { sponsorees: true },
      },
    },
  });

  for (const sponsor of topSponsors) {
    console.log(`  ${sponsor.name} → 직접 후원: ${sponsor._count.sponsorees}명`);
  }

  console.log('\n✨ 회원 임포트 완료!\n');
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
