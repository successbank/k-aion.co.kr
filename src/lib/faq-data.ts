import type { FAQ, FAQCategory } from '@/types'

export const FAQ_DATA: FAQ[] = [
  // 창업 관련
  {
    id: 'f-1',
    question: '창업 비용은 얼마인가요?',
    answer: '건강 1도씨존 창업 비용은 총 2,860만원입니다. 여기에는 제품, 교육, 초기 운영에 필요한 모든 것이 포함됩니다. 또한 1,330만원 상당의 제품 지원과 200만원의 정착지원금이 제공됩니다.',
    category: 'franchise',
    order: 1,
  },
  {
    id: 'f-2',
    question: '매장 면적은 얼마나 필요한가요?',
    answer: '최소 10평 이상의 공간이 필요합니다. 치료기 설치 공간, 상담 공간, 대기 공간 등을 고려하여 15-20평 정도가 가장 이상적입니다.',
    category: 'franchise',
    order: 2,
  },
  {
    id: 'f-3',
    question: '창업까지 얼마나 걸리나요?',
    answer: '계약부터 오픈까지 약 3-4주 정도 소요됩니다. 의료기기 판매업 신고, 건강기능식품 영업 신고, 사업자등록 등의 절차가 포함됩니다. 본사에서 모든 절차를 안내해 드립니다.',
    category: 'franchise',
    order: 3,
  },
  {
    id: 'f-4',
    question: '어떤 교육을 받을 수 있나요?',
    answer: '총 4회에 걸친 체계적인 점주 교육이 제공됩니다. 제품 사용법, 고객 상담 기법, 매장 운영 노하우, 마케팅 전략 등을 배우게 됩니다. 오픈 후에도 지속적인 교육 지원이 이루어집니다.',
    category: 'franchise',
    order: 4,
  },
  {
    id: 'f-5',
    question: '별도의 자격증이 필요한가요?',
    answer: '특별한 자격증은 필요 없습니다. 다만 건강기능식품 판매를 위해 법정 교육(온라인, 약 2시간)을 이수해야 하며, 본사에서 교육 신청을 도와드립니다.',
    category: 'franchise',
    order: 5,
  },
  {
    id: 'f-6',
    question: '로열티나 추가 비용이 있나요?',
    answer: '별도의 로열티는 없습니다. 초기 창업 비용 외에 추가되는 본사 비용은 없으며, 제품 매입 시 본사 공급가로 구매하시면 됩니다.',
    category: 'franchise',
    order: 6,
  },

  // 제품 관련
  {
    id: 'p-1',
    question: '저주파 치료기의 효과는 무엇인가요?',
    answer: '저주파 치료기는 근육 이완과 혈액순환 개선에 도움을 줍니다. 어깨, 허리, 다리 등 근육 피로가 있는 부위에 사용하면 편안함을 느낄 수 있습니다. 식품의약품안전처에서 인증받은 의료기기입니다.',
    category: 'product',
    order: 1,
  },
  {
    id: 'p-2',
    question: '초음파 치료기는 어떻게 사용하나요?',
    answer: '초음파 치료기는 전용 젤을 바른 후 피부에 밀착시켜 사용합니다. 초음파 진동이 피부 깊숙이 온열 효과를 전달하여 근육 케어에 도움을 줍니다. 사용 시간과 강도는 매뉴얼을 참고해 주세요.',
    category: 'product',
    order: 2,
  },
  {
    id: 'p-3',
    question: '통증패치는 어떤 성분으로 만들어졌나요?',
    answer: '통증패치는 피부에 자극이 적은 성분으로 구성되어 있으며, 8시간 동안 지속적인 효과를 제공합니다. 자세한 성분 정보는 제품 설명서를 참고해 주세요.',
    category: 'product',
    order: 3,
  },
  {
    id: 'p-4',
    question: '제품에 대한 A/S는 어떻게 받나요?',
    answer: '모든 제품은 1년간 무상 A/S가 제공됩니다. 본사 고객센터(1588-0000)로 연락하시면 신속하게 처리해 드립니다. 사용자 과실로 인한 고장은 유상 수리됩니다.',
    category: 'product',
    order: 4,
  },

  // 매장 이용 관련
  {
    id: 's-1',
    question: '매장에서 체험할 수 있나요?',
    answer: '네, 모든 건강 1도씨존 매장에서 무료 체험이 가능합니다. 가까운 매장을 방문하시면 전문 상담원이 제품 사용법을 안내하고, 직접 체험해 보실 수 있습니다.',
    category: 'store',
    order: 1,
  },
  {
    id: 's-2',
    question: '매장 운영 시간은 어떻게 되나요?',
    answer: '매장별로 운영 시간이 다를 수 있습니다. 일반적으로 평일 10:00-19:00, 주말 10:00-17:00로 운영되며, 방문 전 전화로 확인하시는 것을 권장합니다.',
    category: 'store',
    order: 2,
  },
  {
    id: 's-3',
    question: '예약 없이 방문해도 되나요?',
    answer: '예약 없이 방문하셔도 됩니다. 다만, 상담이나 체험을 원하시는 경우 사전 예약을 하시면 대기 없이 서비스를 받으실 수 있습니다.',
    category: 'store',
    order: 3,
  },

  // 일반 문의
  {
    id: 'g-1',
    question: '케이아이온은 어떤 회사인가요?',
    answer: '㈜케이아이온은 건강 의료기기 및 건강기능식품 프랜차이즈 사업을 운영하는 기업입니다. "건강 1도씨존" 브랜드로 전국에 가맹점을 운영하고 있으며, 체온 1도의 변화가 가져오는 건강한 삶을 추구합니다.',
    category: 'general',
    order: 1,
  },
  {
    id: 'g-2',
    question: '카카오톡으로 상담받을 수 있나요?',
    answer: '네, 카카오톡 채널을 통해 실시간 상담이 가능합니다. 홈페이지 하단의 카카오톡 버튼을 클릭하거나, 카카오톡에서 "건강 1도씨존"을 검색해 주세요.',
    category: 'general',
    order: 2,
  },
  {
    id: 'g-3',
    question: '개인정보는 어떻게 보호되나요?',
    answer: '고객님의 개인정보는 개인정보보호법에 따라 철저히 보호됩니다. 수집된 정보는 상담 목적으로만 사용되며, 동의 없이 제3자에게 제공되지 않습니다. 자세한 내용은 개인정보처리방침을 참고해 주세요.',
    category: 'general',
    order: 3,
  },
]

export function getFAQsByCategory(category: FAQCategory): FAQ[] {
  return FAQ_DATA.filter((faq) => faq.category === category).sort(
    (a, b) => a.order - b.order
  )
}

export function getAllFAQs(): FAQ[] {
  return FAQ_DATA.sort((a, b) => a.order - b.order)
}
