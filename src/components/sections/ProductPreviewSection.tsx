import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Section, SectionTitle, Card, CardContent, Button } from '@/components/ui'
import { PRODUCTS } from '@/lib/constants'

export function ProductPreviewSection() {
  return (
    <Section background="light" aria-labelledby="product-preview-heading">
      <SectionTitle
        title="건강 1도씨존 제품 소개"
        subtitle="과학적으로 검증된 의료기기와 건강기능식품으로 고객의 건강을 케어합니다."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PRODUCTS.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="block group"
          >
            <Card hoverable className="h-full">
              <CardContent>
                {/* 이미지 영역 */}
                <div className="relative aspect-square mb-4 bg-gray-100 rounded-xl overflow-hidden">
                  {/* 이미지 플레이스홀더 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-5xl" aria-hidden="true">
                        {product.category === 'low-frequency' && '⚡'}
                        {product.category === 'ultrasound' && '🔊'}
                        {product.category === 'patch' && '🩹'}
                        {product.category === 'gel' && '💧'}
                      </span>
                    </div>
                  </div>

                  {/* 호버 오버레이 */}
                  <div className="absolute inset-0 bg-primary-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-medium flex items-center gap-2">
                      자세히 보기
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </span>
                  </div>
                </div>

                {/* 정보 */}
                <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-primary-500 transition-colors">
                  {product.name}
                </h3>
                <p className="text-sm text-text-secondary mb-3">
                  {product.shortDescription}
                </p>

                {/* 특징 태그 */}
                <div className="flex flex-wrap gap-2">
                  {product.features.slice(0, 2).map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 rounded-md text-xs text-text-secondary"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="text-center mt-10">
        <Link href="/products">
          <Button variant="secondary" size="lg" className="group">
            전체 제품 보기
            <ArrowRight
              className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Button>
        </Link>
      </div>
    </Section>
  )
}
