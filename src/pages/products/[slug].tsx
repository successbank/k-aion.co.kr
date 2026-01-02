import React from 'react'
import Link from 'next/link'
import { GetStaticPaths, GetStaticProps } from 'next'
import { ArrowLeft, CheckCircle, Phone, MapPin } from 'lucide-react'
import { Section, Container, Card, CardContent, Button } from '@/components/ui'
import { PRODUCTS, SITE_CONFIG } from '@/lib/constants'
import type { Product } from '@/types'

interface ProductPageProps {
  product: Product
}

export default function ProductPage({ product }: ProductPageProps) {
  return (
    <>
      {/* 브레드크럼 */}
      <div className="bg-gray-50 py-4">
        <Container>
          <nav aria-label="브레드크럼">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link href="/" className="text-text-secondary hover:text-primary-500">
                  홈
                </Link>
              </li>
              <li className="text-text-secondary">/</li>
              <li>
                <Link href="/products" className="text-text-secondary hover:text-primary-500">
                  제품 소개
                </Link>
              </li>
              <li className="text-text-secondary">/</li>
              <li className="text-text-primary font-medium">{product.name}</li>
            </ol>
          </nav>
        </Container>
      </div>

      {/* 제품 상세 */}
      <Section background="white">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* 이미지 */}
          <div>
            <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-9xl" aria-hidden="true">
                {product.category === 'low-frequency' && '⚡'}
                {product.category === 'ultrasound' && '🔊'}
                {product.category === 'patch' && '🩹'}
                {product.category === 'gel' && '💧'}
              </span>
            </div>
            <p className="text-sm text-text-secondary text-center">
              * 실제 제품 이미지는 매장에서 확인하실 수 있습니다.
            </p>
          </div>

          {/* 정보 */}
          <div>
            <span className="inline-block px-3 py-1 bg-primary-100 text-primary-600 rounded-full text-sm font-medium mb-4">
              {product.category === 'low-frequency' && '저주파 치료기'}
              {product.category === 'ultrasound' && '초음파 치료기'}
              {product.category === 'patch' && '건강 패치'}
              {product.category === 'gel' && '전도 젤'}
            </span>

            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              {product.name}
            </h1>

            <p className="text-lg text-primary-500 font-medium mb-4">
              {product.shortDescription}
            </p>

            <p className="text-lg text-text-secondary mb-8 leading-relaxed">
              {product.description}
            </p>

            {/* 주요 특징 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">주요 특징</h2>
              <ul className="grid grid-cols-2 gap-3">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle
                      className="h-5 w-5 text-green-500 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-text-primary">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <Card className="bg-primary-50 border border-primary-100">
              <CardContent>
                <h3 className="text-lg font-semibold mb-3">
                  제품을 직접 체험해 보세요
                </h3>
                <p className="text-text-secondary mb-4">
                  가까운 건강 1도씨존 매장에서 무료 체험이 가능합니다.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/stores">
                    <Button fullWidth className="sm:w-auto">
                      <MapPin className="mr-2 h-5 w-5" aria-hidden="true" />
                      매장 찾기
                    </Button>
                  </Link>
                  <a href={`tel:${SITE_CONFIG.phone}`}>
                    <Button variant="secondary" fullWidth className="sm:w-auto">
                      <Phone className="mr-2 h-5 w-5" aria-hidden="true" />
                      {SITE_CONFIG.phone}
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 뒤로가기 */}
        <div className="mt-12 pt-8 border-t">
          <Link href="/products" className="inline-flex items-center text-primary-500 hover:text-primary-600">
            <ArrowLeft className="mr-2 h-5 w-5" aria-hidden="true" />
            전체 제품 보기
          </Link>
        </div>
      </Section>

      {/* 다른 제품 추천 */}
      <Section background="light">
        <h2 className="text-2xl font-bold text-center mb-8">다른 제품도 살펴보세요</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.filter((p) => p.id !== product.id)
            .slice(0, 3)
            .map((p) => (
              <Link key={p.id} href={`/products/${p.slug}`}>
                <Card hoverable className="h-full">
                  <CardContent className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-3xl" aria-hidden="true">
                        {p.category === 'low-frequency' && '⚡'}
                        {p.category === 'ultrasound' && '🔊'}
                        {p.category === 'patch' && '🩹'}
                        {p.category === 'gel' && '💧'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{p.name}</h3>
                    <p className="text-sm text-text-secondary">{p.shortDescription}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
        </div>
      </Section>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = PRODUCTS.map((product) => ({
    params: { slug: product.slug },
  }))

  return {
    paths,
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps<ProductPageProps> = async ({ params }) => {
  const product = PRODUCTS.find((p) => p.slug === params?.slug)

  if (!product) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      product,
      meta: {
        title: product.name,
        description: product.description,
        keywords: [product.name, product.shortDescription, '건강 1도씨존', '의료기기'],
      },
    },
  }
}
