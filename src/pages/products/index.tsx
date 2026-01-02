import React from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { Section, SectionTitle, Container, Card, CardContent, Button } from '@/components/ui'
import { PRODUCTS } from '@/lib/constants'

export default function ProductsPage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-600 text-white py-16 md:py-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              제품 소개
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              과학적으로 검증된 의료기기와 건강기능식품으로
              <br />
              고객의 건강한 일상을 돕습니다.
            </p>
          </div>
        </Container>
      </section>

      {/* 제품 목록 */}
      <Section background="light">
        <SectionTitle
          title="건강 1도씨존 제품"
          subtitle="식품의약품안전처 인증 의료기기와 프리미엄 건강 제품"
        />

        <div className="grid md:grid-cols-2 gap-8">
          {PRODUCTS.map((product) => (
            <Card key={product.id} hoverable padding="lg" className="group">
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* 이미지 */}
                  <div className="md:w-1/3">
                    <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                      <span className="text-6xl" aria-hidden="true">
                        {product.category === 'low-frequency' && '⚡'}
                        {product.category === 'ultrasound' && '🔊'}
                        {product.category === 'patch' && '🩹'}
                        {product.category === 'gel' && '💧'}
                      </span>
                    </div>
                  </div>

                  {/* 정보 */}
                  <div className="md:w-2/3">
                    <h3 className="text-2xl font-bold text-text-primary mb-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-primary-500 font-medium mb-3">
                      {product.shortDescription}
                    </p>
                    <p className="text-text-secondary mb-4">
                      {product.description}
                    </p>

                    {/* 특징 */}
                    <ul className="space-y-2 mb-6">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle
                            className="h-4 w-4 text-green-500"
                            aria-hidden="true"
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href={`/products/${product.slug}`}>
                      <Button variant="secondary" size="sm" className="group-hover:bg-primary-500 group-hover:text-white group-hover:border-primary-500 transition-colors">
                        자세히 보기
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA 섹션 */}
      <Section background="primary" padding="lg">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            제품을 직접 체험해 보세요
          </h2>
          <p className="text-lg text-white/90 mb-8">
            가까운 건강 1도씨존 매장에서 무료 체험이 가능합니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/stores">
              <Button variant="accent" size="lg">
                가까운 매장 찾기
              </Button>
            </Link>
            <Link href="/franchise/consultation">
              <Button variant="secondary" size="lg" className="bg-white/10 border-white text-white hover:bg-white/20">
                창업 상담 신청
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
        title: '제품 소개',
        description: '건강 1도씨존의 저주파 치료기, 초음파 치료기, 통증패치, 프리미엄 젤 등 건강 의료기기를 소개합니다.',
        keywords: ['저주파 치료기', '초음파 치료기', '통증패치', '건강 의료기기', '가정용 치료기'],
      },
    },
  }
}
