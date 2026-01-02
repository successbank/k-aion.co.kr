import React from 'react'
import { Heart, Shield, Users, TrendingUp } from 'lucide-react'
import { Section, SectionTitle, Card, CardContent } from '@/components/ui'

const values = [
  {
    icon: Heart,
    title: '따뜻한 건강 케어',
    description:
      '저주파와 초음파 치료기로 체온 관리와 근육 이완을 돕는 전문 건강 케어 서비스를 제공합니다.',
    color: 'text-primary-500',
    bgColor: 'bg-primary-50',
  },
  {
    icon: Shield,
    title: '신뢰할 수 있는 품질',
    description:
      '식품의약품안전처 인증 의료기기와 건강기능식품으로 안전하고 효과적인 건강 관리를 지원합니다.',
    color: 'text-secondary-500',
    bgColor: 'bg-secondary-50',
  },
  {
    icon: Users,
    title: '체계적인 교육 시스템',
    description:
      '4회에 걸친 점주 교육과 지속적인 운영 지원으로 성공적인 사업 운영을 돕습니다.',
    color: 'text-accent-600',
    bgColor: 'bg-accent-50',
  },
  {
    icon: TrendingUp,
    title: '안정적인 수익 창출',
    description:
      '검증된 비즈니스 모델과 본사의 마케팅 지원으로 안정적인 매장 운영이 가능합니다.',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
]

export function BrandValueSection() {
  return (
    <Section background="light" aria-labelledby="brand-value-heading">
      <SectionTitle
        title="건강 1도씨존이 특별한 이유"
        subtitle="40년 이상의 경험을 바탕으로 고객의 건강과 점주님의 성공을 함께 만들어갑니다."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {values.map((value, index) => {
          const IconComponent = value.icon
          return (
            <Card
              key={index}
              hoverable
              className="text-center group"
              padding="lg"
            >
              <CardContent>
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${value.bgColor} ${value.color} mb-6 transition-transform group-hover:scale-110`}
                >
                  <IconComponent className="w-8 h-8" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-3">
                  {value.title}
                </h3>
                <p className="text-base text-text-secondary leading-relaxed">
                  {value.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </Section>
  )
}
