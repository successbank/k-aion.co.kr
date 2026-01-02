import React from 'react'
import { Phone, Mail, MessageCircle, Clock, MapPin } from 'lucide-react'
import { Section, SectionTitle, Card, CardContent, Container } from '@/components/ui'
import { ConsultationForm } from '@/components/forms'
import { SITE_CONFIG, FRANCHISE_COST, PRODUCT_SUPPORT } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

export default function ConsultationPage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-600 text-white py-16 md:py-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              창업 상담 신청
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              건강 1도씨존 창업에 관심이 있으신가요?
              <br />
              전문 상담원이 친절하게 안내해 드립니다.
            </p>
          </div>
        </Container>
      </section>

      {/* 메인 콘텐츠 */}
      <Section background="light">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* 좌측: 상담 폼 */}
          <div className="lg:col-span-3">
            <h2 className="heading-3 mb-6">상담 신청서 작성</h2>
            <ConsultationForm />
          </div>

          {/* 우측: 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 연락처 정보 */}
            <Card>
              <CardContent>
                <h3 className="text-xl font-semibold mb-4">연락처 안내</h3>
                <ul className="space-y-4">
                  <li>
                    <a
                      href={`tel:${SITE_CONFIG.phone}`}
                      className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      <Phone className="w-6 h-6 text-primary-500" aria-hidden="true" />
                      <div>
                        <p className="font-semibold text-text-primary">{SITE_CONFIG.phone}</p>
                        <p className="text-sm text-text-secondary">전화 상담</p>
                      </div>
                    </a>
                  </li>
                  <li>
                    <a
                      href={SITE_CONFIG.kakaoChannel}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                    >
                      <MessageCircle className="w-6 h-6 text-yellow-600" aria-hidden="true" />
                      <div>
                        <p className="font-semibold text-text-primary">카카오톡 상담</p>
                        <p className="text-sm text-text-secondary">실시간 채팅 상담</p>
                      </div>
                    </a>
                  </li>
                  <li>
                    <a
                      href={`mailto:${SITE_CONFIG.email}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Mail className="w-6 h-6 text-gray-600" aria-hidden="true" />
                      <div>
                        <p className="font-semibold text-text-primary">{SITE_CONFIG.email}</p>
                        <p className="text-sm text-text-secondary">이메일 문의</p>
                      </div>
                    </a>
                  </li>
                </ul>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    <span>상담 시간: 평일 09:00 - 18:00</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 창업 혜택 요약 */}
            <Card className="border-2 border-primary-200 bg-primary-50/50">
              <CardContent>
                <h3 className="text-xl font-semibold mb-4">창업 혜택 요약</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">창업 비용</dt>
                    <dd className="font-semibold text-primary-500">
                      {formatCurrency(FRANCHISE_COST.startupCost)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">제품 지원</dt>
                    <dd className="font-semibold text-accent-600">
                      {formatCurrency(FRANCHISE_COST.productSupport)} 상당
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">정착지원금</dt>
                    <dd className="font-semibold">
                      {formatCurrency(FRANCHISE_COST.settlementSupport)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">점주 교육</dt>
                    <dd className="font-semibold">{FRANCHISE_COST.educationCount}회</dd>
                  </div>
                </dl>

                <div className="mt-4 pt-4 border-t border-primary-200">
                  <p className="text-sm text-text-secondary">
                    <strong>제품 지원 내역:</strong>
                    <br />
                    {PRODUCT_SUPPORT.map((p) => `${p.name} ${p.quantity}${p.unit}`).join(', ')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 본사 위치 */}
            <Card>
              <CardContent>
                <h3 className="text-xl font-semibold mb-4">본사 위치</h3>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-500 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-medium">{SITE_CONFIG.company}</p>
                    <p className="text-sm text-text-secondary mt-1">{SITE_CONFIG.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
        title: '창업 상담 신청',
        description: '건강 1도씨존 창업에 관심이 있으신가요? 2,860만원으로 시작하는 건강 사업, 무료 상담을 신청하세요.',
        keywords: ['건강 1도씨존 창업', '창업 상담', '건강원 창업', '소자본 창업'],
      },
    },
  }
}
