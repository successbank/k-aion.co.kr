/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  PrismaClient,
  MemberGrade,
  BonusType,
  BonusStatus,
  SaleStatus,
  SettlementStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (in reverse order of dependencies)
  await prisma.bonus.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.seminar.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.member.deleteMany();

  console.log('✅ Cleared existing data');

  // 1. Create Admin user
  const hashedPassword = await bcrypt.hash('admin123!@#', 10);
  const admin = await prisma.member.create({
    data: {
      username: 'admin',
      email: 'admin@kaion.com',
      password: hashedPassword,
      name: '시스템 관리자',
      phone: '010-0000-0000',
      grade: MemberGrade.ADMIN,
      isActive: true,
      emailVerified: true,
      cumulativePv: 10000000,
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // 2. Create sample members with dual genealogy structure
  // 추천 계보와 후원 계보를 구분하기 위한 배열 분리
  const members: any[] = [admin];
  const divisionChiefs: any[] = [];
  const branchChiefs: any[] = [];
  const managers: any[] = [];
  const agents: any[] = [];

  // Create Division Chiefs (본부장) - 2명
  // 추천: admin → 본부장1, 본부장2 (동일)
  // 후원: admin → 본부장1(팀1), 본부장2(팀2)
  for (let i = 1; i <= 2; i++) {
    const divisionChief = await prisma.member.create({
      data: {
        username: `division${i}`,
        email: `division${i}@kaion.com`,
        password: hashedPassword,
        name: `본부장${i}`,
        phone: `010-1000-000${i}`,
        grade: MemberGrade.DIVISION_CHIEF,
        recommenderId: admin.id, // 추천: admin
        sponsorId: admin.id, // 후원: admin
        teamLine: i, // 후원 팀: 1 or 2
        cumulativePv: 5000000,
        isActive: true,
        emailVerified: true,
      },
    });
    members.push(divisionChief);
    divisionChiefs.push(divisionChief);
  }
  console.log('✅ Created 2 Division Chiefs');

  // Create Branch Chiefs (지부장) - 6명
  // 추천 계보: 본부장이 추천하되 분배를 다르게
  //   - 본부장1: 지부장1, 지부장2, 지부장3, 지부장4 (4명 추천)
  //   - 본부장2: 지부장5, 지부장6 (2명 추천)
  // 후원 계보: 각 본부장 아래 3명씩 (3팀 구조 유지)
  //   - 본부장1: 지부장1(팀1), 지부장2(팀2), 지부장3(팀3)
  //   - 본부장2: 지부장4(팀1), 지부장5(팀2), 지부장6(팀3)
  for (let i = 0; i < 2; i++) {
    const sponsorDivisionChief = divisionChiefs[i];
    for (let j = 1; j <= 3; j++) {
      const branchIndex = i * 3 + j;

      // 추천인 결정: 본부장1이 처음 4명, 본부장2가 나머지 2명 추천
      const recommenderDivisionChief = branchIndex <= 4 ? divisionChiefs[0] : divisionChiefs[1];

      const branchChief = await prisma.member.create({
        data: {
          username: `branch${branchIndex}`,
          email: `branch${branchIndex}@kaion.com`,
          password: hashedPassword,
          name: `지부장${branchIndex}`,
          phone: `010-2${i}00-00${j}0`,
          grade: MemberGrade.BRANCH_CHIEF,
          recommenderId: recommenderDivisionChief.id, // 추천: 본부장 (분배 다름)
          sponsorId: sponsorDivisionChief.id, // 후원: 각 본부장 3명씩
          teamLine: j, // 후원 팀: 1, 2, 3
          cumulativePv: 3000000,
          isActive: true,
          emailVerified: true,
        },
      });
      members.push(branchChief);
      branchChiefs.push(branchChief);
    }
  }
  console.log('✅ Created 6 Branch Chiefs');

  // Create Managers (매니저) - 18명
  // 추천 계보: 지부장들이 추천하되 분배를 다양하게
  //   - 지부장1: 매니저1, 매니저2 (2명)
  //   - 지부장2: 매니저3, 매니저4, 매니저5, 매니저6 (4명)
  //   - 지부장3: 매니저7, 매니저8, 매니저9 (3명)
  //   - 지부장4: 매니저10, 매니저11, 매니저12 (3명)
  //   - 지부장5: 매니저13, 매니저14 (2명)
  //   - 지부장6: 매니저15, 매니저16, 매니저17, 매니저18 (4명)
  // 후원 계보: 각 지부장 아래 3명씩 (3팀 구조 유지)
  const managerRecommenderMap = [1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 6, 6, 6, 6]; // 18명의 추천 지부장 인덱스

  for (let i = 0; i < 6; i++) {
    const sponsorBranchChief = branchChiefs[i];
    for (let j = 1; j <= 3; j++) {
      const managerIndex = i * 3 + j;
      const recommenderBranchChiefIndex = managerRecommenderMap[managerIndex - 1] - 1; // 0-based index
      const recommenderBranchChief = branchChiefs[recommenderBranchChiefIndex];

      const manager = await prisma.member.create({
        data: {
          username: `manager${managerIndex}`,
          email: `manager${managerIndex}@kaion.com`,
          password: hashedPassword,
          name: `매니저${managerIndex}`,
          phone: `010-3${i}00-00${j}0`,
          grade: MemberGrade.MANAGER,
          recommenderId: recommenderBranchChief.id, // 추천: 지부장 (분배 다름)
          sponsorId: sponsorBranchChief.id, // 후원: 각 지부장 3명씩
          teamLine: j, // 후원 팀: 1, 2, 3
          cumulativePv: 2000000,
          isActive: true,
          emailVerified: true,
        },
      });
      members.push(manager);
      managers.push(manager);
    }
  }
  console.log('✅ Created 18 Managers');

  // Create Agents (에이전트) - 54명
  // 추천 계보: 매니저들이 추천하되, 일부는 다른 매니저가 추천
  //   - 대부분은 자신의 후원 매니저가 추천하지만
  //   - 일부(30%)는 인접한 매니저가 추천
  // 후원 계보: 각 매니저 아래 3명씩 (3팀 구조 유지)
  for (let i = 0; i < 18; i++) {
    const sponsorManager = managers[i];
    for (let j = 1; j <= 3; j++) {
      const agentIndex = i * 3 + j;

      // 추천인 결정: 70%는 자신의 후원 매니저, 30%는 인접 매니저
      let recommenderManager = sponsorManager;
      if (agentIndex % 10 < 3) {
        // 30% 확률로 다른 매니저가 추천
        const otherManagerIndex = (i + 1) % 18; // 다음 매니저
        recommenderManager = managers[otherManagerIndex];
      }

      const agent = await prisma.member.create({
        data: {
          username: `agent${agentIndex}`,
          email: `agent${agentIndex}@kaion.com`,
          password: hashedPassword,
          name: `에이전트${agentIndex}`,
          phone: `010-4${i % 10}0${Math.floor(i / 10)}-${j}000`,
          grade: MemberGrade.AGENT,
          recommenderId: recommenderManager.id, // 추천: 매니저 (일부 다름)
          sponsorId: sponsorManager.id, // 후원: 각 매니저 3명씩
          teamLine: j, // 후원 팀: 1, 2, 3
          cumulativePv: 1500000,
          agentPromotedAt: new Date('2024-06-01'),
          isActive: true,
          emailVerified: true,
          bankName: '국민은행',
          accountNumber: `123-456-${String(agentIndex).padStart(6, '0')}`,
          accountHolder: `에이전트${agentIndex}`,
        },
      });
      members.push(agent);
      agents.push(agent);
    }
  }
  console.log('✅ Created 54 Agents');

  // Create Members (회원) - 162명
  // 추천 계보: 에이전트들이 추천하되, 일부는 다른 에이전트가 추천
  //   - 대부분은 자신의 후원 에이전트가 추천하지만
  //   - 일부(40%)는 인접한 에이전트가 추천
  // 후원 계보: 각 에이전트 아래 3명씩 (3팀 구조 유지)
  for (let i = 0; i < 54; i++) {
    const sponsorAgent = agents[i];
    for (let j = 1; j <= 3; j++) {
      const memberIndex = i * 3 + j;

      // 추천인 결정: 60%는 자신의 후원 에이전트, 40%는 인접 에이전트
      let recommenderAgent = sponsorAgent;
      if (memberIndex % 10 < 4) {
        // 40% 확률로 다른 에이전트가 추천
        const otherAgentIndex = (i + 2) % 54; // 두 칸 건너뛴 에이전트
        recommenderAgent = agents[otherAgentIndex];
      }

      await prisma.member.create({
        data: {
          username: `member${memberIndex}`,
          email: `member${memberIndex}@kaion.com`,
          password: hashedPassword,
          name: `회원${memberIndex}`,
          phone: `010-5${i % 10}0${Math.floor(i / 10)}-${j}000`,
          grade: MemberGrade.MEMBER,
          recommenderId: recommenderAgent.id, // 추천: 에이전트 (일부 다름)
          sponsorId: sponsorAgent.id, // 후원: 각 에이전트 3명씩
          teamLine: j, // 후원 팀: 1, 2, 3
          cumulativePv: Math.floor(Math.random() * 500000),
          isActive: true,
          emailVerified: Math.random() > 0.3,
          bankName: ['국민은행', '신한은행', '우리은행', 'NH농협'][Math.floor(Math.random() * 4)],
          accountNumber: `987-654-${String(memberIndex).padStart(6, '0')}`,
          accountHolder: `회원${memberIndex}`,
          address: `서울시 강남구 테헤란로 ${100 + memberIndex}`,
          postalCode: String(6000 + memberIndex).padStart(5, '0'),
        },
      });
    }
  }
  console.log('✅ Created 162 Members');
  console.log(`📊 Total members created: ${1 + 2 + 6 + 18 + 54 + 162} = 243명`);

  // 3. Create Categories
  const categoryData = [
    { name: '건강기능식품', level: 1, displayOrder: 1 },
    { name: '화장품', level: 1, displayOrder: 2 },
    { name: '생활용품', level: 1, displayOrder: 3 },
  ];

  const categories: { id: number; name: string; level: number; parentId: number | null }[] = [];
  for (const cat of categoryData) {
    const category = await prisma.category.create({ data: cat });
    categories.push(category);
  }

  // Create subcategories
  const subcategoryData = [
    { name: '비타민', parentId: categories[0].id, level: 2, displayOrder: 1 },
    { name: '프로바이오틱스', parentId: categories[0].id, level: 2, displayOrder: 2 },
    { name: '스킨케어', parentId: categories[1].id, level: 2, displayOrder: 1 },
    { name: '메이크업', parentId: categories[1].id, level: 2, displayOrder: 2 },
    { name: '세제', parentId: categories[2].id, level: 2, displayOrder: 1 },
  ];

  for (const subcat of subcategoryData) {
    await prisma.category.create({ data: subcat });
  }
  console.log('✅ Created 3 main categories and 5 subcategories');

  // 4. Create Products (30 products across all categories)
  const subcategories = await prisma.category.findMany({
    where: { level: 2 },
    orderBy: { id: 'asc' },
  });

  const productsData = [
    // 건강기능식품 > 비타민 (6개)
    {
      code: 'PROD-001',
      name: '멀티비타민 골드',
      categoryId: subcategories[0].id,
      price: 50000,
      pv: 45000,
      stock: 1000,
      minStock: 100,
      description: '하루 1정으로 충분한 종합 비타민',
      imageUrl: 'https://via.placeholder.com/300x300?text=Multi+Vitamin',
    },
    {
      code: 'PROD-002',
      name: '비타민 C 1000mg',
      categoryId: subcategories[0].id,
      price: 35000,
      pv: 31500,
      stock: 1500,
      minStock: 150,
      description: '고함량 비타민 C 건강기능식품',
      imageUrl: 'https://via.placeholder.com/300x300?text=Vitamin+C',
    },
    {
      code: 'PROD-003',
      name: '비타민 D 2000IU',
      categoryId: subcategories[0].id,
      price: 28000,
      pv: 25200,
      stock: 1200,
      minStock: 120,
      description: '뼈 건강과 면역력 증진',
      imageUrl: 'https://via.placeholder.com/300x300?text=Vitamin+D',
    },
    {
      code: 'PROD-004',
      name: '비타민 B 컴플렉스',
      categoryId: subcategories[0].id,
      price: 32000,
      pv: 28800,
      stock: 900,
      minStock: 90,
      description: '에너지 대사와 피로 회복',
      imageUrl: 'https://via.placeholder.com/300x300?text=Vitamin+B',
    },
    {
      code: 'PROD-005',
      name: '오메가3 프리미엄',
      categoryId: subcategories[0].id,
      price: 45000,
      pv: 40500,
      stock: 800,
      minStock: 80,
      description: 'EPA+DHA 고함량 오메가3',
      imageUrl: 'https://via.placeholder.com/300x300?text=Omega+3',
    },
    {
      code: 'PROD-006',
      name: '아이언 플러스',
      categoryId: subcategories[0].id,
      price: 25000,
      pv: 22500,
      stock: 600,
      minStock: 60,
      description: '철분 보충제, 빈혈 예방',
      imageUrl: 'https://via.placeholder.com/300x300?text=Iron+Plus',
    },

    // 건강기능식품 > 프로바이오틱스 (6개)
    {
      code: 'PROD-007',
      name: '프로바이오틱스 플러스',
      categoryId: subcategories[1].id,
      price: 60000,
      pv: 54000,
      stock: 800,
      minStock: 80,
      description: '장 건강을 위한 100억 유산균',
      imageUrl: 'https://via.placeholder.com/300x300?text=Probiotics',
    },
    {
      code: 'PROD-008',
      name: '유산균 골드',
      categoryId: subcategories[1].id,
      price: 55000,
      pv: 49500,
      stock: 700,
      minStock: 70,
      description: '19종 복합 유산균',
      imageUrl: 'https://via.placeholder.com/300x300?text=Lactobacillus',
    },
    {
      code: 'PROD-009',
      name: '장건강 프로바이오틱스',
      categoryId: subcategories[1].id,
      price: 48000,
      pv: 43200,
      stock: 900,
      minStock: 90,
      description: '장 건강 특화 유산균',
      imageUrl: 'https://via.placeholder.com/300x300?text=Gut+Health',
    },
    {
      code: 'PROD-010',
      name: '어린이 유산균',
      categoryId: subcategories[1].id,
      price: 35000,
      pv: 31500,
      stock: 1000,
      minStock: 100,
      description: '아이들을 위한 맛있는 유산균',
      imageUrl: 'https://via.placeholder.com/300x300?text=Kids+Probiotics',
    },
    {
      code: 'PROD-011',
      name: '면역 프로바이오틱스',
      categoryId: subcategories[1].id,
      price: 52000,
      pv: 46800,
      stock: 600,
      minStock: 60,
      description: '면역력 강화 특화 유산균',
      imageUrl: 'https://via.placeholder.com/300x300?text=Immune+Pro',
    },
    {
      code: 'PROD-012',
      name: '더블 프로바이오틱스',
      categoryId: subcategories[1].id,
      price: 58000,
      pv: 52200,
      stock: 500,
      minStock: 50,
      description: '200억 고함량 유산균',
      imageUrl: 'https://via.placeholder.com/300x300?text=Double+Pro',
    },

    // 화장품 > 스킨케어 (6개)
    {
      code: 'PROD-013',
      name: '히알루론산 세럼',
      categoryId: subcategories[2].id,
      price: 80000,
      pv: 72000,
      stock: 500,
      minStock: 50,
      description: '수분 공급 집중 케어 세럼',
      imageUrl: 'https://via.placeholder.com/300x300?text=Serum',
    },
    {
      code: 'PROD-014',
      name: '안티에이징 크림',
      categoryId: subcategories[2].id,
      price: 120000,
      pv: 108000,
      stock: 300,
      minStock: 30,
      description: '주름 개선 기능성 크림',
      imageUrl: 'https://via.placeholder.com/300x300?text=Anti+Aging',
    },
    {
      code: 'PROD-015',
      name: '수분 토너',
      categoryId: subcategories[2].id,
      price: 45000,
      pv: 40500,
      stock: 800,
      minStock: 80,
      description: '피부 진정 보습 토너',
      imageUrl: 'https://via.placeholder.com/300x300?text=Toner',
    },
    {
      code: 'PROD-016',
      name: '비타민 에센스',
      categoryId: subcategories[2].id,
      price: 65000,
      pv: 58500,
      stock: 600,
      minStock: 60,
      description: '피부 톤 개선 에센스',
      imageUrl: 'https://via.placeholder.com/300x300?text=Essence',
    },
    {
      code: 'PROD-017',
      name: '아이크림 프리미엄',
      categoryId: subcategories[2].id,
      price: 95000,
      pv: 85500,
      stock: 400,
      minStock: 40,
      description: '눈가 탄력 집중 케어',
      imageUrl: 'https://via.placeholder.com/300x300?text=Eye+Cream',
    },
    {
      code: 'PROD-018',
      name: '콜라겐 앰플',
      categoryId: subcategories[2].id,
      price: 78000,
      pv: 70200,
      stock: 550,
      minStock: 55,
      description: '피부 탄력 콜라겐 앰플',
      imageUrl: 'https://via.placeholder.com/300x300?text=Collagen',
    },

    // 화장품 > 메이크업 (6개)
    {
      code: 'PROD-019',
      name: 'BB크림 SPF50+',
      categoryId: subcategories[3].id,
      price: 38000,
      pv: 34200,
      stock: 1000,
      minStock: 100,
      description: '자외선 차단 비비크림',
      imageUrl: 'https://via.placeholder.com/300x300?text=BB+Cream',
    },
    {
      code: 'PROD-020',
      name: '쿠션 파운데이션',
      categoryId: subcategories[3].id,
      price: 42000,
      pv: 37800,
      stock: 900,
      minStock: 90,
      description: '촉촉한 쿠션 팩트',
      imageUrl: 'https://via.placeholder.com/300x300?text=Cushion',
    },
    {
      code: 'PROD-021',
      name: '립스틱 세트',
      categoryId: subcategories[3].id,
      price: 55000,
      pv: 49500,
      stock: 700,
      minStock: 70,
      description: '5가지 컬러 립스틱',
      imageUrl: 'https://via.placeholder.com/300x300?text=Lipstick',
    },
    {
      code: 'PROD-022',
      name: '아이섀도우 팔레트',
      categoryId: subcategories[3].id,
      price: 48000,
      pv: 43200,
      stock: 600,
      minStock: 60,
      description: '12색 아이섀도우',
      imageUrl: 'https://via.placeholder.com/300x300?text=Eyeshadow',
    },
    {
      code: 'PROD-023',
      name: '마스카라 롱래쉬',
      categoryId: subcategories[3].id,
      price: 32000,
      pv: 28800,
      stock: 800,
      minStock: 80,
      description: '속눈썹 볼륨 마스카라',
      imageUrl: 'https://via.placeholder.com/300x300?text=Mascara',
    },
    {
      code: 'PROD-024',
      name: '글로우 하이라이터',
      categoryId: subcategories[3].id,
      price: 35000,
      pv: 31500,
      stock: 500,
      minStock: 50,
      description: '윤광 하이라이터',
      imageUrl: 'https://via.placeholder.com/300x300?text=Highlighter',
    },

    // 생활용품 > 세제 (6개)
    {
      code: 'PROD-025',
      name: '친환경 세탁세제',
      categoryId: subcategories[4].id,
      price: 30000,
      pv: 27000,
      stock: 2000,
      minStock: 200,
      description: '피부에 자극없는 친환경 세제',
      imageUrl: 'https://via.placeholder.com/300x300?text=Detergent',
    },
    {
      code: 'PROD-026',
      name: '섬유유연제',
      categoryId: subcategories[4].id,
      price: 25000,
      pv: 22500,
      stock: 1800,
      minStock: 180,
      description: '은은한 향기 섬유유연제',
      imageUrl: 'https://via.placeholder.com/300x300?text=Softener',
    },
    {
      code: 'PROD-027',
      name: '주방세제',
      categoryId: subcategories[4].id,
      price: 18000,
      pv: 16200,
      stock: 2500,
      minStock: 250,
      description: '강력 세척 주방세제',
      imageUrl: 'https://via.placeholder.com/300x300?text=Dish+Soap',
    },
    {
      code: 'PROD-028',
      name: '다목적 클리너',
      categoryId: subcategories[4].id,
      price: 22000,
      pv: 19800,
      stock: 1500,
      minStock: 150,
      description: '올인원 다목적 세정제',
      imageUrl: 'https://via.placeholder.com/300x300?text=Cleaner',
    },
    {
      code: 'PROD-029',
      name: '욕실 클리너',
      categoryId: subcategories[4].id,
      price: 20000,
      pv: 18000,
      stock: 1200,
      minStock: 120,
      description: '물때 제거 욕실 세정제',
      imageUrl: 'https://via.placeholder.com/300x300?text=Bathroom',
    },
    {
      code: 'PROD-030',
      name: '유리 세정제',
      categoryId: subcategories[4].id,
      price: 15000,
      pv: 13500,
      stock: 1000,
      minStock: 100,
      description: '얼룩없는 유리 세정제',
      imageUrl: 'https://via.placeholder.com/300x300?text=Glass+Cleaner',
    },
  ];

  const products: { id: number; code: string; price: number; pv: number }[] = [];
  for (const prod of productsData) {
    const product = await prisma.product.create({ data: prod });
    products.push(product);
  }
  console.log('✅ Created 30 products');

  // 5. Helper function: Get ISO week number
  function getWeekCode(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-${String(weekNo).padStart(2, '0')}`;
  }

  // Create Weekly Settlements for last 8 weeks (2024-44 ~ 2024-52)
  const settlements: { id: number; weekCode: string; startDate: Date; endDate: Date }[] = [];
  const weekRanges = [
    { weekCode: '2024-44', startDate: '2024-10-27', endDate: '2024-11-02' },
    { weekCode: '2024-45', startDate: '2024-11-03', endDate: '2024-11-09' },
    { weekCode: '2024-46', startDate: '2024-11-10', endDate: '2024-11-16' },
    { weekCode: '2024-47', startDate: '2024-11-17', endDate: '2024-11-23' },
    { weekCode: '2024-48', startDate: '2024-11-24', endDate: '2024-11-30' },
    { weekCode: '2024-49', startDate: '2024-12-01', endDate: '2024-12-07' },
    { weekCode: '2024-50', startDate: '2024-12-08', endDate: '2024-12-14' },
    { weekCode: '2024-51', startDate: '2024-12-15', endDate: '2024-12-21' },
    { weekCode: '2024-52', startDate: '2024-12-22', endDate: '2024-12-28' },
  ];

  for (const week of weekRanges) {
    const settlement = await prisma.settlement.create({
      data: {
        weekCode: week.weekCode,
        startDate: new Date(week.startDate),
        endDate: new Date(week.endDate),
        status: week.weekCode === '2024-52' ? SettlementStatus.OPEN : SettlementStatus.CLOSED,
        totalSales: 0,
        totalPv: 0,
        totalBonuses: 0,
      },
    });
    settlements.push(settlement);
  }
  console.log('✅ Created 9 weekly settlements (2024-44 ~ 2024-52)');

  // 6. Create Sales across 60 days (2024-11-01 ~ 2024-12-29)
  const startDate = new Date('2024-11-01');
  const endDate = new Date('2024-12-29');
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  let saleCounter = 0;
  const settlementTotals: Record<string, { sales: number; pv: number }> = {};

  for (let day = 0; day <= totalDays; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    const dayOfMonth = currentDate.getDate();

    // 주말과 월말에 판매량 증가 (현실적 패턴)
    let salesCountForDay = Math.floor(Math.random() * 3) + 3; // 기본 3-5건
    if (dayOfWeek === 0 || dayOfWeek === 6) salesCountForDay += 3; // 주말 +3건
    if (dayOfMonth >= 25) salesCountForDay += 2; // 월말 +2건

    const weekCode = getWeekCode(currentDate);
    const settlement = settlements.find((s) => s.weekCode === weekCode);
    if (!settlement) continue;

    if (!settlementTotals[weekCode]) {
      settlementTotals[weekCode] = { sales: 0, pv: 0 };
    }

    for (let i = 0; i < salesCountForDay; i++) {
      const randomMember = members[Math.floor(Math.random() * members.length)];
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const totalPrice = randomProduct.price * quantity;
      const totalPvValue = randomProduct.pv * quantity;

      const dateStr = currentDate.toISOString().split('T')[0].replace(/-/g, '');
      saleCounter++;

      await prisma.sale.create({
        data: {
          saleCode: `SALE-${dateStr}-${String(saleCounter).padStart(4, '0')}`,
          sellerId: randomMember.id,
          productId: randomProduct.id,
          quantity,
          unitPrice: randomProduct.price,
          totalPrice,
          unitPv: randomProduct.pv,
          totalPv: totalPvValue,
          weekCode,
          settlementId: settlement.id,
          status: SaleStatus.CONFIRMED,
          soldAt: currentDate,
        },
      });

      settlementTotals[weekCode].sales += totalPrice;
      settlementTotals[weekCode].pv += totalPvValue;
    }
  }
  console.log(`✅ Created ${saleCounter} sales across 60 days (2024-11-01 ~ 2024-12-29)`);

  // 7. Create Bonuses across 9 weeks with all 6 types
  const allBonusTypes = [
    BonusType.SALES,
    BonusType.SALES_MANAGEMENT,
    BonusType.LICENSE,
    BonusType.LICENSE_MANAGEMENT,
    BonusType.SHARING,
    BonusType.BRANCH_OPERATION,
  ];

  let bonusCounter = 0;
  const settlementBonusTotals: Record<string, number> = {};

  for (const settlement of settlements) {
    const bonusCountForWeek = Math.floor(Math.random() * 20) + 30; // 주당 30-50개 보너스

    if (!settlementBonusTotals[settlement.weekCode]) {
      settlementBonusTotals[settlement.weekCode] = 0;
    }

    for (let i = 0; i < bonusCountForWeek; i++) {
      const randomMember = members[Math.floor(Math.random() * members.length)];
      const randomBonusType = allBonusTypes[Math.floor(Math.random() * allBonusTypes.length)];

      // 보너스 유형별 금액 범위 설정
      let amount = 0;
      switch (randomBonusType) {
        case BonusType.SALES:
          amount = Math.floor(Math.random() * 100000) + 80000; // 80,000 ~ 180,000
          break;
        case BonusType.SALES_MANAGEMENT:
          amount = Math.floor(Math.random() * 80000) + 50000; // 50,000 ~ 130,000
          break;
        case BonusType.LICENSE:
          amount = Math.floor(Math.random() * 150000) + 100000; // 100,000 ~ 250,000
          break;
        case BonusType.LICENSE_MANAGEMENT:
          amount = Math.floor(Math.random() * 100000) + 60000; // 60,000 ~ 160,000
          break;
        case BonusType.SHARING:
          amount = Math.floor(Math.random() * 15000) + 20000; // 20,000 ~ 35,000
          break;
        case BonusType.BRANCH_OPERATION:
          amount = Math.floor(Math.random() * 40000) + 50000; // 50,000 ~ 90,000
          break;
      }

      await prisma.bonus.create({
        data: {
          memberId: randomMember.id,
          bonusType: randomBonusType,
          amount,
          description: `${randomBonusType} 보너스`,
          weekCode: settlement.weekCode,
          settlementId: settlement.id,
          status: BonusStatus.CONFIRMED,
        },
      });

      settlementBonusTotals[settlement.weekCode] += amount;
      bonusCounter++;
    }
  }
  console.log(`✅ Created ${bonusCounter} bonuses across 9 weeks with all 6 types`);

  // Update settlement totals
  for (const settlement of settlements) {
    const salesTotal = settlementTotals[settlement.weekCode] || { sales: 0, pv: 0 };
    const bonusTotal = settlementBonusTotals[settlement.weekCode] || 0;

    await prisma.settlement.update({
      where: { id: settlement.id },
      data: {
        totalSales: salesTotal.sales,
        totalPv: salesTotal.pv,
        totalBonuses: bonusTotal,
      },
    });
  }
  console.log('✅ Updated all settlement totals');

  // 8. Create Sample Seminar
  const seminarHost = members.find((m) => m.grade === MemberGrade.BRANCH_CHIEF);
  if (seminarHost) {
    await prisma.seminar.create({
      data: {
        hostId: seminarHost.id,
        title: '케이아이온 제품 설명회',
        description: '신제품 소개 및 판매 전략 세미나',
        location: '서울시 강남구 테헤란로 123',
        hasOffice: true,
        hasEquipment: true,
        participantsCount: 50,
        heldAt: new Date('2024-12-20'),
      },
    });
    console.log('✅ Created sample seminar');
  }

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(
    '  - Members: 243 (1 Admin + 2 Division Chiefs + 6 Branch Chiefs + 18 Managers + 54 Agents + 162 Members)',
  );
  console.log('  - Categories: 8 (3 main + 5 sub)');
  console.log(
    '  - Products: 30 (비타민 6개, 프로바이오틱스 6개, 스킨케어 6개, 메이크업 6개, 세제 6개)',
  );
  console.log(`  - Sales: ${saleCounter} (60일간, 2024-11-01 ~ 2024-12-29, 주말/월말 증가 패턴)`);
  console.log(`  - Bonuses: ${bonusCounter} (9주간, 2024-44 ~ 2024-52, 6가지 유형 균등 분포)`);
  console.log('  - Settlements: 9 (2024-44 ~ 2024-52)');
  console.log('  - Seminars: 1');
  console.log('\n📈 Graph-Ready Data:');
  console.log('  - Daily Sales Data: 59 unique dates');
  console.log('  - Weekly Trend Data: 9 weeks');
  console.log(
    '  - Bonus Types Distribution: 6 types (SALES, SALES_MANAGEMENT, LICENSE, LICENSE_MANAGEMENT, SHARING, BRANCH_OPERATION)',
  );
  console.log('\n🔑 Admin Login:');
  console.log('  Email: admin@kaion.com');
  console.log('  Password: admin123!@#');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
