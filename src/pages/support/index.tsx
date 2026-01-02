import React from 'react'
import Link from 'next/link'
import { Phone, Mail, MessageCircle, HelpCircle, Bell, FileText, ArrowRight } from 'lucide-react'
import { Section, SectionTitle, Container, Card, CardContent, Button } from '@/components/ui'
import { SITE_CONFIG } from '@/lib/constants'

export default function SupportPage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white py-16 md:py-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              고객센터
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              궁금하신 점이 있으시면
              <br />
              언제든지 문의해 주세요.
            </p>
          </div>
        </Container>
      </section>

      {/* 연락처 */}
      <Section background="white">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="text-center border-2 border-primary-100">
            <CardContent className="py-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-primary-500" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold mb-2">전화 상담</h3>
              <a
                href={`tel:${SITE_CONFIG.phone}`}
                className="text-2xl font-bold text-primary-500 hover:underline"
              >
                {SITE_CONFIG.phone}
              </a>
              <p className="text-text-secondary text-sm mt-2">
                평일 09:00 - 18:00
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-2 border-yellow-100">
            <CardContent className="py-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-yellow-600" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold mb-2">카카오톡 상담</h3>
              <a
                href={SITE_CONFIG.kakaoChannel}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button variant="accent">
                  카카오톡 상담하기
                </Button>
              </a>
              <p className="text-text-secondary text-sm mt-2">
                실시간 채팅 상담
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-2 border-gray-100">
            <CardContent className="py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-gray-600" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold mb-2">이메일 문의</h3>
              <a
                href={`mailto:${SITE_CONFIG.email}`}
                className="text-lg font-medium text-secondary-500 hover:underline"
              >
                {SITE_CONFIG.email}
              </a>
              <p className="text-text-secondary text-sm mt-2">
                24시간 접수 가능
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* 서비스 메뉴 */}
      <Section background="light">
        <SectionTitle
          title="고객센터 서비스"
          subtitle="필요한 정보를 빠르게 찾아보세요"
        />
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/support/notice" className="group">
            <Card hoverable className="h-full">
              <CardContent className="text-center py-10">
                <Bell className="w-16 h-16 text-secondary-500 mx-auto mb-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 className="text-xl font-semibold mb-2">공지사항</h3>
                <p className="text-text-secondary mb-4">
                  새로운 소식과 안내사항을 확인하세요.
                </p>
                <span className="inline-flex items-center text-secondary-500 font-medium">
                  바로가기 <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/support/faq" className="group">
            <Card hoverable className="h-full">
              <CardContent className="text-center py-10">
                <HelpCircle className="w-16 h-16 text-secondary-500 mx-auto mb-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 className="text-xl font-semibold mb-2">자주 묻는 질문</h3>
                <p className="text-text-secondary mb-4">
                  자주 묻는 질문과 답변을 확인하세요.
                </p>
                <span className="inline-flex items-center text-secondary-500 font-medium">
                  바로가기 <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/support/inquiry" className="group">
            <Card hoverable className="h-full">
              <CardContent className="text-center py-10">
                <FileText className="w-16 h-16 text-secondary-500 mx-auto mb-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 className="text-xl font-semibold mb-2">1:1 문의</h3>
                <p className="text-text-secondary mb-4">
                  개별 상담이 필요하시면 문의해 주세요.
                </p>
                <span className="inline-flex items-center text-secondary-500 font-medium">
                  바로가기 <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </Section>

      {/* 운영 시간 */}
      <Section background="white">
        <SectionTitle
          title="고객센터 운영 시간"
          subtitle="문의 시간을 확인해 주세요"
        />
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent>
              <div className="divide-y">
                <div className="flex justify-between py-4">
                  <span className="font-medium">전화 상담</span>
                  <span className="text-text-secondary">평일 09:00 - 18:00</span>
                </div>
                <div className="flex justify-between py-4">
                  <span className="font-medium">카카오톡 상담</span>
                  <span className="text-text-secondary">평일 09:00 - 18:00 (순차 답변)</span>
                </div>
                <div className="flex justify-between py-4">
                  <span className="font-medium">이메일 문의</span>
                  <span className="text-text-secondary">24시간 접수 (영업일 내 답변)</span>
                </div>
                <div className="flex justify-between py-4">
                  <span className="font-medium">1:1 문의</span>
                  <span className="text-text-secondary">24시간 접수 (영업일 내 답변)</span>
                </div>
              </div>
              <p className="text-sm text-text-secondary mt-4 text-center">
                * 주말 및 공휴일은 휴무입니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* CTA */}
      <Section background="primary" padding="lg">
        <div className="text-center max-w-2xl mx-auto text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            창업 상담이 필요하신가요?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            건강 1도씨존 창업에 관심이 있으시다면
            무료 상담을 신청해 주세요.
          </p>
          <Link href="/franchise/consultation">
            <Button variant="accent" size="lg" className="group">
              창업 상담 신청
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
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
        title: '고객센터',
        description: '건강 1도씨존 고객센터 - 전화, 카카오톡, 이메일로 문의해 주세요. FAQ, 공지사항, 1:1 문의.',
        keywords: ['건강 1도씨존', '고객센터', '문의', 'FAQ', '공지사항'],
      },
    },
  }
}
