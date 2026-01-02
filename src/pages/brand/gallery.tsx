import React, { useState } from 'react'
import { X, ChevronLeft, ChevronRight, MapPin, Store } from 'lucide-react'
import { Section, SectionTitle, Container, Card, CardContent } from '@/components/ui'

// 샘플 갤러리 데이터
const GALLERY_ITEMS = [
  {
    id: 1,
    title: '강남점 외관',
    location: '서울시 강남구',
    category: 'exterior',
    image: null, // 실제 이미지 경로
  },
  {
    id: 2,
    title: '강남점 내부',
    location: '서울시 강남구',
    category: 'interior',
    image: null,
  },
  {
    id: 3,
    title: '홍대점 외관',
    location: '서울시 마포구',
    category: 'exterior',
    image: null,
  },
  {
    id: 4,
    title: '홍대점 상담공간',
    location: '서울시 마포구',
    category: 'interior',
    image: null,
  },
  {
    id: 5,
    title: '해운대점 외관',
    location: '부산시 해운대구',
    category: 'exterior',
    image: null,
  },
  {
    id: 6,
    title: '해운대점 체험공간',
    location: '부산시 해운대구',
    category: 'interior',
    image: null,
  },
  {
    id: 7,
    title: '수원점 외관',
    location: '경기도 수원시',
    category: 'exterior',
    image: null,
  },
  {
    id: 8,
    title: '수원점 제품진열',
    location: '경기도 수원시',
    category: 'product',
    image: null,
  },
]

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'exterior', label: '외관' },
  { id: 'interior', label: '내부' },
  { id: 'product', label: '제품 진열' },
]

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  const filteredItems = selectedCategory === 'all'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter(item => item.category === selectedCategory)

  const handlePrevious = () => {
    if (selectedImage === null) return
    const currentIndex = filteredItems.findIndex(item => item.id === selectedImage)
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredItems.length - 1
    setSelectedImage(filteredItems[prevIndex].id)
  }

  const handleNext = () => {
    if (selectedImage === null) return
    const currentIndex = filteredItems.findIndex(item => item.id === selectedImage)
    const nextIndex = currentIndex < filteredItems.length - 1 ? currentIndex + 1 : 0
    setSelectedImage(filteredItems[nextIndex].id)
  }

  const selectedItem = GALLERY_ITEMS.find(item => item.id === selectedImage)

  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-600 text-white py-16 md:py-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              매장 이미지 갤러리
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              전국 건강 1도씨존 매장의 인테리어와
              <br />
              분위기를 확인해보세요.
            </p>
          </div>
        </Container>
      </section>

      {/* 갤러리 */}
      <Section background="light">
        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-3 rounded-full text-base font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-text-secondary hover:bg-gray-100'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* 갤러리 그리드 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedImage(item.id)}
              className="group text-left"
            >
              <Card hoverable className="overflow-hidden">
                <div className="aspect-square bg-gray-200 flex items-center justify-center group-hover:bg-gray-300 transition-colors">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-16 h-16 text-gray-400" aria-hidden="true" />
                  )}
                </div>
                <CardContent>
                  <h3 className="font-semibold text-text-primary mb-1">{item.title}</h3>
                  <p className="text-sm text-text-secondary flex items-center gap-1">
                    <MapPin className="w-3 h-3" aria-hidden="true" />
                    {item.location}
                  </p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
            <p className="text-text-secondary">해당 카테고리의 이미지가 없습니다.</p>
          </div>
        )}
      </Section>

      {/* 라이트박스 모달 */}
      {selectedImage !== null && selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 transition-colors"
            aria-label="닫기"
          >
            <X className="w-8 h-8" />
          </button>

          {/* 이전 버튼 */}
          <button
            onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
            className="absolute left-4 p-2 text-white hover:text-gray-300 transition-colors"
            aria-label="이전 이미지"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>

          {/* 이미지 */}
          <div
            className="max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center mb-4">
              {selectedItem.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedItem.image}
                  alt={selectedItem.title}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center text-white">
                  <Store className="w-24 h-24 mx-auto mb-4 text-gray-500" aria-hidden="true" />
                  <p>이미지 준비 중</p>
                </div>
              )}
            </div>
            <div className="text-center text-white">
              <h3 className="text-xl font-semibold">{selectedItem.title}</h3>
              <p className="text-gray-400 flex items-center justify-center gap-1 mt-1">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                {selectedItem.location}
              </p>
            </div>
          </div>

          {/* 다음 버튼 */}
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-4 p-2 text-white hover:text-gray-300 transition-colors"
            aria-label="다음 이미지"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </div>
      )}

      {/* 인테리어 특징 */}
      <Section background="white">
        <SectionTitle
          title="건강 1도씨존 인테리어 특징"
          subtitle="편안하고 전문적인 매장 환경"
        />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: '따뜻한 분위기',
              description: '우드톤과 웜 컬러를 활용하여 편안하고 따뜻한 분위기를 연출합니다.',
            },
            {
              title: '전문적인 공간',
              description: '개인 상담 및 체험을 위한 독립된 공간을 제공합니다.',
            },
            {
              title: '청결한 환경',
              description: '위생과 청결을 최우선으로 관리하여 쾌적한 환경을 유지합니다.',
            },
          ].map((feature, index) => (
            <Card key={index}>
              <CardContent className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-500">{index + 1}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
    </>
  )
}

export async function getStaticProps() {
  return {
    props: {
      meta: {
        title: '매장 이미지 갤러리',
        description: '건강 1도씨존 전국 매장 이미지 갤러리 - 인테리어와 매장 분위기를 확인하세요.',
        keywords: ['건강 1도씨존', '매장', '갤러리', '인테리어', '매장 사진'],
      },
    },
  }
}
