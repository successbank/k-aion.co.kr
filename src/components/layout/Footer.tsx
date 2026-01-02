import React from 'react'
import Link from 'next/link'
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react'
import { Container } from '@/components/ui'
import { SITE_CONFIG, NAV_ITEMS } from '@/lib/constants'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* 메인 푸터 */}
      <div className="py-12 md:py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* 회사 정보 */}
            <div className="lg:col-span-1">
              <Link href="/" className="text-2xl font-bold text-white">
                건강 1도씨존
              </Link>
              <p className="mt-4 text-base leading-relaxed">
                {SITE_CONFIG.slogan}
              </p>
              <p className="mt-2 text-sm text-gray-400">
                {SITE_CONFIG.subSlogan}
              </p>
            </div>

            {/* 빠른 링크 */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                빠른 링크
              </h3>
              <ul className="space-y-3">
                {NAV_ITEMS.slice(0, 4).map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-base hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* 고객 지원 */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                고객 지원
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/support/faq"
                    className="text-base hover:text-white transition-colors"
                  >
                    자주 묻는 질문
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support/inquiry"
                    className="text-base hover:text-white transition-colors"
                  >
                    1:1 문의
                  </Link>
                </li>
                <li>
                  <Link
                    href="/stores"
                    className="text-base hover:text-white transition-colors"
                  >
                    매장 찾기
                  </Link>
                </li>
                <li>
                  <Link
                    href="/franchise/consultation"
                    className="text-base hover:text-white transition-colors"
                  >
                    창업 상담 신청
                  </Link>
                </li>
              </ul>
            </div>

            {/* 연락처 */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                연락처
              </h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href={`tel:${SITE_CONFIG.phone}`}
                    className="flex items-start gap-3 hover:text-white transition-colors"
                  >
                    <Phone className="h-5 w-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="text-base font-medium text-white">{SITE_CONFIG.phone}</p>
                      <p className="text-sm text-gray-400">평일 09:00 - 18:00</p>
                    </div>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${SITE_CONFIG.email}`}
                    className="flex items-center gap-3 hover:text-white transition-colors"
                  >
                    <Mail className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-base">{SITE_CONFIG.email}</span>
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span className="text-base">{SITE_CONFIG.address}</span>
                </li>
                <li>
                  <a
                    href={SITE_CONFIG.kakaoChannel}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-medium hover:bg-yellow-300 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" aria-hidden="true" />
                    카카오톡 상담
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </div>

      {/* 하단 정보 */}
      <div className="border-t border-gray-800 py-6">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <div className="text-center md:text-left">
              <p>
                상호: {SITE_CONFIG.company} | 대표: {SITE_CONFIG.representative} |
                사업자등록번호: {SITE_CONFIG.businessNumber}
              </p>
              <p className="mt-1">
                주소: {SITE_CONFIG.address}
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-white transition-colors">
                개인정보처리방침
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                이용약관
              </Link>
            </div>
          </div>
          <p className="text-center text-gray-500 mt-4 text-sm">
            © {currentYear} {SITE_CONFIG.company}. All rights reserved.
          </p>
        </Container>
      </div>
    </footer>
  )
}
