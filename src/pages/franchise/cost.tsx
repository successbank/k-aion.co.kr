import React from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Gift, GraduationCap, Users, Banknote } from 'lucide-react'
import { Section, SectionTitle, Container, Card, CardContent, Button } from '@/components/ui'
import { FRANCHISE_COST, PRODUCT_SUPPORT } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

export default function FranchiseCostPage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-600 text-white py-16 md:py-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              창업 비용 및 혜택
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              합리적인 비용, 풍성한 혜택으로
              <br />
              성공적인 창업을 시작하세요.
            </p>
          </div>
        </Container>
      </section>

      {/* 창업 비용 요약 */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-lg text-text-secondary mb-4">총 창업 비용</p>
            <p className="text-5xl md:text-6xl font-bold text-primary-500">
              {formatCurrency(FRANCHISE_COST.startupCost)}
            </p>
            <p className="text-text-secondary mt-4">
              (부가세 별도 / 인테리어 및 임대료 별도)
            </p>
          </div>

          <Card className="bg-gradient-to-r from-accent-50 to-accent-100 border-2 border-accent-200">
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                <div className="text-center">
                  <Gift className="w-12 h-12 text-accent-600 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-text-secondary">제품 지원</p>
                  <p className="text-2xl font-bold text-accent-600">
                    {formatCurrency(FRANCHISE_COST.productSupport)} 상당
                  </p>
                </div>
                <div className="hidden md:block w-px h-16 bg-accent-300" />
                <div className="text-center">
                  <Users className="w-12 h-12 text-green-600 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-text-secondary">정착지원금</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(FRANCHISE_COST.settlementSupport)}
                  </p>
                </div>
                <div className="hidden md:block w-px h-16 bg-accent-300" />
                <div className="text-center">
                  <GraduationCap className="w-12 h-12 text-secondary-500 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-text-secondary">점주 교육</p>
                  <p className="text-2xl font-bold text-secondary-500">
                    {FRANCHISE_COST.educationCount}회
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* 비용 상세 내역 */}
      <Section background="light">
        <SectionTitle
          title="비용 상세 내역"
          subtitle="투명한 창업 비용 안내"
        />
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 text-lg font-semibold">항목</th>
                    <th className="text-right py-4 text-lg font-semibold">금액</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-4">가맹비</td>
                    <td className="text-right py-4 font-medium">500만원</td>
                  </tr>
                  <tr>
                    <td className="py-4">교육비</td>
                    <td className="text-right py-4 font-medium">300만원</td>
                  </tr>
                  <tr>
                    <td className="py-4">초기 물품비</td>
                    <td className="text-right py-4 font-medium">1,500만원</td>
                  </tr>
                  <tr>
                    <td className="py-4">시설 장치비</td>
                    <td className="text-right py-4 font-medium">360만원</td>
                  </tr>
                  <tr>
                    <td className="py-4">기타 비용</td>
                    <td className="text-right py-4 font-medium">200만원</td>
                  </tr>
                  <tr className="bg-primary-50">
                    <td className="py-4 font-bold text-lg">합계</td>
                    <td className="text-right py-4 font-bold text-lg text-primary-500">
                      {formatCurrency(FRANCHISE_COST.startupCost)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="text-sm text-text-secondary mt-4">
                * 인테리어 비용, 임대보증금, 월세 등은 별도입니다.
                <br />
                * 상세 비용은 상담 시 안내해 드립니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* 제품 지원 */}
      <Section background="white">
        <SectionTitle
          title="제품 지원 내역"
          subtitle={`${formatCurrency(FRANCHISE_COST.productSupport)} 상당 제품 지원`}
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRODUCT_SUPPORT.map((item, index) => (
            <Card key={index} className="text-center border-2 border-primary-100">
              <CardContent>
                <div className="w-20 h-20 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl" aria-hidden="true">
                    {item.name.includes('저주파') && '⚡'}
                    {item.name.includes('초음파') && '🔊'}
                    {item.name.includes('패치') && '🩹'}
                    {item.name.includes('젤') && '💧'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                <p className="text-3xl font-bold text-primary-500">
                  {item.quantity}
                  <span className="text-base font-normal text-text-secondary ml-1">{item.unit}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* 본사 지원 혜택 */}
      <Section background="light">
        <SectionTitle
          title="본사 지원 혜택"
          subtitle="성공적인 창업을 위한 전폭적인 지원"
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: GraduationCap,
              title: '체계적인 교육',
              items: ['제품 사용법 교육', '고객 상담 기법', '매장 운영 노하우', '마케팅 전략'],
            },
            {
              icon: Banknote,
              title: '정착지원금',
              items: ['창업 후 2개월간', '월 100만원 지급', '총 200만원 지원'],
            },
            {
              icon: Gift,
              title: '대리점 발굴 보상',
              items: ['신규 대리점 유치 시', '500만원 보상금 지급'],
            },
            {
              icon: Users,
              title: '마케팅 지원',
              items: ['홍보물 제공', '배너/팜플렛', 'SNS 마케팅 교육'],
            },
            {
              title: '인테리어 지원',
              items: ['통일된 SI 제공', '간판 디자인', '인테리어 시안'],
            },
            {
              title: '운영 지원',
              items: ['고객관리 시스템', 'POS 시스템', '정기 슈퍼바이징'],
            },
          ].map((support, index) => (
            <Card key={index}>
              <CardContent>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  {support.icon && <support.icon className="w-5 h-5 text-primary-500" aria-hidden="true" />}
                  {support.title}
                </h3>
                <ul className="space-y-2">
                  {support.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-text-secondary">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* 비교 표 */}
      <Section background="white">
        <SectionTitle
          title="왜 건강 1도씨존인가?"
          subtitle="타 프랜차이즈와 비교해보세요"
        />
        <div className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-4 px-6 text-left">비교 항목</th>
                <th className="py-4 px-6 text-center bg-primary-100 text-primary-600">건강 1도씨존</th>
                <th className="py-4 px-6 text-center">타 프랜차이즈 평균</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-4 px-6">창업 비용</td>
                <td className="py-4 px-6 text-center bg-primary-50 font-semibold text-primary-600">2,860만원</td>
                <td className="py-4 px-6 text-center text-text-secondary">5,000만원 이상</td>
              </tr>
              <tr>
                <td className="py-4 px-6">제품 지원</td>
                <td className="py-4 px-6 text-center bg-primary-50 font-semibold text-primary-600">1,330만원 상당</td>
                <td className="py-4 px-6 text-center text-text-secondary">500만원 내외</td>
              </tr>
              <tr>
                <td className="py-4 px-6">정착지원금</td>
                <td className="py-4 px-6 text-center bg-primary-50 font-semibold text-primary-600">200만원</td>
                <td className="py-4 px-6 text-center text-text-secondary">없음</td>
              </tr>
              <tr>
                <td className="py-4 px-6">점주 교육</td>
                <td className="py-4 px-6 text-center bg-primary-50 font-semibold text-primary-600">4회 (체계적)</td>
                <td className="py-4 px-6 text-center text-text-secondary">1~2회</td>
              </tr>
              <tr>
                <td className="py-4 px-6">로열티</td>
                <td className="py-4 px-6 text-center bg-primary-50 font-semibold text-primary-600">없음</td>
                <td className="py-4 px-6 text-center text-text-secondary">매출의 3~5%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* CTA */}
      <Section background="primary" padding="lg">
        <div className="text-center max-w-2xl mx-auto text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            합리적인 비용으로 시작하세요
          </h2>
          <p className="text-lg text-white/90 mb-8">
            자세한 창업 비용과 수익 구조가 궁금하시다면
            무료 상담을 신청해주세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/franchise/consultation">
              <Button variant="accent" size="lg" className="group">
                무료 상담 신청
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/franchise/process">
              <Button variant="secondary" size="lg" className="bg-white/10 border-white text-white hover:bg-white/20">
                창업 절차 보기
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </>
  )
}

export async function getStaticProps() {
  return {
    props: {
      meta: {
        title: '창업 비용 및 혜택',
        description: '건강 1도씨존 창업 비용 및 혜택 안내 - 2,860만원 창업 비용, 1,330만원 제품 지원, 정착지원금 200만원.',
        keywords: ['건강 1도씨존', '창업 비용', '창업 혜택', '프랜차이즈 비용', '제품 지원'],
      },
    },
  }
}
