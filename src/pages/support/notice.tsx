import React, { useState } from 'react'
import Link from 'next/link'
import { Bell, ChevronRight, Search, Calendar } from 'lucide-react'
import { Section, Container, Card, CardContent, Button } from '@/components/ui'

// 샘플 공지사항 데이터
const NOTICES = [
  {
    id: 1,
    category: '안내',
    title: '2024년 설 연휴 고객센터 운영 안내',
    content: '2024년 설 연휴 기간 동안 고객센터 운영 시간을 안내드립니다.\n\n휴무 기간: 2024년 2월 9일(금) ~ 2월 12일(월)\n정상 운영: 2월 13일(화)부터\n\n연휴 기간 중 문의사항은 이메일 또는 1:1 문의를 이용해 주시면 순차적으로 답변드리겠습니다.',
    date: '2024-02-01',
    isImportant: true,
  },
  {
    id: 2,
    category: '이벤트',
    title: '신규 가맹점 오픈 기념 이벤트',
    content: '부산 해운대점 오픈을 기념하여 특별 이벤트를 진행합니다.\n\n이벤트 기간: 2024년 1월 15일 ~ 1월 31일\n대상: 해운대점 방문 고객\n혜택: 무료 체험 + 소모품 증정',
    date: '2024-01-15',
    isImportant: false,
  },
  {
    id: 3,
    category: '업데이트',
    title: '홈페이지 리뉴얼 안내',
    content: '건강 1도씨존 홈페이지가 새롭게 리뉴얼되었습니다.\n\n변경 사항:\n- 사용자 편의성 개선\n- 모바일 최적화\n- 매장 찾기 기능 강화\n\n더 나은 서비스로 보답하겠습니다.',
    date: '2024-01-10',
    isImportant: false,
  },
  {
    id: 4,
    category: '안내',
    title: '개인정보처리방침 변경 안내',
    content: '개인정보처리방침이 일부 변경되었음을 안내드립니다.\n\n변경 시행일: 2024년 1월 1일\n주요 변경 내용: 개인정보 보유 기간 명확화\n\n자세한 내용은 개인정보처리방침 페이지에서 확인하실 수 있습니다.',
    date: '2024-01-01',
    isImportant: false,
  },
  {
    id: 5,
    category: '이벤트',
    title: '겨울맞이 건강 캠페인',
    content: '추운 겨울, 건강 관리의 중요성을 알리는 캠페인을 진행합니다.\n\n기간: 2023년 12월 1일 ~ 2024년 2월 28일\n대상: 전 매장 방문 고객\n혜택: 무료 건강 상담 및 체험',
    date: '2023-12-01',
    isImportant: false,
  },
]

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: '안내', label: '안내' },
  { id: '이벤트', label: '이벤트' },
  { id: '업데이트', label: '업데이트' },
]

export default function NoticePage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNotice, setSelectedNotice] = useState<number | null>(null)

  const filteredNotices = NOTICES.filter((notice) => {
    const matchesCategory = selectedCategory === 'all' || notice.category === selectedCategory
    const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notice.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const currentNotice = selectedNotice ? NOTICES.find(n => n.id === selectedNotice) : null

  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white py-16 md:py-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              공지사항
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              건강 1도씨존의 새로운 소식과
              <br />
              안내사항을 확인하세요.
            </p>
          </div>
        </Container>
      </section>

      <Section background="light">
        {currentNotice ? (
          // 공지사항 상세
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setSelectedNotice(null)}
              className="text-secondary-500 hover:underline mb-6 flex items-center gap-1"
            >
              ← 목록으로 돌아가기
            </button>
            <Card>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentNotice.category === '안내' ? 'bg-blue-100 text-blue-600' :
                    currentNotice.category === '이벤트' ? 'bg-green-100 text-green-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {currentNotice.category}
                  </span>
                  {currentNotice.isImportant && (
                    <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                      중요
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  {currentNotice.title}
                </h2>
                <div className="flex items-center gap-2 text-text-secondary text-sm mb-6 pb-6 border-b">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  {currentNotice.date}
                </div>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line text-text-secondary leading-relaxed">
                    {currentNotice.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // 공지사항 목록
          <>
            {/* 검색 및 필터 */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                {/* 검색 */}
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="검색어를 입력하세요"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                  />
                </div>
                {/* 카테고리 필터 */}
                <div className="flex gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-secondary-500 text-white'
                          : 'bg-white text-text-secondary hover:bg-gray-100'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 공지사항 목록 */}
            <div className="max-w-4xl mx-auto">
              {filteredNotices.length > 0 ? (
                <div className="space-y-4">
                  {filteredNotices.map((notice) => (
                    <button
                      key={notice.id}
                      onClick={() => setSelectedNotice(notice.id)}
                      className="w-full text-left"
                    >
                      <Card hoverable className={notice.isImportant ? 'border-l-4 border-l-red-500' : ''}>
                        <CardContent>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-grow">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  notice.category === '안내' ? 'bg-blue-100 text-blue-600' :
                                  notice.category === '이벤트' ? 'bg-green-100 text-green-600' :
                                  'bg-purple-100 text-purple-600'
                                }`}>
                                  {notice.category}
                                </span>
                                {notice.isImportant && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs font-medium">
                                    중요
                                  </span>
                                )}
                              </div>
                              <h3 className="text-lg font-semibold text-text-primary">
                                {notice.title}
                              </h3>
                            </div>
                            <div className="flex items-center gap-4 text-text-secondary text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" aria-hidden="true" />
                                {notice.date}
                              </span>
                              <ChevronRight className="w-5 h-5" aria-hidden="true" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
                    <p className="text-text-secondary">검색 결과가 없습니다.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </Section>
    </>
  )
}

export async function getStaticProps() {
  return {
    props: {
      meta: {
        title: '공지사항',
        description: '건강 1도씨존 공지사항 - 새로운 소식과 안내사항을 확인하세요.',
        keywords: ['건강 1도씨존', '공지사항', '안내', '이벤트', '소식'],
      },
    },
  }
}
