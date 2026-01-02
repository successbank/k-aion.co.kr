import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin } from 'lucide-react'
import { Container, Button } from '@/components/ui'
import { SITE_CONFIG } from '@/lib/constants'

export function HeroSection() {
  return (
    <section
      className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-400 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <Container>
        <div className="relative py-16 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* 텍스트 콘텐츠 */}
            <div className="text-center lg:text-left">
              {/* 슬로건 */}
              <p className="inline-block px-4 py-2 bg-white/20 rounded-full text-base md:text-lg font-medium mb-6 animate-fade-in">
                {SITE_CONFIG.subSlogan}
              </p>

              {/* 메인 타이틀 */}
              <h1
                id="hero-heading"
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-slide-up"
              >
                내 몸을 따뜻하게,
                <br />
                <span className="text-accent-400">건강 1도씨존</span>
              </h1>

              {/* 서브 카피 */}
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-xl mx-auto lg:mx-0 animate-slide-up">
                체온 1도의 변화가 만드는 건강한 일상.
                <br className="hidden md:block" />
                저주파, 초음파 치료기와 함께 시작하세요.
              </p>

              {/* CTA 버튼 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up">
                <Link href="/franchise/consultation">
                  <Button variant="accent" size="lg" className="group">
                    창업 상담 신청
                    <ArrowRight
                      className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Button>
                </Link>
                <Link href="/stores">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="bg-white/10 border-white text-white hover:bg-white/20"
                  >
                    <MapPin className="mr-2 h-5 w-5" aria-hidden="true" />
                    가까운 매장 찾기
                  </Button>
                </Link>
              </div>

              {/* 핵심 혜택 하이라이트 */}
              <div className="mt-10 pt-8 border-t border-white/20">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-accent-400">2,860만원</p>
                    <p className="text-sm md:text-base text-white/80 mt-1">창업 비용</p>
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-accent-400">1,330만원</p>
                    <p className="text-sm md:text-base text-white/80 mt-1">제품 지원</p>
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-accent-400">4회</p>
                    <p className="text-sm md:text-base text-white/80 mt-1">체계적 교육</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 이미지 */}
            <div className="relative hidden lg:block">
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* 이미지 플레이스홀더 */}
                <div className="absolute inset-0 bg-white/10 rounded-3xl flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-32 h-32 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-6xl" aria-hidden="true">🏥</span>
                    </div>
                    <p className="text-lg font-medium">건강 1도씨존</p>
                    <p className="text-sm text-white/70 mt-2">실제 매장 이미지</p>
                  </div>
                </div>

                {/* 장식 요소 */}
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-accent-400 rounded-2xl rotate-12 opacity-50" />
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-secondary-400 rounded-full opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* 하단 웨이브 */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="#FAFAFA"
          />
        </svg>
      </div>
    </section>
  )
}
