/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient, MemberGrade } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// openpyxl로 변환된 JSON 데이터를 사용 (Python 스크립트로 먼저 변환)
const prisma = new PrismaClient();

// 센터 매핑 (소속지점 이름 → 센터 ID)
const CENTER_MAPPING: Record<string, number> = {
  서울: 1543,
  부산: 1542,
  대구: 1544,
  안동: 1545,
};

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
    차: 'cha',
    주: 'joo',
    우: 'woo',
    구: 'koo',
    금: 'geum',
    유: 'yoo',
    변: 'byun',
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
    영자: 'youngja',
    영희: 'younghee',
    순자: 'soonja',
    춘자: 'choonja',
    옥순: 'oksoon',
    복순: 'boksoon',
    순희: 'soonhee',
    연희: 'yeonhee',
    정희: 'junghee',
    미자: 'mija',
    순옥: 'soonok',
    명자: 'myungja',
    경자: 'kyungja',
    복자: 'bokja',
    정자: 'jungja',
    숙자: 'sookja',
    진희: 'jinhee',
    선희: 'sunhee',
    은희: 'eunhee',
    현숙: 'hyunsook',
    영미: 'youngmi',
    현정: 'hyunjung',
    수정: 'sujung',
    지영: 'jiyoung',
    수진: 'sujin',
    미정: 'mijung',
    은정: 'eunjung',
    지현: 'jihyun',
    현주: 'hyunju',
    영선: 'youngsun',
    경희: 'kyunghee',
    수현: 'soohyun',
    민지: 'minji',
    지은: 'jieun',
    예진: 'yejin',
    서영: 'seoyoung',
    지혜: 'jihye',
    윤정: 'yunjung',
    혜진: 'hyejin',
    소영: 'soyoung',
    민수: 'minsoo',
    상호: 'sangho',
    상철: 'sangcheol',
    동수: 'dongsoo',
    영수: 'youngsoo',
    성진: 'sungjin',
    영호: 'youngho',
    상훈: 'sanghoon',
    기철: 'kicheol',
    현수: 'hyunsoo',
    성수: 'sungsoo',
    재석: 'jaeseok',
    동현: 'donghyun',
    준호: 'junho',
    태호: 'taeho',
    민호: 'minho',
    승호: 'seungho',
    광수: 'kwangsoo',
    재현: 'jaehyun',
    명수: 'myungsoo',
    창수: 'changsoo',
    종호: 'jongho',
    인호: 'inho',
    기호: 'kiho',
    병호: 'byungho',
    기영: 'kiyoung',
    명호: 'myungho',
    창호: 'changho',
  };

  const lastName = name.charAt(0);
  const firstName = name.substring(1);

  const romanLastName = romanizationMap[lastName] || lastName.toLowerCase();
  const romanFirstName =
    romanizationMap[firstName] || firstName.toLowerCase().replace(/[^a-z]/g, '');

  return romanLastName + romanFirstName;
}

// 주민번호에서 생년월일 추출
function extractBirthDate(residentNumber: string | number): Date | null {
  if (!residentNumber) return null;

  const numStr = String(residentNumber).replace(/[\s\-]/g, '');
  if (numStr.length < 6) return null;

  const birthPart = numStr.substring(0, 6);
  const year = parseInt(birthPart.substring(0, 2));
  const month = parseInt(birthPart.substring(2, 4));
  const day = parseInt(birthPart.substring(4, 6));

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const fullYear = year >= 50 ? 1900 + year : 2000 + year;

  try {
    const date = new Date(fullYear, month - 1, day);
    if (date.getMonth() !== month - 1) return null;
    return date;
  } catch {
    return null;
  }
}

// 전화번호 정규화
function normalizePhone(phone: string): string {
  return phone?.replace(/[\s\-]/g, '') || '';
}

// 계좌번호 정규화
function normalizeAccount(account: string | number): string {
  return String(account || '').replace(/[\s\-]/g, '');
}

interface ExcelRow {
  회원명: string;
  주민번호: string | number;
  전화번호: string;
  은행: string;
  계좌번호: string | number;
  예금주: string;
  추천인: string;
  후원인: string;
  금액: number;
  point: number;
  소속지점: string;
  '주 소': string;
}

async function main() {
  console.log('🌱 엑셀 회원 데이터 임포트 시작...\n');

  // Python으로 변환된 JSON 파일 읽기
  const fs = await import('fs');
  const path = await import('path');

  const jsonPath = path.join('/app', 'excel-members.json');

  if (!fs.existsSync(jsonPath)) {
    console.log('❌ excel-members.json 파일이 없습니다.');
    console.log('📝 먼저 Python으로 엑셀을 JSON으로 변환해주세요:');
    console.log(`
python3 -c "
from openpyxl import load_workbook
import json

wb = load_workbook('/app/뷰젬_회원등록.xlsx')
ws = wb.active

headers = [cell.value for cell in ws[2] if cell.value]
data = []

for row in ws.iter_rows(min_row=3, values_only=True):
    if row[1]:  # 회원명이 있으면
        row_data = {}
        for i, h in enumerate(headers):
            row_data[h] = row[i + 1]  # 첫 번째 컬럼은 비어있음
        data.append(row_data)

with open('/app/excel-members.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'변환 완료: {len(data)}명')
"
    `);
    process.exit(1);
  }

  const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
  const excelData: ExcelRow[] = JSON.parse(jsonContent);

  console.log(`✅ JSON 파일 로드 완료: ${excelData.length}명\n`);

  // ADMIN/CENTER 회원 확인
  console.log('👑 ADMIN/CENTER 회원 확인...');
  const adminCenterMembers = await prisma.member.findMany({
    where: { grade: { in: ['ADMIN', 'CENTER'] }, deletedAt: null },
    select: { id: true, name: true, grade: true },
  });
  console.log(`  유지할 회원: ${adminCenterMembers.length}명`);
  adminCenterMembers.forEach((m) => console.log(`    - ${m.name} (${m.grade})`));

  // 기존 회원 삭제 (ADMIN/CENTER 제외)
  console.log('\n🗑️  기존 회원 데이터 삭제 (ADMIN/CENTER 제외)...');

  const deleteCondition = {
    grade: { notIn: ['ADMIN', 'CENTER'] as MemberGrade[] },
  };

  // 관련 데이터 먼저 삭제
  await prisma.bonus.deleteMany({
    where: { member: deleteCondition },
  });
  console.log('  - Bonus 삭제 완료');

  await prisma.sale.deleteMany({
    where: { seller: deleteCondition },
  });
  console.log('  - Sale 삭제 완료');

  // 회원 삭제
  const deleteResult = await prisma.member.deleteMany({
    where: deleteCondition,
  });
  console.log(`  - Member 삭제 완료: ${deleteResult.count}명\n`);

  // 1차 패스: 모든 회원 생성 (추천인/후원인 관계 제외)
  console.log('👥 1차 패스: 회원 기본 정보 생성...');

  const hashedPassword = await bcrypt.hash('Kaion2024!', 10);
  const createdMembers: Map<string, { id: number; centerName: string }> = new Map();
  const usernameCount: Map<string, number> = new Map();

  for (const row of excelData) {
    const name = row['회원명'];
    if (!name) continue;

    // username 생성 (중복 방지)
    let baseUsername = nameToUsername(name);
    const count = usernameCount.get(baseUsername) || 0;
    usernameCount.set(baseUsername, count + 1);

    const username = count > 0 ? `${baseUsername}${count}` : baseUsername;

    // 생년월일 추출
    const birthDate = extractBirthDate(row['주민번호']);

    // 소속지점
    const centerName = row['소속지점'] || '서울';

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
          accountNumber: normalizeAccount(row['계좌번호']) || null,
          accountHolder: row['예금주'] || null,
          address: row['주 소'] || null,
          centerName,
          grade: MemberGrade.MEMBER,
          isActive: true,
          cumulativePv: row['point'] || 0,
        },
      });

      createdMembers.set(name, { id: member.id, centerName });
      console.log(`  ✓ ${name} (${username}) - ${centerName}`);
    } catch (error) {
      console.error(`  ✗ ${name} 생성 실패:`, error);
    }
  }

  console.log(`\n✅ 1차 패스 완료: ${createdMembers.size}명 생성\n`);

  // 2차 패스: 추천인/후원인 관계 설정
  console.log('🔗 2차 패스: 추천인/후원인 관계 설정...');

  for (const row of excelData) {
    const name = row['회원명'];
    if (!name) continue;

    const memberInfo = createdMembers.get(name);
    if (!memberInfo) continue;

    const recommenderName = row['추천인'];
    const sponsorName = row['후원인'];
    const centerName = memberInfo.centerName;

    let recommenderId: number | null = null;
    let sponsorId: number | null = null;
    let teamLine: number | null = null;

    // 추천인 조회
    if (recommenderName === '회사') {
      // "회사" → 소속지점 센터로 매핑
      recommenderId = CENTER_MAPPING[centerName] || CENTER_MAPPING['서울'];
    } else if (recommenderName) {
      const recommender = createdMembers.get(recommenderName);
      if (recommender) {
        recommenderId = recommender.id;
      } else {
        // 센터에서 찾기
        const centerMember = await prisma.member.findFirst({
          where: { name: recommenderName, grade: 'CENTER' },
        });
        if (centerMember) {
          recommenderId = centerMember.id;
        } else {
          console.log(`  ⚠️  ${name}의 추천인 "${recommenderName}"을 찾을 수 없음`);
        }
      }
    }

    // 후원인 조회
    if (sponsorName === '회사') {
      // "회사" → 소속지점 센터로 매핑
      sponsorId = CENTER_MAPPING[centerName] || CENTER_MAPPING['서울'];
    } else if (sponsorName) {
      const sponsor = createdMembers.get(sponsorName);
      if (sponsor) {
        sponsorId = sponsor.id;
      } else {
        // 센터에서 찾기
        const centerMember = await prisma.member.findFirst({
          where: { name: sponsorName, grade: 'CENTER' },
        });
        if (centerMember) {
          sponsorId = centerMember.id;
        } else {
          console.log(`  ⚠️  ${name}의 후원인 "${sponsorName}"을 찾을 수 없음`);
        }
      }
    }

    // teamLine 자동 할당 (후원인이 있을 경우)
    if (sponsorId) {
      const teamCounts = await Promise.all(
        [1, 2, 3].map(async (tl) => {
          const count = await prisma.member.count({
            where: { sponsorId, teamLine: tl, isActive: true },
          });
          return { teamLine: tl, count };
        }),
      );
      teamCounts.sort((a, b) => a.count - b.count);
      teamLine = teamCounts[0].teamLine;
    }

    // 회원 업데이트
    await prisma.member.update({
      where: { id: memberInfo.id },
      data: {
        recommenderId,
        sponsorId,
        teamLine,
      },
    });

    const recDisplay = recommenderName === '회사' ? `${centerName}센터` : recommenderName || '없음';
    const spoDisplay = sponsorName === '회사' ? `${centerName}센터` : sponsorName || '없음';
    console.log(
      `  ✓ ${name} → 추천: ${recDisplay}, 후원: ${spoDisplay}${teamLine ? ` (팀${teamLine})` : ''}`,
    );
  }

  console.log('\n✅ 2차 패스 완료\n');

  // 검증
  console.log('📊 데이터 검증...');

  const totalMembers = await prisma.member.count({ where: { deletedAt: null } });
  const withRecommender = await prisma.member.count({
    where: { recommenderId: { not: null }, deletedAt: null },
  });
  const withSponsor = await prisma.member.count({
    where: { sponsorId: { not: null }, deletedAt: null },
  });

  const byGrade = await prisma.member.groupBy({
    by: ['grade'],
    where: { deletedAt: null },
    _count: true,
  });

  console.log(`  총 회원 수: ${totalMembers}명`);
  console.log(`  등급별:`);
  byGrade.forEach((g) => console.log(`    - ${g.grade}: ${g._count}명`));
  console.log(`  추천인 있는 회원: ${withRecommender}명`);
  console.log(`  후원인 있는 회원: ${withSponsor}명\n`);

  // 센터별 회원 수
  console.log('🏢 센터별 회원 수:');
  for (const [centerName, centerId] of Object.entries(CENTER_MAPPING)) {
    const count = await prisma.member.count({
      where: { centerName, grade: 'MEMBER', deletedAt: null },
    });
    console.log(`  ${centerName}: ${count}명`);
  }

  // 계보 트리 샘플
  console.log('\n🌳 추천계보 트리 (센터별 직접 추천 수):');
  for (const [centerName, centerId] of Object.entries(CENTER_MAPPING)) {
    const count = await prisma.member.count({
      where: { recommenderId: centerId, deletedAt: null },
    });
    console.log(`  ${centerName}센터 → 직접 추천: ${count}명`);
  }

  console.log('\n🌳 후원계보 트리 (센터별 직접 후원 수):');
  for (const [centerName, centerId] of Object.entries(CENTER_MAPPING)) {
    const count = await prisma.member.count({
      where: { sponsorId: centerId, deletedAt: null },
    });
    console.log(`  ${centerName}센터 → 직접 후원: ${count}명`);
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
