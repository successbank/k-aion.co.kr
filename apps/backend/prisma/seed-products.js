const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 제품 및 카테고리 데이터 생성 시작...\n');

  // 3. Create Categories
  console.log('📂 카테고리 생성...');
  const categoryData = [
    { name: '건강기능식품', level: 1, displayOrder: 1 },
    { name: '화장품', level: 1, displayOrder: 2 },
    { name: '생활용품', level: 1, displayOrder: 3 },
  ];

  const categories = [];
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
  console.log('✅ Created 3 main categories and 5 subcategories\n');

  // 4. Create Products (30 products across all categories)
  console.log('📦 제품 생성...');
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
      name: '화장실 클리너',
      categoryId: subcategories[4].id,
      price: 20000,
      pv: 18000,
      stock: 1200,
      minStock: 120,
      description: '살균 화장실 세정제',
      imageUrl: 'https://via.placeholder.com/300x300?text=Bathroom',
    },
    {
      code: 'PROD-030',
      name: '유리세정제',
      categoryId: subcategories[4].id,
      price: 15000,
      pv: 13500,
      stock: 1000,
      minStock: 100,
      description: '얼룩없는 유리 클리너',
      imageUrl: 'https://via.placeholder.com/300x300?text=Glass',
    },
  ];

  for (const product of productsData) {
    await prisma.product.create({ data: product });
  }

  console.log('✅ Created 30 products\n');

  // 통계 출력
  const categoryCount = await prisma.category.count();
  const productCount = await prisma.product.count();

  console.log('📊 생성 완료:');
  console.log(`  - 카테고리: ${categoryCount}개`);
  console.log(`  - 제품: ${productCount}개\n`);

  console.log('✨ 제품 및 카테고리 데이터 생성 완료!\n');
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
