import React from 'react'
import {
  HeroSection,
  BrandValueSection,
  FranchiseHighlightSection,
  ProductPreviewSection,
  CTASection,
} from '@/components/sections'

export default function HomePage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <HeroSection />

      {/* 브랜드 핵심 가치 */}
      <BrandValueSection />

      {/* 창업 혜택 하이라이트 */}
      <FranchiseHighlightSection />

      {/* 제품 미리보기 */}
      <ProductPreviewSection />

      {/* CTA 섹션 */}
      <CTASection />
    </>
  )
}

// 페이지 메타 정보
export async function getStaticProps() {
  return {
    props: {
      meta: {
        title: null, // 기본 타이틀 사용
        description: '건강 1도씨존은 저주파, 초음파 치료기 및 건강기능식품 전문 프랜차이즈입니다. 2,860만원으로 시작하는 건강 사업, 창업 상담을 신청하세요.',
        keywords: ['건강 1도씨존', '케이아이온', '건강 프랜차이즈', '창업', '저주파 치료기', '초음파 치료기'],
      },
    },
  }
}
