import React from 'react'
import Link from 'next/link'
import { ArrowRight, Heart, Shield, Sparkles, Users } from 'lucide-react'
import { Section, SectionTitle, Container, Card, CardContent, Button } from '@/components/ui'
import { SITE_CONFIG } from '@/lib/constants'

export default function BrandPage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white py-20 md:py-28">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-base font-medium mb-6">
              Brand Story
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              건강 1도씨존
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              체온 1도의 변화가 만드는 건강한 일상
              <br />
              내 몸을 따뜻하게, 건강 1도씨존
            </p>
            <Link href="/brand/intro">
              <Button variant="accent" size="lg" className="group">
                브랜드 스토리 보기
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* 브랜드 컨셉 */}
      <Section background="white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-8">
            &quot;{SITE_CONFIG.slogan}&quot;
          </h2>
          <p className="text-lg text-text-secondary leading-relaxed mb-8">
            체온이 1도 올라가면 면역력이 5배 증가합니다.
            <br />
            건강 1도씨존은 이 단순하지만 중요한 원리를 바탕으로
            <br />
            여러분의 건강한 삶을 위한 솔루션을 제공합니다.
          </p>
        </div>
      </Section>

      {/* 브랜드 가치 */}
      <Section background="light">
        <SectionTitle
          title="브랜드 가치"
          subtitle="건강 1도씨존이 추구하는 핵심 가치"
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Heart,
              title: '따뜻함',
              description: '체온을 따뜻하게 유지하여 건강을 지키는 가치를 전합니다.',
              color: 'text-primary-500',
              bg: 'bg-primary-50',
            },
            {
              icon: Shield,
              title: '신뢰',
              description: '검증된 제품과 서비스로 고객의 신뢰를 얻습니다.',
              color: 'text-secondary-500',
              bg: 'bg-secondary-50',
            },
            {
              icon: Sparkles,
              title: '전문성',
              description: '의료기기 전문 기업으로서 최고의 품질을 제공합니다.',
              color: 'text-accent-600',
              bg: 'bg-accent-50',
            },
            {
              icon: Users,
              title: '동반성장',
              description: '가맹점주와 함께 성장하는 상생의 가치를 실현합니다.',
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
          ].map((value, index) => (
            <Card key={index} hoverable className="text-center">
              <CardContent>
                <div className={`w-16 h-16 ${value.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <value.icon className={`w-8 h-8 ${value.color}`} aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-text-secondary">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* 브랜드 아이덴티티 */}
      <Section background="white">
        <SectionTitle
          title="브랜드 아이덴티티"
          subtitle="건강 1도씨존의 시각적 정체성"
        />
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 로고 */}
          <Card>
            <CardContent>
              <h3 className="text-xl font-semibold mb-4">로고</h3>
              <div className="bg-gray-100 rounded-xl p-8 flex items-center justify-center aspect-video mb-4">
                <span className="text-3xl font-bold text-primary-500">건강 1도씨존</span>
              </div>
              <p className="text-text-secondary">
                따뜻함과 건강을 상징하는 레드 컬러를 메인으로,
                신뢰와 전문성을 나타내는 블루 컬러를 보조로 사용합니다.
              </p>
            </CardContent>
          </Card>

          {/* 컬러 */}
          <Card>
            <CardContent>
              <h3 className="text-xl font-semibold mb-4">브랜드 컬러</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary-500 rounded-lg" />
                  <div>
                    <p className="font-medium">Primary Red</p>
                    <p className="text-sm text-text-secondary">#E53935 - 따뜻함, 건강, 활력</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-secondary-500 rounded-lg" />
                  <div>
                    <p className="font-medium">Secondary Blue</p>
                    <p className="text-sm text-text-secondary">#1976D2 - 신뢰, 전문성</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-accent-500 rounded-lg" />
                  <div>
                    <p className="font-medium">Accent Gold</p>
                    <p className="text-sm text-text-secondary">#FFC107 - 프리미엄, 성공</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* 서브 페이지 링크 */}
      <Section background="light">
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/brand/intro" className="group">
            <Card hoverable className="h-full">
              <CardContent className="py-10 text-center">
                <Heart className="w-16 h-16 text-primary-500 mx-auto mb-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 className="text-2xl font-semibold mb-2">건강 1도씨존 소개</h3>
                <p className="text-text-secondary mb-4">브랜드 스토리와 철학</p>
                <span className="inline-flex items-center text-primary-500 font-medium">
                  자세히 보기 <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/brand/gallery" className="group">
            <Card hoverable className="h-full">
              <CardContent className="py-10 text-center">
                <Sparkles className="w-16 h-16 text-primary-500 mx-auto mb-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 className="text-2xl font-semibold mb-2">매장 이미지 갤러리</h3>
                <p className="text-text-secondary mb-4">전국 매장 인테리어</p>
                <span className="inline-flex items-center text-primary-500 font-medium">
                  갤러리 보기 <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
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
        title: '브랜드 소개',
        description: '건강 1도씨존 브랜드 소개 - 체온 1도의 변화가 만드는 건강한 일상, 내 몸을 따뜻하게.',
        keywords: ['건강 1도씨존', '브랜드', '브랜드 스토리', '헬스케어'],
      },
    },
  }
}
