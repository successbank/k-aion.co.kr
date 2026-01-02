import React from 'react'
import { Target, Rocket, Star, TrendingUp } from 'lucide-react'
import { Section, SectionTitle, Container, Card, CardContent } from '@/components/ui'
import { SITE_CONFIG } from '@/lib/constants'

const HISTORY_DATA = [
  {
    year: '2024',
    events: [
      '전국 가맹점 100호점 돌파',
      '신제품 프리미엄 젤 라인업 출시',
      '고객만족도 조사 최우수 등급 획득',
    ],
  },
  {
    year: '2023',
    events: [
      '전국 가맹점 50호점 돌파',
      'ISO 13485 품질경영시스템 인증',
      '초음파 치료기 신제품 출시',
    ],
  },
  {
    year: '2022',
    events: [
      '프랜차이즈 사업 본격 확장',
      '점주 교육 시스템 구축',
      '본사 사옥 확장 이전',
    ],
  },
  {
    year: '2021',
    events: [
      '건강 1도씨존 프랜차이즈 1호점 오픈',
      '저주파 치료기 CE 인증 획득',
      '통증패치 제품 라인 출시',
    ],
  },
  {
    year: '2020',
    events: [
      `${SITE_CONFIG.company} 설립`,
      '의료기기 제조업 허가 취득',
      '저주파 치료기 개발 완료',
    ],
  },
]

export default function HistoryPage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white py-16 md:py-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              연혁 / 비전
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              {SITE_CONFIG.company}의 성장 과정과
              <br />
              미래를 향한 비전을 소개합니다.
            </p>
          </div>
        </Container>
      </section>

      {/* 비전 */}
      <Section background="white">
        <SectionTitle
          title="비전"
          subtitle="건강한 세상을 만드는 따뜻한 동반자"
        />
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <CardContent className="py-12 text-center">
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                &quot;모든 사람이 건강한 삶을 누리는 세상&quot;
              </h3>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                체온 1도의 변화로 시작되는 건강한 삶,
                저희 {SITE_CONFIG.company}가 여러분과 함께 만들어 갑니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* 미션 & 목표 */}
      <Section background="light">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Target,
              title: 'Mission',
              content: '최고 품질의 건강 제품과 서비스를 통해 고객의 삶의 질 향상',
            },
            {
              icon: Star,
              title: 'Value',
              content: '고객 중심, 품질 우선, 상생 경영, 혁신 추구',
            },
            {
              icon: Rocket,
              title: 'Goal 2025',
              content: '전국 200개 가맹점 달성 및 해외 시장 진출',
            },
            {
              icon: TrendingUp,
              title: 'Goal 2030',
              content: '아시아 No.1 헬스케어 프랜차이즈 기업',
            },
          ].map((item, index) => (
            <Card key={index} className="h-full">
              <CardContent className="text-center">
                <item.icon className="w-12 h-12 text-primary-500 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-bold text-primary-500 mb-3">{item.title}</h3>
                <p className="text-text-secondary">{item.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* 연혁 */}
      <Section background="white">
        <SectionTitle
          title="연혁"
          subtitle="함께 걸어온 성장의 발자취"
        />
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* 타임라인 선 */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-primary-200 transform md:-translate-x-1/2" />

            {HISTORY_DATA.map((yearData, yearIndex) => (
              <div key={yearData.year} className="relative mb-12 last:mb-0">
                {/* 연도 */}
                <div className="flex items-center mb-4">
                  <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-primary-500 rounded-full transform -translate-x-1/2 z-10" />
                  <div className="ml-12 md:ml-0 md:w-1/2 md:pr-8 md:text-right">
                    <span className="inline-block bg-primary-500 text-white px-4 py-2 rounded-full font-bold">
                      {yearData.year}
                    </span>
                  </div>
                </div>

                {/* 이벤트 */}
                <div className="ml-12 md:ml-auto md:w-1/2 md:pl-8">
                  <Card>
                    <CardContent>
                      <ul className="space-y-3">
                        {yearData.events.map((event, eventIndex) => (
                          <li key={eventIndex} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-text-secondary">{event}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 미래 로드맵 */}
      <Section background="primary" className="text-white">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">함께 만들어갈 미래</h2>
          <p className="text-lg text-white/90 mb-8">
            {SITE_CONFIG.company}는 끊임없는 혁신과 도전으로
            건강 산업의 새로운 패러다임을 만들어 갑니다.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="bg-white/10 rounded-xl p-6">
              <p className="text-4xl font-bold text-accent-400 mb-2">200+</p>
              <p className="text-white/80">2025년 가맹점 목표</p>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <p className="text-4xl font-bold text-accent-400 mb-2">Global</p>
              <p className="text-white/80">해외 시장 진출</p>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <p className="text-4xl font-bold text-accent-400 mb-2">No.1</p>
              <p className="text-white/80">아시아 헬스케어 리더</p>
            </div>
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
        title: '연혁/비전',
        description: '케이아이온 연혁과 비전 - 함께 걸어온 성장의 발자취와 미래를 향한 비전을 소개합니다.',
        keywords: ['케이아이온', '연혁', '비전', '회사 역사', '미래 목표'],
      },
    },
  }
}
