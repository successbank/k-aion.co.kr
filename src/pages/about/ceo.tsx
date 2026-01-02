import React from 'react'
import { Quote, User } from 'lucide-react'
import { Section, Container, Card, CardContent } from '@/components/ui'
import { SITE_CONFIG } from '@/lib/constants'

export default function CEOPage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white py-16 md:py-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              CEO 인사말
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              건강한 세상을 만들어 가는 여정에
              <br />
              함께해 주셔서 감사합니다.
            </p>
          </div>
        </Container>
      </section>

      {/* CEO 인사말 */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12 items-start">
            {/* CEO 사진 */}
            <div className="lg:col-span-1">
              <Card className="sticky top-28">
                <CardContent className="text-center">
                  <div className="w-48 h-48 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <User className="w-24 h-24 text-gray-400" aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-bold text-text-primary">{SITE_CONFIG.representative}</h2>
                  <p className="text-primary-500 font-medium mt-1">{SITE_CONFIG.company} 대표이사</p>
                </CardContent>
              </Card>
            </div>

            {/* 인사말 내용 */}
            <div className="lg:col-span-2">
              <Quote className="w-12 h-12 text-primary-200 mb-6" aria-hidden="true" />

              <div className="space-y-6 text-lg text-text-secondary leading-relaxed">
                <p>
                  안녕하십니까, {SITE_CONFIG.company} 대표이사 {SITE_CONFIG.representative}입니다.
                </p>

                <p>
                  먼저 저희 {SITE_CONFIG.company}에 관심을 가져주신 모든 분들께
                  진심으로 감사의 말씀을 드립니다.
                </p>

                <p>
                  &quot;내 몸을 따뜻하게&quot;라는 슬로건 아래, 저희는 체온 1도의 변화가
                  가져오는 건강의 가치를 믿습니다. 현대인들의 바쁜 일상 속에서
                  잊기 쉬운 건강 관리, 저희 건강 1도씨존이 함께하겠습니다.
                </p>

                <p>
                  저희 회사는 최고 품질의 의료기기와 건강기능식품을 제공하여
                  고객 여러분의 건강한 삶에 기여하고자 합니다. 또한 전국의
                  가맹점주님들과 함께 성장하는 상생의 가치를 실현하고 있습니다.
                </p>

                <p>
                  체계적인 교육 시스템, 지속적인 본사 지원, 그리고 검증된 제품력을
                  바탕으로 가맹점주님들의 성공적인 사업 운영을 돕고 있으며,
                  고객분들께는 믿을 수 있는 건강 케어 서비스를 제공하고 있습니다.
                </p>

                <p>
                  앞으로도 {SITE_CONFIG.company}는 건강 산업의 선두주자로서
                  끊임없이 연구하고 발전하여, 더 많은 분들의 건강한 삶에
                  기여하는 기업이 되겠습니다.
                </p>

                <p>
                  여러분의 건강한 내일을 위해 {SITE_CONFIG.company}가 함께합니다.
                </p>

                <p className="font-medium text-text-primary">
                  감사합니다.
                </p>
              </div>

              <div className="mt-10 pt-6 border-t">
                <p className="text-right">
                  <span className="text-lg font-bold text-text-primary">{SITE_CONFIG.company}</span>
                  <br />
                  <span className="text-text-secondary">대표이사 </span>
                  <span className="text-xl font-bold text-primary-500">{SITE_CONFIG.representative}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 경영 철학 */}
      <Section background="light">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-8">경영 철학</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: '고객 가치', desc: '고객의 건강과 만족을 최우선으로' },
              { title: '상생 경영', desc: '파트너와 함께 성장하는 협력 관계' },
              { title: '혁신 도전', desc: '끊임없는 연구개발과 품질 향상' },
            ].map((philosophy, index) => (
              <Card key={index} className="border-2 border-primary-100">
                <CardContent className="py-8">
                  <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{philosophy.title}</h3>
                  <p className="text-text-secondary">{philosophy.desc}</p>
                </CardContent>
              </Card>
            ))}
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
        title: 'CEO 인사말',
        description: '케이아이온 대표이사 인사말 - 건강한 세상을 만들어 가는 여정에 함께해 주셔서 감사합니다.',
        keywords: ['케이아이온', 'CEO 인사말', '대표이사', '경영 철학'],
      },
    },
  }
}
