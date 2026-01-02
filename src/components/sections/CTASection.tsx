import React from 'react'
import Link from 'next/link'
import { Phone, MessageCircle, ArrowRight } from 'lucide-react'
import { Container, Button } from '@/components/ui'
import { SITE_CONFIG } from '@/lib/constants'

export function CTASection() {
  return (
    <section
      className="relative py-20 md:py-28 bg-gradient-to-br from-primary-600 to-primary-700 text-white overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* 배경 장식 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-accent-400 rounded-full blur-3xl" />
      </div>

      <Container>
        <div className="relative text-center max-w-3xl mx-auto">
          <h2
            id="cta-heading"
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
          >
            지금 바로 건강 사업을
            <br />
            <span className="text-accent-400">시작하세요</span>
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-10">
            전문 상담원이 창업에 필요한 모든 정보를 친절하게 안내해 드립니다.
            <br className="hidden md:block" />
            부담없이 문의해 주세요.
          </p>

          {/* CTA 버튼들 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link href="/franchise/consultation">
              <Button
                variant="accent"
                size="lg"
                className="group w-full sm:w-auto"
              >
                무료 상담 신청하기
                <ArrowRight
                  className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Button>
            </Link>
            <a
              href={`tel:${SITE_CONFIG.phone}`}
              className="inline-flex items-center justify-center px-8 py-4 min-h-touch bg-white/10 hover:bg-white/20 text-white text-lg font-semibold rounded-xl border-2 border-white/30 transition-all w-full sm:w-auto"
            >
              <Phone className="mr-2 h-5 w-5" aria-hidden="true" />
              {SITE_CONFIG.phone}
            </a>
          </div>

          {/* 카카오톡 상담 */}
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 text-gray-900 rounded-full font-medium hover:bg-yellow-300 transition-colors">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            <a
              href={SITE_CONFIG.kakaoChannel}
              target="_blank"
              rel="noopener noreferrer"
            >
              카카오톡으로 상담하기
            </a>
          </div>

          {/* 운영 시간 안내 */}
          <p className="mt-8 text-sm text-white/70">
            상담 가능 시간: 평일 09:00 - 18:00 (주말/공휴일 휴무)
          </p>
        </div>
      </Container>
    </section>
  )
}
