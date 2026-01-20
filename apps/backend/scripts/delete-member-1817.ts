/**
 * 회원 ID 1817 (홍길동) 테스트 데이터 삭제 스크립트
 *
 * 실행 방법:
 * docker exec -it beaugem_app npx ts-node scripts/delete-member-1817.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteMember1817() {
  const memberId = 1817;

  console.log('===========================================');
  console.log(`회원 ID ${memberId} 삭제 시작...`);
  console.log('===========================================\n');

  // 삭제 전 회원 정보 확인
  const member = await prisma.member.findUnique({
    where: { id: memberId },
  });

  if (!member) {
    console.log(`회원 ID ${memberId}가 존재하지 않습니다.`);
    await prisma.$disconnect();
    return;
  }

  console.log('삭제 대상 회원 정보:');
  console.log(`- ID: ${member.id}`);
  console.log(`- 이름: ${member.name}`);
  console.log(`- 아이디: ${member.username}`);
  console.log(`- 등급: ${member.grade}`);
  console.log(`- 가입일: ${member.createdAt}\n`);

  // 관련 데이터 수 확인
  const [
    recommendeeCount,
    sponsoreeCount,
    activityLogCount,
    recognizedSalesCount,
    orderCount,
    seminarCount,
    saleCount,
    bonusCount,
    cultivationCount,
    settlementConfirmCount,
  ] = await Promise.all([
    prisma.member.count({ where: { recommenderId: memberId } }),
    prisma.member.count({ where: { sponsorId: memberId } }),
    prisma.activityLog.count({ where: { memberId } }),
    prisma.recognizedSales.count({
      where: { OR: [{ memberId }, { createdBy: memberId }, { deactivatedBy: memberId }] },
    }),
    prisma.order.count({ where: { memberId } }),
    prisma.seminar.count({ where: { hostId: memberId } }),
    prisma.sale.count({ where: { sellerId: memberId } }),
    prisma.bonus.count({ where: { memberId } }),
    prisma.cultivationRecord.count({
      where: { OR: [{ cultivatorId: memberId }, { cultivatedMemberId: memberId }] },
    }),
    prisma.settlement.count({ where: { confirmedBy: memberId } }),
  ]);

  console.log('관련 데이터 현황:');
  console.log(`- 하위 추천인 수: ${recommendeeCount}`);
  console.log(`- 하위 후원인 수: ${sponsoreeCount}`);
  console.log(`- 활동 로그: ${activityLogCount}건`);
  console.log(`- 인정 실적: ${recognizedSalesCount}건`);
  console.log(`- 주문: ${orderCount}건`);
  console.log(`- 세미나: ${seminarCount}건`);
  console.log(`- 판매: ${saleCount}건`);
  console.log(`- 수당: ${bonusCount}건`);
  console.log(`- 육성 기록: ${cultivationCount}건`);
  console.log(`- 정산 확인자: ${settlementConfirmCount}건\n`);

  try {
    // 트랜잭션으로 안전하게 삭제
    await prisma.$transaction(async (tx) => {
      console.log('1. 하위 회원 FK 해제 중...');
      // 추천인 FK 해제
      const recommendeeUpdate = await tx.member.updateMany({
        where: { recommenderId: memberId },
        data: { recommenderId: null },
      });
      console.log(`   - 추천인 해제: ${recommendeeUpdate.count}명`);

      // 후원인 FK 해제
      const sponsoreeUpdate = await tx.member.updateMany({
        where: { sponsorId: memberId },
        data: { sponsorId: null, teamLine: null },
      });
      console.log(`   - 후원인 해제: ${sponsoreeUpdate.count}명`);

      console.log('\n2. 정산 확인자 FK 해제 중...');
      const settlementUpdate = await tx.settlement.updateMany({
        where: { confirmedBy: memberId },
        data: { confirmedBy: null },
      });
      console.log(`   - 정산 확인자 해제: ${settlementUpdate.count}건`);

      console.log('\n3. 관련 데이터 삭제 중...');

      // 활동 로그 삭제
      const activityLogDelete = await tx.activityLog.deleteMany({
        where: { memberId },
      });
      console.log(`   - 활동 로그 삭제: ${activityLogDelete.count}건`);

      // 인정 실적 삭제
      const recognizedSalesDelete = await tx.recognizedSales.deleteMany({
        where: {
          OR: [{ memberId }, { createdBy: memberId }, { deactivatedBy: memberId }],
        },
      });
      console.log(`   - 인정 실적 삭제: ${recognizedSalesDelete.count}건`);

      // 주문 삭제 (OrderItem은 CASCADE로 자동 삭제)
      const orderDelete = await tx.order.deleteMany({
        where: { memberId },
      });
      console.log(`   - 주문 삭제: ${orderDelete.count}건 (OrderItem CASCADE 삭제)`);

      // 세미나 삭제
      const seminarDelete = await tx.seminar.deleteMany({
        where: { hostId: memberId },
      });
      console.log(`   - 세미나 삭제: ${seminarDelete.count}건`);

      // 판매 삭제 전 관련 보너스 FK 해제
      const bonusSaleUpdate = await tx.bonus.updateMany({
        where: { sale: { sellerId: memberId } },
        data: { saleId: null },
      });
      console.log(`   - 판매 관련 보너스 FK 해제: ${bonusSaleUpdate.count}건`);

      // 판매 삭제
      const saleDelete = await tx.sale.deleteMany({
        where: { sellerId: memberId },
      });
      console.log(`   - 판매 삭제: ${saleDelete.count}건`);

      // 보너스 삭제 (CASCADE 설정이지만 명시적 삭제)
      const bonusDelete = await tx.bonus.deleteMany({
        where: { memberId },
      });
      console.log(`   - 보너스 삭제: ${bonusDelete.count}건`);

      // 육성 기록 삭제 (CASCADE 설정이지만 명시적 삭제)
      const cultivationDelete = await tx.cultivationRecord.deleteMany({
        where: {
          OR: [{ cultivatorId: memberId }, { cultivatedMemberId: memberId }],
        },
      });
      console.log(`   - 육성 기록 삭제: ${cultivationDelete.count}건`);

      console.log('\n4. 회원 삭제 중...');
      await tx.member.delete({ where: { id: memberId } });
      console.log(`   - 회원 ID ${memberId} 삭제 완료`);
    });

    console.log('\n===========================================');
    console.log(`회원 ID ${memberId} (${member.name}) 삭제 완료!`);
    console.log('===========================================');
  } catch (error) {
    console.error('\n삭제 중 오류 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
deleteMember1817()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('스크립트 실행 실패:', error);
    process.exit(1);
  });
