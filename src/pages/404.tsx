import React from 'react'
import Link from 'next/link'
import { Home, ArrowLeft, Search, Phone, MessageCircle } from 'lucide-react'
import { Container, Button } from '@/components/ui'
import { SITE_CONFIG } from '@/lib/constants'

export default function Custom404() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <Container>
        <div className="text-center max-w-2xl mx-auto py-16">
          {/* 404 숫자 */}
          <div className="mb-8">
            <span className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              404
            </span>
          </div>

          {/* 메시지 */}
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            페이지를 찾을 수 없습니다
          </h1>
          <p className="text-lg text-text-secondary mb-8">
            요청하신 페이지가 삭제되었거나,
            <br />
            주소가 변경되었을 수 있습니다.
          </p>

          {/* 주요 링크 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/">
              <Button size="lg" className="w-full sm:w-auto">
                <Home className="w-5 h-5 mr-2" aria-hidden="true" />
                홈으로 돌아가기
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => window.history.back()}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
              이전 페이지로
            </Button>
          </div>

          {/* 유용한 링크 */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-lg font-semibold text-text-primary mb-6">
              찾으시는 정보가 있으신가요?
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link
                href="/franchise/consultation"
                className="flex items-center gap-3 p-4 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Search className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-text-primary">창업 상담</p>
                  <p className="text-sm text-text-secondary">무료 상담 신청하기</p>
                </div>
              </Link>

              <Link
                href="/stores"
                className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50 hover:bg-secondary-100 transition-colors"
              >
                <div className="w-10 h-10 bg-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Search className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-text-primary">매장 찾기</p>
                  <p className="text-sm text-text-secondary">가까운 매장 검색</p>
                </div>
              </Link>

              <Link
                href="/support/faq"
                className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-text-primary">자주 묻는 질문</p>
                  <p className="text-sm text-text-secondary">FAQ 확인하기</p>
                </div>
              </Link>

              <a
                href={`tel:${SITE_CONFIG.phone}`}
                className="flex items-center gap-3 p-4 rounded-lg bg-accent-50 hover:bg-accent-100 transition-colors"
              >
                <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-text-primary">전화 문의</p>
                  <p className="text-sm text-text-secondary">{SITE_CONFIG.phone}</p>
                </div>
              </a>
            </div>
          </div>

          {/* 추가 안내 */}
          <p className="mt-8 text-sm text-text-secondary">
            문제가 계속되면{' '}
            <Link href="/support/inquiry" className="text-secondary-500 hover:underline font-medium">
              1:1 문의
            </Link>
            를 이용해 주세요.
          </p>
        </div>
      </Container>
    </div>
  )
}
