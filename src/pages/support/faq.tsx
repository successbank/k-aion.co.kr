import React, { useState } from 'react'
import Link from 'next/link'
import { Search, Phone, MessageCircle } from 'lucide-react'
import { Section, Container, Card, CardContent, Button } from '@/components/ui'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/Accordion'
import { FAQ_DATA, getFAQsByCategory } from '@/lib/faq-data'
import { FAQ_CATEGORIES, SITE_CONFIG } from '@/lib/constants'
import type { FAQCategory } from '@/types'

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<FAQCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFAQs = FAQ_DATA.filter((faq) => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  }).sort((a, b) => a.order - b.order)

  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white py-16 md:py-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              자주 묻는 질문
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              건강 1도씨존에 대해 궁금한 점을 찾아보세요.
              <br />
              원하는 답변을 찾지 못하셨다면 언제든 문의해 주세요.
            </p>

            {/* 검색 입력 */}
            <div className="relative max-w-xl mx-auto">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="질문 검색하기..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl text-text-primary text-base border-0 focus:ring-2 focus:ring-white/50"
                aria-label="FAQ 검색"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ 콘텐츠 */}
      <Section background="light">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* 카테고리 사이드바 */}
          <aside className="lg:col-span-1">
            <Card className="sticky top-28">
              <CardContent>
                <h2 className="text-lg font-semibold mb-4">카테고리</h2>
                <nav aria-label="FAQ 카테고리">
                  <ul className="space-y-2">
                    <li>
                      <button
                        onClick={() => setActiveCategory('all')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-base transition-colors ${
                          activeCategory === 'all'
                            ? 'bg-primary-100 text-primary-600 font-medium'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        전체 ({FAQ_DATA.length})
                      </button>
                    </li>
                    {FAQ_CATEGORIES.map((category) => {
                      const count = getFAQsByCategory(category.id).length
                      return (
                        <li key={category.id}>
                          <button
                            onClick={() => setActiveCategory(category.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-base transition-colors ${
                              activeCategory === category.id
                                ? 'bg-primary-100 text-primary-600 font-medium'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            {category.label} ({count})
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* FAQ 목록 */}
          <div className="lg:col-span-3">
            {filteredFAQs.length > 0 ? (
              <Card>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFAQs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger className="text-left">
                          <span className="pr-4">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="leading-relaxed">{faq.answer}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-lg text-text-secondary mb-4">
                    검색 결과가 없습니다.
                  </p>
                  <p className="text-text-secondary">
                    다른 키워드로 검색하거나, 아래 연락처로 문의해 주세요.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 추가 문의 안내 */}
            <Card className="mt-6 bg-primary-50 border border-primary-100">
              <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      찾는 답변이 없으신가요?
                    </h3>
                    <p className="text-text-secondary">
                      전문 상담원이 친절하게 안내해 드립니다.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={`tel:${SITE_CONFIG.phone}`}
                      className="inline-flex items-center justify-center px-6 py-3 bg-white rounded-lg text-primary-500 font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Phone className="h-5 w-5 mr-2" aria-hidden="true" />
                      {SITE_CONFIG.phone}
                    </a>
                    <Link href="/support/inquiry">
                      <Button>1:1 문의하기</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
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
        title: '자주 묻는 질문 (FAQ)',
        description: '건강 1도씨존 창업, 제품, 매장 이용에 관한 자주 묻는 질문과 답변을 확인하세요.',
        keywords: ['건강 1도씨존 FAQ', '창업 문의', '제품 문의', '자주 묻는 질문'],
      },
    },
  }
}
