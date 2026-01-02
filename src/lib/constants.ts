import type { NavItem, FranchiseCost, Region, Product } from '@/types'

// 사이트 기본 정보
export const SITE_CONFIG = {
  name: '건강 1도씨존',
  company: '㈜케이아이온',
  slogan: '내 몸을 따뜻하게, 건강 1도씨존',
  subSlogan: '1도와 함께, 성공적인 미래',
  phone: '1588-0000', // 대표 전화번호
  email: 'info@k-aion.co.kr',
  address: '서울특별시 강남구 테헤란로 123, K-AION빌딩 5층',
  businessNumber: '123-45-67890',
  representative: '홍길동',
  kakaoChannel: 'https://pf.kakao.com/_XXXXX',
} as const

// 네비게이션 메뉴
export const NAV_ITEMS: NavItem[] = [
  {
    label: '회사소개',
    href: '/about',
    children: [
      { label: '기업 소개', href: '/about/company' },
      { label: 'CEO 인사말', href: '/about/ceo' },
      { label: '연혁/비전', href: '/about/history' },
    ],
  },
  {
    label: '브랜드 소개',
    href: '/brand',
    children: [
      { label: '건강 1도씨존 소개', href: '/brand/intro' },
      { label: '매장 이미지 갤러리', href: '/brand/gallery' },
    ],
  },
  {
    label: '제품 소개',
    href: '/products',
    children: [
      { label: '저주파 치료기', href: '/products/low-frequency' },
      { label: '초음파 치료기', href: '/products/ultrasound' },
      { label: '통증패치', href: '/products/patch' },
      { label: '프리미엄 젤', href: '/products/gel' },
    ],
  },
  {
    label: '창업 안내',
    href: '/franchise',
    children: [
      { label: '사업 모델 소개', href: '/franchise/model' },
      { label: '창업 비용 및 혜택', href: '/franchise/cost' },
      { label: '창업 절차 가이드', href: '/franchise/process' },
      { label: '창업 상담 신청', href: '/franchise/consultation' },
    ],
  },
  { label: '매장 찾기', href: '/stores' },
  {
    label: '고객센터',
    href: '/support',
    children: [
      { label: '공지사항', href: '/support/notice' },
      { label: 'FAQ', href: '/support/faq' },
      { label: '1:1 문의', href: '/support/inquiry' },
    ],
  },
]

// 창업 비용 정보
export const FRANCHISE_COST: FranchiseCost = {
  startupCost: 28600000, // 2,860만원
  productSupport: 13300000, // 1,330만원 상당
  settlementSupport: 2000000, // 정착지원금 200만원
  recruitmentBonus: 5000000, // 대리점 발굴 보상 500만원
  educationCount: 4, // 4회 점주 교육
  minimumArea: 10, // 최소 10평
}

// 제품 지원 내역
export const PRODUCT_SUPPORT = [
  { name: '저주파 치료기', quantity: 3, unit: '대' },
  { name: '초음파 치료기', quantity: 3, unit: '대' },
  { name: '통증패치', quantity: 20, unit: 'box' },
  { name: '프리미엄 젤', quantity: 20, unit: '개' },
] as const

// 창업 절차
export const FRANCHISE_STEPS = [
  {
    step: 1,
    title: '사업장 계약',
    description: '현장 방문 → 계약금 지급 → 제품 검토 → 잔금 지급',
  },
  {
    step: 2,
    title: '신고 및 허가',
    description: '의료기기 판매업 신고, 건강기능식품 법정 교육 이수, 영업 신고',
    details: [
      '의료기기 판매업 신고 (정부24)',
      '건강기능식품 법정 교육 이수',
      '건강기능식품 영업 신고',
    ],
  },
  {
    step: 3,
    title: '사업자 등록',
    description: '홈택스에서 신청 (첨부: 임대차계약서, 각종 신고증)',
  },
  {
    step: 4,
    title: '대출 안내 (선택)',
    description: '다양한 소상공인 지원 제도 활용 가능',
    details: [
      '지역 신용보증재단',
      '서민금융진흥원',
      '소상공인시장진흥공단',
    ],
  },
  {
    step: 5,
    title: '교육 및 오픈',
    description: '4회 점주 교육 참여 후 매장 오픈',
  },
] as const

// 지역 목록
export const REGIONS: Region[] = [
  {
    code: '11',
    name: '서울',
    districts: [
      { code: '110', name: '강남구' },
      { code: '111', name: '강동구' },
      { code: '112', name: '강북구' },
      { code: '113', name: '강서구' },
      { code: '114', name: '관악구' },
      { code: '115', name: '광진구' },
      // ... 추가 구 목록
    ],
  },
  {
    code: '26',
    name: '부산',
    districts: [
      { code: '260', name: '해운대구' },
      { code: '261', name: '부산진구' },
      // ... 추가 구 목록
    ],
  },
  // ... 추가 시/도 목록
]

// 제품 목록
export const PRODUCTS: Product[] = [
  {
    id: 'lf-001',
    name: '저주파 치료기',
    slug: 'low-frequency',
    category: 'low-frequency',
    description: '근육 이완과 혈액순환 개선을 돕는 저주파 치료기입니다.',
    shortDescription: '근육 케어의 시작',
    features: [
      '6가지 자동 프로그램',
      '강도 조절 가능',
      '휴대 간편한 디자인',
      '충전식 배터리',
    ],
    images: [
      { src: '/images/products/low-frequency-1.webp', alt: '저주파 치료기 메인', width: 800, height: 800 },
    ],
  },
  {
    id: 'us-001',
    name: '초음파 치료기',
    slug: 'ultrasound',
    category: 'ultrasound',
    description: '피부 깊숙이 온열 효과를 전달하는 초음파 치료기입니다.',
    shortDescription: '깊은 온열 케어',
    features: [
      '1MHz 초음파',
      '온열 기능',
      '타이머 설정',
      'LED 디스플레이',
    ],
    images: [
      { src: '/images/products/ultrasound-1.webp', alt: '초음파 치료기 메인', width: 800, height: 800 },
    ],
  },
  {
    id: 'pt-001',
    name: '통증패치',
    slug: 'patch',
    category: 'patch',
    description: '간편하게 부착하여 사용하는 통증 케어 패치입니다.',
    shortDescription: '간편한 통증 케어',
    features: [
      '피부 자극 최소화',
      '밀착력 우수',
      '8시간 지속',
      '무향 타입',
    ],
    images: [
      { src: '/images/products/patch-1.webp', alt: '통증패치 메인', width: 800, height: 800 },
    ],
  },
  {
    id: 'gl-001',
    name: '프리미엄 젤',
    slug: 'gel',
    category: 'gel',
    description: '치료기와 함께 사용하는 프리미엄 전도 젤입니다.',
    shortDescription: '효과적인 전도 젤',
    features: [
      '피부 보습 효과',
      '끈적임 없는 사용감',
      '무색무취',
      '대용량',
    ],
    images: [
      { src: '/images/products/gel-1.webp', alt: '프리미엄 젤 메인', width: 800, height: 800 },
    ],
  },
]

// FAQ 카테고리
export const FAQ_CATEGORIES = [
  { id: 'franchise', label: '창업 관련' },
  { id: 'product', label: '제품 관련' },
  { id: 'store', label: '매장 이용' },
  { id: 'general', label: '일반 문의' },
] as const

// SEO 기본 메타데이터
export const DEFAULT_META = {
  title: '건강 1도씨존 | 내 몸을 따뜻하게',
  description: '건강 1도씨존은 저주파, 초음파 치료기 및 건강기능식품 전문 프랜차이즈입니다. 소자본 창업, 체계적인 교육, 다양한 지원 혜택을 제공합니다.',
  keywords: ['건강 1도씨존', '케이아이온', '건강원 창업', '의료기기 대리점', '소자본 창업', '저주파 치료기', '초음파 치료기'],
  ogImage: '/images/og-image.png',
} as const
