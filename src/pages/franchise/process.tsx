import React from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Phone, FileText, Building2, GraduationCap, Rocket } from 'lucide-react'
import { Section, SectionTitle, Container, Card, CardContent, Button } from '@/components/ui'
import { FRANCHISE_STEPS } from '@/lib/constants'

const DETAILED_STEPS = [
  {
    icon: Phone,
    title: '상담 신청',
    duration: '1일',
    description: '온라인 또는 전화로 창업 상담을 신청합니다.',
    details: [
      '홈페이지 상담 신청 폼 작성',
      '전화 상담 (1588-0000)',
      '카카오톡 채널 상담',
    ],
  },
  {
    icon: FileText,
    title: '사업 설명회',
    duration: '1~2일',
    description: '본사에서 진행하는 사업 설명회에 참석합니다.',
    details: [
      '사업 모델 상세 설명',
      '수익 구조 안내',
      '창업 비용 및 혜택 설명',
      'Q&A 세션',
    ],
  },
  {
    icon: Building2,
    title: '입지 선정 및 계약',
    duration: '2~4주',
    description: '매장 위치를 선정하고 가맹 계약을 체결합니다.',
    details: [
      '상권 분석 지원',
      '입지 조건 검토',
      '가맹 계약 체결',
      '계약금 납부',
    ],
  },
  {
    icon: FileText,
    title: '인허가 및 사업자 등록',
    duration: '2~3주',
    description: '필요한 인허가와 사업자 등록을 진행합니다.',
    details: [
      '의료기기 판매업 신고',
      '건강기능식품 영업 신고',
      '사업자 등록',
      '본사 서류 지원',
    ],
  },
  {
    icon: GraduationCap,
    title: '점주 교육',
    duration: '1~2주',
    description: '매장 운영에 필요한 체계적인 교육을 받습니다.',
    details: [
      '제품 교육 (2회)',
      '고객 상담 교육',
      '매장 운영 교육',
      '마케팅 교육',
    ],
  },
  {
    icon: Rocket,
    title: '매장 오픈',
    duration: 'D-Day',
    description: '인테리어 완료 후 매장을 오픈합니다.',
    details: [
      '인테리어 시공',
      '제품 입고 및 진열',
      '오픈 마케팅 지원',
      '본사 오픈 지원',
    ],
  },
]

export default function FranchiseProcessPage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-600 text-white py-16 md:py-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              창업 절차 가이드
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              상담부터 오픈까지,
              <br />
              본사가 모든 과정을 함께합니다.
            </p>
          </div>
        </Container>
      </section>

      {/* 간단 절차 개요 */}
      <Section background="white">
        <SectionTitle
          title="창업 절차 한눈에 보기"
          subtitle="상담 신청부터 오픈까지 약 6~8주 소요"
        />
        <div className="relative">
          {/* 연결선 */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-primary-200" />

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {DETAILED_STEPS.map((step, index) => (
              <div key={index} className="relative">
                <Card className="h-full text-center">
                  <CardContent>
                    <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 relative z-10">
                      {index + 1}
                    </div>
                    <h3 className="font-semibold mb-1 text-sm">{step.title}</h3>
                    <p className="text-xs text-primary-500 font-medium">{step.duration}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 상세 절차 */}
      <Section background="light">
        <SectionTitle
          title="상세 창업 절차"
          subtitle="각 단계별 자세한 안내"
        />
        <div className="max-w-4xl mx-auto space-y-6">
          {DETAILED_STEPS.map((step, index) => (
            <Card key={index}>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center">
                      <step.icon className="w-8 h-8" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-sm font-medium">
                        STEP {index + 1}
                      </span>
                      <h3 className="text-xl font-semibold">{step.title}</h3>
                      <span className="text-sm text-text-secondary">
                        ({step.duration})
                      </span>
                    </div>
                    <p className="text-text-secondary mb-4">{step.description}</p>
                    <ul className="grid md:grid-cols-2 gap-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* 인허가 안내 */}
      <Section background="white">
        <SectionTitle
          title="필수 인허가 안내"
          subtitle="창업에 필요한 신고 및 허가 절차"
        />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: '의료기기 판매업 신고',
              where: '정부24 (온라인)',
              documents: ['사업자등록증', '임대차계약서', '매장 도면'],
              duration: '3~5일',
            },
            {
              title: '건강기능식품 법정교육',
              where: '한국건강기능식품협회',
              documents: ['신분증', '교육 신청서'],
              duration: '1일 (온라인)',
            },
            {
              title: '건강기능식품 영업 신고',
              where: '관할 시·군·구청',
              documents: ['교육 수료증', '사업자등록증', '임대차계약서'],
              duration: '3~5일',
            },
          ].map((permit, index) => (
            <Card key={index}>
              <CardContent>
                <h3 className="text-lg font-semibold mb-4">{permit.title}</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-text-primary">신청처: </span>
                    <span className="text-text-secondary">{permit.where}</span>
                  </div>
                  <div>
                    <span className="font-medium text-text-primary">필요 서류:</span>
                    <ul className="mt-1 space-y-1">
                      {permit.documents.map((doc, i) => (
                        <li key={i} className="text-text-secondary flex items-center gap-2">
                          <span className="w-1 h-1 bg-primary-500 rounded-full" />
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-medium text-text-primary">소요 기간: </span>
                    <span className="text-primary-500 font-medium">{permit.duration}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <p className="text-text-secondary">
            * 본사에서 인허가 절차에 필요한 서류 작성 및 신청을 지원해 드립니다.
          </p>
        </div>
      </Section>

      {/* 교육 프로그램 */}
      <Section background="light">
        <SectionTitle
          title="점주 교육 프로그램"
          subtitle="4회에 걸친 체계적인 교육"
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              round: '1회차',
              title: '제품 교육',
              content: ['저주파/초음파 치료기 이론', '제품 사용법 실습', '효과 및 주의사항'],
            },
            {
              round: '2회차',
              title: '고객 상담 교육',
              content: ['건강 상담 기법', '고객 니즈 파악', '맞춤 솔루션 제안'],
            },
            {
              round: '3회차',
              title: '매장 운영 교육',
              content: ['POS 시스템 사용', '재고 관리', '고객 관리 시스템'],
            },
            {
              round: '4회차',
              title: '마케팅 교육',
              content: ['지역 마케팅 전략', 'SNS 활용법', '고객 유치 방법'],
            },
          ].map((edu, index) => (
            <Card key={index} className="border-t-4 border-t-primary-500">
              <CardContent>
                <span className="inline-block bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-sm font-medium mb-3">
                  {edu.round}
                </span>
                <h3 className="text-lg font-semibold mb-3">{edu.title}</h3>
                <ul className="space-y-2">
                  {edu.content.map((item, i) => (
                    <li key={i} className="text-text-secondary text-sm flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section background="white">
        <SectionTitle
          title="창업 절차 FAQ"
          subtitle="자주 묻는 질문"
        />
        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              q: '창업까지 얼마나 걸리나요?',
              a: '상담부터 오픈까지 평균 6~8주 정도 소요됩니다. 입지 선정 및 인테리어 기간에 따라 달라질 수 있습니다.',
            },
            {
              q: '의료기기 판매업 경험이 없어도 되나요?',
              a: '네, 경험이 없어도 괜찮습니다. 본사의 체계적인 교육 프로그램을 통해 필요한 모든 지식을 습득할 수 있습니다.',
            },
            {
              q: '인허가 절차가 어렵지 않나요?',
              a: '본사에서 인허가에 필요한 모든 서류 작성과 신청 과정을 지원해 드립니다. 걱정하지 않으셔도 됩니다.',
            },
            {
              q: '교육은 어디서 진행되나요?',
              a: '본사 교육장에서 진행되며, 일부 교육은 온라인으로도 참여 가능합니다.',
            },
          ].map((faq, index) => (
            <Card key={index}>
              <CardContent>
                <h3 className="font-semibold text-text-primary mb-2">Q. {faq.q}</h3>
                <p className="text-text-secondary">A. {faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section background="primary" padding="lg">
        <div className="text-center max-w-2xl mx-auto text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            첫 단계를 시작하세요
          </h2>
          <p className="text-lg text-white/90 mb-8">
            지금 바로 무료 상담을 신청하시면
            전문 상담원이 친절하게 안내해 드립니다.
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
        title: '창업 절차 가이드',
        description: '건강 1도씨존 창업 절차 안내 - 상담부터 오픈까지 6~8주, 본사가 모든 과정을 함께합니다.',
        keywords: ['건강 1도씨존', '창업 절차', '창업 가이드', '프랜차이즈 절차', '점주 교육'],
      },
    },
  }
}
