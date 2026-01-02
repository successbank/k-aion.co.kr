import React from 'react'
import Link from 'next/link'
import { ArrowRight, Building2, Users, Target, Award } from 'lucide-react'
import { Section, SectionTitle, Container, Card, CardContent, Button } from '@/components/ui'
import { SITE_CONFIG } from '@/lib/constants'

export default function AboutPage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white py-20 md:py-28">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              회사소개
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              건강한 삶을 위한 따뜻한 동반자,
              <br />
              {SITE_CONFIG.company}를 소개합니다.
            </p>
          </div>
        </Container>
      </section>

      {/* 회사 개요 */}
      <Section background="white">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-text-primary mb-6">
              {SITE_CONFIG.company}
            </h2>
            <p className="text-lg text-text-secondary mb-6 leading-relaxed">
              {SITE_CONFIG.company}는 &quot;내 몸을 따뜻하게&quot;라는 슬로건 아래,
              체온 관리와 건강 증진을 위한 의료기기 및 건강기능식품을 제공하는
              헬스케어 전문 기업입니다.
            </p>
            <p className="text-lg text-text-secondary mb-8 leading-relaxed">
              저주파 치료기, 초음파 치료기, 통증패치, 프리미엄 젤 등
              다양한 제품 라인업을 갖추고 있으며, 전국 프랜차이즈 네트워크를 통해
              고객들에게 최상의 건강 케어 서비스를 제공하고 있습니다.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/about/company">
                <Button variant="primary">
                  기업 소개 보기
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/about/ceo">
                <Button variant="secondary">
                  CEO 인사말
                </Button>
              </Link>
            </div>
          </div>
          <div className="bg-gray-100 rounded-2xl p-8 aspect-square flex items-center justify-center">
            <div className="text-center">
              <Building2 className="w-24 h-24 text-primary-500 mx-auto mb-4" aria-hidden="true" />
              <p className="text-lg font-medium text-text-primary">{SITE_CONFIG.company}</p>
              <p className="text-text-secondary mt-2">본사 이미지</p>
            </div>
          </div>
        </div>
      </Section>

      {/* 핵심 가치 */}
      <Section background="light">
        <SectionTitle
          title="핵심 가치"
          subtitle="우리가 추구하는 가치와 비전"
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Users,
              title: '고객 중심',
              description: '고객의 건강과 행복을 최우선으로 생각합니다.',
            },
            {
              icon: Award,
              title: '품질 우선',
              description: '최고 품질의 제품과 서비스를 제공합니다.',
            },
            {
              icon: Target,
              title: '혁신 추구',
              description: '끊임없는 연구개발로 혁신을 추구합니다.',
            },
            {
              icon: Building2,
              title: '상생 경영',
              description: '파트너와 함께 성장하는 상생 경영을 실천합니다.',
            },
          ].map((value, index) => (
            <Card key={index} hoverable className="text-center">
              <CardContent>
                <value.icon className="w-12 h-12 text-primary-500 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-text-secondary">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* 서브 페이지 링크 */}
      <Section background="white">
        <SectionTitle
          title="더 알아보기"
          subtitle="케이아이온에 대해 더 자세히 알아보세요"
        />
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/about/company" className="group">
            <Card hoverable className="h-full">
              <CardContent className="text-center py-8">
                <Building2 className="w-16 h-16 text-secondary-500 mx-auto mb-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 className="text-xl font-semibold mb-2">기업 소개</h3>
                <p className="text-text-secondary">회사 연혁, 조직, 사업 영역</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/about/ceo" className="group">
            <Card hoverable className="h-full">
              <CardContent className="text-center py-8">
                <Users className="w-16 h-16 text-secondary-500 mx-auto mb-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 className="text-xl font-semibold mb-2">CEO 인사말</h3>
                <p className="text-text-secondary">대표이사 인사말</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/about/history" className="group">
            <Card hoverable className="h-full">
              <CardContent className="text-center py-8">
                <Target className="w-16 h-16 text-secondary-500 mx-auto mb-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 className="text-xl font-semibold mb-2">연혁/비전</h3>
                <p className="text-text-secondary">성장 과정과 미래 비전</p>
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
        title: '회사소개',
        description: '케이아이온 회사소개 - 건강한 삶을 위한 따뜻한 동반자, 건강 1도씨존을 운영하는 헬스케어 전문 기업입니다.',
        keywords: ['케이아이온', '회사소개', '건강 1도씨존', '헬스케어 기업'],
      },
    },
  }
}
