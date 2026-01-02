import React from 'react'
import Link from 'next/link'
import { ArrowRight, TrendingUp, Users, ShoppingBag, Repeat, CheckCircle } from 'lucide-react'
import { Section, SectionTitle, Container, Card, CardContent, Button } from '@/components/ui'
import { SITE_CONFIG } from '@/lib/constants'

export default function FranchiseModelPage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-600 text-white py-16 md:py-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              사업 모델 소개
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              건강 1도씨존의 검증된 사업 모델로
              <br />
              안정적인 수익을 창출하세요.
            </p>
          </div>
        </Container>
      </section>

      {/* 사업 모델 개요 */}
      <Section background="white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-6">
            건강 1도씨존 사업 모델
          </h2>
          <p className="text-lg text-text-secondary leading-relaxed mb-8">
            건강 1도씨존은 의료기기 체험 및 판매와 건강기능식품 판매를 결합한
            복합 헬스케어 사업 모델입니다. 무료 체험을 통해 고객을 유치하고,
            정기적인 방문과 신뢰 형성을 통해 안정적인 매출을 창출합니다.
          </p>
        </div>
      </Section>

      {/* 수익 구조 */}
      <Section background="light">
        <SectionTitle
          title="수익 구조"
          subtitle="다양한 수익원으로 안정적인 사업 운영"
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: ShoppingBag,
              title: '의료기기 판매',
              percentage: '40%',
              description: '저주파, 초음파 치료기 등 의료기기 판매 수익',
            },
            {
              icon: Repeat,
              title: '소모품 판매',
              percentage: '30%',
              description: '통증패치, 젤 등 정기 구매 소모품 수익',
            },
            {
              icon: Users,
              title: '체험 서비스',
              percentage: '20%',
              description: '유료 체험 프로그램 운영 수익',
            },
            {
              icon: TrendingUp,
              title: '건강식품 판매',
              percentage: '10%',
              description: '건강기능식품 판매 부가 수익',
            },
          ].map((item, index) => (
            <Card key={index} className="text-center">
              <CardContent>
                <item.icon className="w-12 h-12 text-primary-500 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-3xl font-bold text-primary-500 mb-3">{item.percentage}</p>
                <p className="text-text-secondary text-sm">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* 고객 유입 구조 */}
      <Section background="white">
        <SectionTitle
          title="고객 유입 구조"
          subtitle="지속 가능한 고객 확보 시스템"
        />
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-primary-50 border-2 border-primary-200">
              <CardContent className="text-center">
                <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-2">무료 체험 유치</h3>
                <p className="text-text-secondary text-sm">
                  지역 마케팅, 입소문을 통해
                  무료 체험 고객을 유치합니다.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-secondary-50 border-2 border-secondary-200">
              <CardContent className="text-center">
                <div className="w-16 h-16 bg-secondary-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-2">신뢰 구축</h3>
                <p className="text-text-secondary text-sm">
                  체험을 통해 효과를 경험하고
                  전문 상담으로 신뢰를 쌓습니다.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-2 border-green-200">
              <CardContent className="text-center">
                <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-2">정기 고객 전환</h3>
                <p className="text-text-secondary text-sm">
                  제품 구매 및 정기 방문으로
                  장기 고객으로 전환합니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>

      {/* 사업 모델 장점 */}
      <Section background="light">
        <SectionTitle
          title="사업 모델의 장점"
          subtitle="건강 1도씨존이 성공할 수 있는 이유"
        />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {[
              '고령화 사회 진입으로 건강 관리 수요 급증',
              '체험 기반으로 고객 신뢰 구축 용이',
              '소모품 정기 구매로 안정적인 재구매율',
              '지역 밀착형 운영으로 고객 충성도 확보',
              '본사의 체계적인 교육 및 마케팅 지원',
              '검증된 의료기기로 제품 신뢰도 높음',
            ].map((advantage, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-text-secondary">{advantage}</p>
              </div>
            ))}
          </div>
          <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <CardContent className="py-8">
              <h3 className="text-2xl font-bold mb-6">예상 수익 시뮬레이션</h3>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-white/20 pb-3">
                  <span className="text-white/80">월 평균 방문 고객</span>
                  <span className="font-semibold">100~150명</span>
                </div>
                <div className="flex justify-between border-b border-white/20 pb-3">
                  <span className="text-white/80">평균 객단가</span>
                  <span className="font-semibold">15~20만원</span>
                </div>
                <div className="flex justify-between border-b border-white/20 pb-3">
                  <span className="text-white/80">월 예상 매출</span>
                  <span className="font-semibold">1,500~3,000만원</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-white/80">예상 순이익률</span>
                  <span className="font-bold text-accent-400">25~35%</span>
                </div>
              </div>
              <p className="text-xs text-white/60 mt-4">
                * 위 수치는 평균적인 운영 매장 기준이며, 실제 수익은 입지 및 운영 방식에 따라 달라질 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* 타겟 고객 */}
      <Section background="white">
        <SectionTitle
          title="주요 타겟 고객"
          subtitle="우리의 핵심 고객층"
        />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              age: '40~50대',
              title: '직장인/자영업자',
              needs: ['만성 피로', '어깨/목 통증', '스트레스 관리'],
            },
            {
              age: '50~60대',
              title: '중장년층',
              needs: ['관절 건강', '혈액순환', '면역력 강화'],
            },
            {
              age: '60~70대',
              title: '시니어층',
              needs: ['만성 통증', '건강 유지', '정기 관리'],
            },
          ].map((target, index) => (
            <Card key={index}>
              <CardContent>
                <div className="text-center mb-4">
                  <span className="inline-block bg-primary-100 text-primary-600 px-4 py-1 rounded-full text-sm font-medium">
                    {target.age}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-center mb-4">{target.title}</h3>
                <ul className="space-y-2">
                  {target.needs.map((need, i) => (
                    <li key={i} className="flex items-center gap-2 text-text-secondary">
                      <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                      {need}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section background="primary" padding="lg">
        <div className="text-center max-w-2xl mx-auto text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            검증된 사업 모델로 시작하세요
          </h2>
          <p className="text-lg text-white/90 mb-8">
            자세한 수익 구조와 창업 비용이 궁금하시다면
            무료 상담을 신청해주세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/franchise/consultation">
              <Button variant="accent" size="lg" className="group">
                무료 상담 신청
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/franchise/cost">
              <Button variant="secondary" size="lg" className="bg-white/10 border-white text-white hover:bg-white/20">
                창업 비용 보기
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
        title: '사업 모델 소개',
        description: '건강 1도씨존 사업 모델 소개 - 검증된 수익 구조와 안정적인 고객 유입 시스템.',
        keywords: ['건강 1도씨존', '사업 모델', '창업', '수익 구조', '프랜차이즈'],
      },
    },
  }
}
