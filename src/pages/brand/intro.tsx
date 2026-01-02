import React from 'react'
import Link from 'next/link'
import { ArrowRight, Heart, Thermometer, Activity, Users, CheckCircle } from 'lucide-react'
import { Section, SectionTitle, Container, Card, CardContent, Button } from '@/components/ui'

export default function BrandIntroPage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white py-20 md:py-28">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              건강 1도씨존
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              체온 1도의 변화가 만드는
              <br />
              건강한 일상의 시작
            </p>
          </div>
        </Container>
      </section>

      {/* 브랜드 스토리 */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">
            브랜드 스토리
          </h2>
          <div className="space-y-6 text-lg text-text-secondary leading-relaxed">
            <p>
              &quot;체온이 1도 올라가면 면역력이 5배 증가한다&quot;
            </p>
            <p>
              이 단순하지만 강력한 건강 원리에서 &apos;건강 1도씨존&apos;은 시작되었습니다.
              현대인들은 바쁜 일상 속에서 자신의 건강을 챙기기 어렵습니다.
              차가워진 몸, 긴장된 근육, 만성적인 피로...
            </p>
            <p>
              저희는 이러한 현대인들의 건강 문제에 주목했습니다.
              체온을 따뜻하게 유지하는 것만으로도 혈액순환이 개선되고,
              면역력이 강화되며, 전반적인 건강 상태가 좋아집니다.
            </p>
            <p>
              건강 1도씨존은 저주파 치료기, 초음파 치료기, 통증패치, 프리미엄 젤 등
              과학적으로 검증된 제품들을 통해 여러분의 체온을 따뜻하게 유지하고,
              건강한 삶을 되찾을 수 있도록 돕습니다.
            </p>
          </div>
        </div>
      </Section>

      {/* 체온과 건강 */}
      <Section background="light">
        <SectionTitle
          title="체온과 건강의 관계"
          subtitle="왜 체온이 중요한가요?"
        />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Thermometer,
              title: '체온 1도 상승',
              stat: '면역력 5배 증가',
              description: '체온이 1도 올라가면 백혈구 활동이 활발해져 면역력이 크게 향상됩니다.',
            },
            {
              icon: Activity,
              title: '혈액순환 개선',
              stat: '대사율 12% 증가',
              description: '따뜻한 체온은 혈관을 확장시켜 혈액순환을 원활하게 합니다.',
            },
            {
              icon: Heart,
              title: '자연치유력 강화',
              stat: '회복속도 향상',
              description: '적정 체온 유지는 우리 몸의 자연치유 능력을 극대화합니다.',
            },
          ].map((item, index) => (
            <Card key={index} className="text-center">
              <CardContent>
                <item.icon className="w-12 h-12 text-primary-500 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-2xl font-bold text-primary-500 mb-3">{item.stat}</p>
                <p className="text-text-secondary text-sm">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* 건강 1도씨존만의 차별점 */}
      <Section background="white">
        <SectionTitle
          title="건강 1도씨존만의 차별점"
          subtitle="왜 건강 1도씨존이어야 할까요?"
        />
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {[
              {
                title: '검증된 의료기기',
                description: '식약처 인증 의료기기로 안전하고 효과적인 케어를 제공합니다.',
              },
              {
                title: '전문 상담 서비스',
                description: '교육받은 전문 상담원이 개인별 맞춤 건강 솔루션을 제안합니다.',
              },
              {
                title: '무료 체험 제공',
                description: '구매 전 무료 체험을 통해 제품 효과를 직접 경험할 수 있습니다.',
              },
              {
                title: '철저한 사후 관리',
                description: 'A/S 및 지속적인 고객 관리로 장기적인 건강 파트너가 됩니다.',
              },
            ].map((point, index) => (
              <div key={index} className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">{point.title}</h3>
                  <p className="text-text-secondary">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-gray-100 rounded-2xl p-8 flex items-center justify-center">
            <div className="text-center">
              <Users className="w-24 h-24 text-primary-500 mx-auto mb-4" aria-hidden="true" />
              <p className="text-lg font-medium text-text-primary">전문 상담 서비스</p>
              <p className="text-text-secondary mt-2">실제 이미지로 교체 예정</p>
            </div>
          </div>
        </div>
      </Section>

      {/* 이용 방법 */}
      <Section background="light">
        <SectionTitle
          title="건강 1도씨존 이용 방법"
          subtitle="간편하게 건강을 관리하세요"
        />
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: 1, title: '매장 방문', desc: '가까운 건강 1도씨존 매장을 방문합니다.' },
            { step: 2, title: '무료 상담', desc: '전문 상담원과 건강 상태를 체크합니다.' },
            { step: 3, title: '무료 체험', desc: '맞춤형 제품을 무료로 체험해 봅니다.' },
            { step: 4, title: '정기 관리', desc: '정기적인 방문으로 건강을 관리합니다.' },
          ].map((item) => (
            <Card key={item.step} className="text-center">
              <CardContent>
                <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-text-secondary text-sm">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section background="primary" padding="lg">
        <div className="text-center max-w-2xl mx-auto text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            건강한 삶의 시작
          </h2>
          <p className="text-lg text-white/90 mb-8">
            가까운 건강 1도씨존 매장에서 무료 체험을 받아보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/stores">
              <Button variant="accent" size="lg" className="group">
                가까운 매장 찾기
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="secondary" size="lg" className="bg-white/10 border-white text-white hover:bg-white/20">
                제품 보러가기
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
        title: '건강 1도씨존 소개',
        description: '건강 1도씨존 브랜드 소개 - 체온 1도의 변화가 만드는 건강한 일상의 시작.',
        keywords: ['건강 1도씨존', '브랜드 소개', '체온', '면역력', '건강 관리'],
      },
    },
  }
}
