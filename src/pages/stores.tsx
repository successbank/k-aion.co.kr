import React, { useState, useMemo } from 'react'
import { MapPin, Phone, Clock, Navigation, Search } from 'lucide-react'
import { Section, Container, Card, CardContent, Button } from '@/components/ui'
import { REGIONS } from '@/lib/constants'
import type { Store } from '@/types'

// 샘플 매장 데이터
const SAMPLE_STORES: Store[] = [
  {
    id: 's1',
    name: '건강 1도씨존 강남점',
    address: '서울시 강남구 테헤란로 123',
    phone: '02-1234-5678',
    latitude: 37.5012,
    longitude: 127.0396,
    operatingHours: { weekday: '10:00 - 19:00', weekend: '10:00 - 17:00' },
    regionCode: '11',
    districtCode: '110',
    isActive: true,
  },
  {
    id: 's2',
    name: '건강 1도씨존 홍대점',
    address: '서울시 마포구 홍익로 45',
    phone: '02-2345-6789',
    latitude: 37.5565,
    longitude: 126.9239,
    operatingHours: { weekday: '10:00 - 20:00', weekend: '11:00 - 18:00' },
    regionCode: '11',
    districtCode: '116',
    isActive: true,
  },
  {
    id: 's3',
    name: '건강 1도씨존 해운대점',
    address: '부산시 해운대구 해운대해변로 789',
    phone: '051-123-4567',
    latitude: 35.1587,
    longitude: 129.1604,
    operatingHours: { weekday: '09:30 - 18:30', weekend: '10:00 - 17:00' },
    regionCode: '26',
    districtCode: '260',
    isActive: true,
  },
  {
    id: 's4',
    name: '건강 1도씨존 수원점',
    address: '경기도 수원시 팔달구 인계로 321',
    phone: '031-234-5678',
    latitude: 37.2636,
    longitude: 127.0286,
    operatingHours: { weekday: '10:00 - 19:00', weekend: '10:00 - 17:00' },
    regionCode: '41',
    districtCode: '410',
    isActive: true,
  },
]

export default function StoresPage() {
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const filteredStores = useMemo(() => {
    return SAMPLE_STORES.filter((store) => {
      const matchesRegion = !selectedRegion || store.regionCode === selectedRegion
      const matchesSearch =
        !searchQuery ||
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.address.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesRegion && matchesSearch && store.isActive
    })
  }, [selectedRegion, searchQuery])

  const handleGetDirections = (store: Store) => {
    const url = `https://map.kakao.com/link/to/${encodeURIComponent(store.name)},${store.latitude},${store.longitude}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white py-16 md:py-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              매장 찾기
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              가까운 건강 1도씨존 매장에서
              <br />
              무료 체험을 받아보세요.
            </p>

            {/* 검색 */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  placeholder="매장 이름 또는 주소로 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-text-primary text-base border-0 focus:ring-2 focus:ring-white/50"
                  aria-label="매장 검색"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Section background="light">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 필터 사이드바 */}
          <aside className="lg:col-span-1">
            <Card className="sticky top-28">
              <CardContent>
                <h2 className="text-lg font-semibold mb-4">지역 선택</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedRegion('')}
                    className={`w-full text-left px-4 py-3 rounded-lg text-base transition-colors ${
                      selectedRegion === ''
                        ? 'bg-primary-100 text-primary-600 font-medium'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    전체 지역
                  </button>
                  {REGIONS.map((region) => (
                    <button
                      key={region.code}
                      onClick={() => setSelectedRegion(region.code)}
                      className={`w-full text-left px-4 py-3 rounded-lg text-base transition-colors ${
                        selectedRegion === region.code
                          ? 'bg-primary-100 text-primary-600 font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {region.name}
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-text-secondary">
                    총 <span className="font-semibold text-text-primary">{filteredStores.length}</span>개 매장
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* 매장 목록 */}
          <div className="lg:col-span-2">
            {/* 지도 플레이스홀더 */}
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-200 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" aria-hidden="true" />
                    <p className="text-text-secondary">지도 영역</p>
                    <p className="text-sm text-gray-400">카카오맵 API 연동 예정</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 매장 카드 목록 */}
            {filteredStores.length > 0 ? (
              <div className="space-y-4">
                {filteredStores.map((store) => (
                  <Card key={store.id} hoverable>
                    <CardContent>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-text-primary mb-2">
                            {store.name}
                          </h3>
                          <div className="space-y-2 text-sm text-text-secondary">
                            <p className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                              {store.address}
                            </p>
                            {store.phone && (
                              <p className="flex items-center gap-2">
                                <Phone className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                                <a
                                  href={`tel:${store.phone}`}
                                  className="text-secondary-500 hover:underline"
                                >
                                  {store.phone}
                                </a>
                              </p>
                            )}
                            {store.operatingHours && (
                              <div className="flex items-start gap-2">
                                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                <div>
                                  <p>평일: {store.operatingHours.weekday}</p>
                                  <p>주말: {store.operatingHours.weekend}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleGetDirections(store)}
                          >
                            <Navigation className="h-4 w-4 mr-1" aria-hidden="true" />
                            길찾기
                          </Button>
                          {store.phone && (
                            <a href={`tel:${store.phone}`}>
                              <Button size="sm">
                                <Phone className="h-4 w-4 mr-1" aria-hidden="true" />
                                전화
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
                  <p className="text-lg text-text-secondary mb-2">
                    검색 결과가 없습니다.
                  </p>
                  <p className="text-text-secondary">
                    다른 지역이나 검색어로 다시 찾아보세요.
                  </p>
                </CardContent>
              </Card>
            )}
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
        title: '매장 찾기',
        description: '가까운 건강 1도씨존 매장을 찾아보세요. 전국 매장에서 무료 체험이 가능합니다.',
        keywords: ['건강 1도씨존 매장', '매장 찾기', '건강원 위치', '무료 체험'],
      },
    },
  }
}
