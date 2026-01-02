import React from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Building2, FileText, GraduationCap, Rocket, Gift, Users } from 'lucide-react'
import { Section, SectionTitle, Container, Card, CardContent, Button } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { FRANCHISE_COST, FRANCHISE_STEPS, PRODUCT_SUPPORT } from '@/lib/constants'

export default function FranchisePage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white py-20 md:py-28">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-base font-medium mb-6">
              건강 1도씨존 창업 안내
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              2,860만원으로 시작하는
              <br />
              <span className="text-accent-400">건강 사업</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10">
              체계적인 교육과 본사의 전폭적인 지원으로
              <br />
              성공적인 건강 프랜차이즈 사업을 시작하세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/franchise/consultation">
                <Button variant="accent" size="lg" className="group">
                  무료 상담 신청하기
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
        </Container>
      </section>

      {/* 핵심 수치 */}
      <Section background="white" padding="lg">
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="text-center border-2 border-primary-100 bg-primary-50/30">
            <CardContent>
              <Building2 className="h-10 w-10 text-primary-500 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm text-text-secondary mb-1">창업 비용</p>
              <p className="text-2xl md:text-3xl font-bold text-primary-500">
                2,860<span className="text-lg">만원</span>
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-2 border-accent-100 bg-accent-50/30">
            <CardContent>
              <Gift className="h-10 w-10 text-accent-600 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm text-text-secondary mb-1">제품 지원</p>
              <p className="text-2xl md:text-3xl font-bold text-accent-600">
                1,330<span className="text-lg">만원</span>
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-2 border-green-100 bg-green-50/30">
            <CardContent>
              <Users className="h-10 w-10 text-green-600 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm text-text-secondary mb-1">정착지원금</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600">
                200<span className="text-lg">만원</span>
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-2 border-secondary-100 bg-secondary-50/30">
            <CardContent>
              <GraduationCap className="h-10 w-10 text-secondary-500 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm text-text-secondary mb-1">점주 교육</p>
              <p className="text-2xl md:text-3xl font-bold text-secondary-500">
                4<span className="text-lg">회</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* 제품 지원 상세 */}
      <Section background="light">
        <SectionTitle
          title="1,330만원 상당 제품 지원"
          subtitle="창업 시 본사에서 제공하는 제품 패키지"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRODUCT_SUPPORT.map((item, index) => (
            <Card key={index} className="text-center">
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
                <p className="text-2xl font-bold text-primary-500">
                  {item.quantity}<span className="text-base font-normal text-text-secondary">{item.unit}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* 창업 절차 */}
      <Section background="white">
        <SectionTitle
          title="창업 절차 안내"
          subtitle="계약부터 오픈까지 본사에서 모든 단계를 안내해 드립니다"
        />

        <div className="relative">
          {/* 연결선 (데스크톱) */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-primary-200" />

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {FRANCHISE_STEPS.map((step, index) => (
              <div key={step.step} className="relative">
                <Card className="h-full">
                  <CardContent>
                    {/* 스텝 번호 */}
                    <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4 mx-auto lg:mx-0">
                      {step.step}
                    </div>

                    <h3 className="text-lg font-semibold mb-2 text-center lg:text-left">
                      {step.title}
                    </h3>
                    <p className="text-sm text-text-secondary mb-3 text-center lg:text-left">
                      {step.description}
                    </p>

                    {'details' in step && step.details && (
                      <ul className="space-y-1">
                        {step.details.map((detail, i) => (
                          <li key={i} className="text-xs text-text-secondary flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-10">
          <Link href="/franchise/process">
            <Button variant="secondary" size="lg">
              상세 절차 보기
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </Section>

      {/* 본사 지원 혜택 */}
      <Section background="light">
        <SectionTitle
          title="본사 지원 혜택"
          subtitle="성공적인 매장 운영을 위한 다양한 지원"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: '📋',
              title: '체계적인 교육',
              description: '4회에 걸친 점주 교육으로 제품 사용법, 고객 상담 기법, 매장 운영 노하우를 전수합니다.',
            },
            {
              icon: '🎨',
              title: '인테리어 지원',
              description: '통일된 브랜드 아이덴티티를 위한 인테리어 시안과 간판 디자인을 제공합니다.',
            },
            {
              icon: '📣',
              title: '마케팅 지원',
              description: '홍보물, 배너, 팜플렛 등 마케팅 자료를 제공하여 고객 유치를 돕습니다.',
            },
            {
              icon: '💰',
              title: '정착지원금',
              description: '창업 후 2개월간 월 100만원씩 총 200만원의 정착지원금을 지급합니다.',
            },
            {
              icon: '🤝',
              title: '대리점 발굴 보상',
              description: '신규 대리점을 유치하시면 500만원의 보상금을 지급합니다.',
            },
            {
              icon: '💻',
              title: '고객관리 시스템',
              description: '체계적인 고객 관리를 위한 전용 시스템을 제공합니다.',
            },
          ].map((benefit, index) => (
            <Card key={index} hoverable>
              <CardContent>
                <span className="text-4xl mb-4 block" aria-hidden="true">{benefit.icon}</span>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-text-secondary text-sm">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section background="primary" padding="lg">
        <div className="text-center max-w-2xl mx-auto text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-lg text-white/90 mb-8">
            전문 상담원이 창업에 필요한 모든 정보를 친절하게 안내해 드립니다.
          </p>
          <Link href="/franchise/consultation">
            <Button variant="accent" size="lg" className="group">
              무료 상담 신청하기
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </Section>
    </>
  )
}

export async function getStaticProps() {
  return {
    props: {
      meta: {
        title: '창업 안내',
        description: '건강 1도씨존 창업 안내 - 2,860만원으로 시작하는 건강 프랜차이즈. 1,330만원 제품 지원, 체계적인 교육, 정착지원금 제공.',
        keywords: ['건강 1도씨존 창업', '건강원 창업', '프랜차이즈 창업', '소자본 창업', '의료기기 대리점'],
      },
    },
  }
}
