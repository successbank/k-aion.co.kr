import React from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Gift, GraduationCap, BadgeCheck } from 'lucide-react'
import { Section, Container, Button, Card, CardContent } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { FRANCHISE_COST, PRODUCT_SUPPORT } from '@/lib/constants'

export function FranchiseHighlightSection() {
  return (
    <Section
      background="white"
      padding="lg"
      aria-labelledby="franchise-highlight-heading"
    >
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* 좌측: 비용/혜택 정보 */}
        <div>
          <span className="inline-block px-4 py-2 bg-primary-100 text-primary-600 rounded-full text-sm font-medium mb-4">
            창업 안내
          </span>
          <h2
            id="franchise-highlight-heading"
            className="heading-2 mb-6"
          >
            합리적인 비용으로
            <br />
            <span className="text-primary-500">건강 사업을 시작하세요</span>
          </h2>
          <p className="text-lg text-text-secondary mb-8">
            2,860만원의 창업 비용으로 시작하고, 1,330만원 상당의 제품 지원과
            함께 체계적인 교육 시스템으로 성공적인 사업을 이끌어 나갈 수 있습니다.
          </p>

          {/* 핵심 혜택 리스트 */}
          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <CheckCircle
                className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium text-text-primary">
                  제품 지원 {formatCurrency(FRANCHISE_COST.productSupport)} 상당
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  {PRODUCT_SUPPORT.map((p) => `${p.name} ${p.quantity}${p.unit}`).join(', ')}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle
                className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium text-text-primary">
                  정착지원금 {formatCurrency(FRANCHISE_COST.settlementSupport)}
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  월 100만원씩 2개월 지원
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle
                className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium text-text-primary">
                  대리점 발굴 보상 {formatCurrency(FRANCHISE_COST.recruitmentBonus)}
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  신규 대리점 유치 시 보상금 지급
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle
                className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium text-text-primary">
                  간판, 홍보물, 인테리어 시안 지원
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  본사에서 제공하는 통일된 브랜드 아이덴티티
                </p>
              </div>
            </li>
          </ul>

          <Link href="/franchise/cost">
            <Button size="lg" className="group">
              창업 비용 자세히 보기
              <ArrowRight
                className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Button>
          </Link>
        </div>

        {/* 우측: 비용 카드 */}
        <div className="space-y-6">
          {/* 창업 비용 카드 */}
          <Card padding="lg" className="border-2 border-primary-200 bg-primary-50/50">
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary-100 rounded-xl">
                  <BadgeCheck className="w-8 h-8 text-primary-500" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">창업 비용</p>
                  <p className="text-3xl font-bold text-primary-500">
                    {formatCurrency(FRANCHISE_COST.startupCost)}
                  </p>
                </div>
              </div>
              <p className="text-base text-text-secondary">
                최소 {FRANCHISE_COST.minimumArea}평 이상 매장 요건
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            {/* 제품 지원 카드 */}
            <Card padding="md" className="bg-accent-50/50 border border-accent-200">
              <CardContent className="text-center">
                <Gift className="w-8 h-8 text-accent-600 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm text-text-secondary mb-1">제품 지원</p>
                <p className="text-xl font-bold text-accent-600">
                  {formatCurrency(FRANCHISE_COST.productSupport)}
                </p>
              </CardContent>
            </Card>

            {/* 교육 카드 */}
            <Card padding="md" className="bg-secondary-50/50 border border-secondary-200">
              <CardContent className="text-center">
                <GraduationCap className="w-8 h-8 text-secondary-500 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm text-text-secondary mb-1">점주 교육</p>
                <p className="text-xl font-bold text-secondary-500">
                  {FRANCHISE_COST.educationCount}회
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 상담 CTA */}
          <Card padding="md" className="bg-gray-900 text-white">
            <CardContent>
              <p className="text-lg font-medium mb-2">
                창업에 대해 더 알고 싶으신가요?
              </p>
              <p className="text-gray-400 text-sm mb-4">
                전문 상담원이 친절하게 안내해 드립니다.
              </p>
              <Link href="/franchise/consultation" className="block">
                <Button variant="accent" fullWidth>
                  무료 상담 신청하기
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Section>
  )
}
