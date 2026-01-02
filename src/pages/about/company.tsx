import React from 'react'
import { Building2, Users, Globe, Briefcase, CheckCircle } from 'lucide-react'
import { Section, SectionTitle, Container, Card, CardContent } from '@/components/ui'
import { SITE_CONFIG } from '@/lib/constants'

export default function CompanyPage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white py-16 md:py-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              기업 소개
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              건강 산업의 새로운 패러다임을 제시하는
              <br />
              {SITE_CONFIG.company}입니다.
            </p>
          </div>
        </Container>
      </section>

      {/* 회사 개요 */}
      <Section background="white">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-6">회사 개요</h2>
            <div className="space-y-4">
              <div className="flex border-b pb-4">
                <span className="w-32 font-medium text-text-primary">회사명</span>
                <span className="text-text-secondary">{SITE_CONFIG.company}</span>
              </div>
              <div className="flex border-b pb-4">
                <span className="w-32 font-medium text-text-primary">대표이사</span>
                <span className="text-text-secondary">{SITE_CONFIG.representative}</span>
              </div>
              <div className="flex border-b pb-4">
                <span className="w-32 font-medium text-text-primary">설립일</span>
                <span className="text-text-secondary">2020년 3월</span>
              </div>
              <div className="flex border-b pb-4">
                <span className="w-32 font-medium text-text-primary">사업자번호</span>
                <span className="text-text-secondary">{SITE_CONFIG.businessNumber}</span>
              </div>
              <div className="flex border-b pb-4">
                <span className="w-32 font-medium text-text-primary">소재지</span>
                <span className="text-text-secondary">{SITE_CONFIG.address}</span>
              </div>
              <div className="flex border-b pb-4">
                <span className="w-32 font-medium text-text-primary">대표전화</span>
                <span className="text-text-secondary">{SITE_CONFIG.phone}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-medium text-text-primary">이메일</span>
                <span className="text-text-secondary">{SITE_CONFIG.email}</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 rounded-2xl p-8 aspect-video flex items-center justify-center">
            <div className="text-center">
              <Building2 className="w-20 h-20 text-primary-500 mx-auto mb-4" aria-hidden="true" />
              <p className="text-lg font-medium text-text-primary">본사 전경</p>
              <p className="text-text-secondary mt-2">실제 이미지로 교체 예정</p>
            </div>
          </div>
        </div>
      </Section>

      {/* 사업 영역 */}
      <Section background="light">
        <SectionTitle
          title="사업 영역"
          subtitle="건강과 웰빙을 위한 종합 솔루션 제공"
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Briefcase,
              title: '의료기기 제조/판매',
              items: ['저주파 치료기', '초음파 치료기', '통증패치', '프리미엄 젤'],
            },
            {
              icon: Building2,
              title: '프랜차이즈 사업',
              items: ['건강 1도씨존 운영', '가맹점 모집/관리', '점주 교육 시스템'],
            },
            {
              icon: Users,
              title: '건강 컨설팅',
              items: ['맞춤형 건강 상담', '제품 사용 교육', 'A/S 서비스'],
            },
            {
              icon: Globe,
              title: '유통/물류',
              items: ['전국 물류 네트워크', '신속한 제품 공급', '재고 관리 시스템'],
            },
          ].map((area, index) => (
            <Card key={index} className="h-full">
              <CardContent>
                <area.icon className="w-12 h-12 text-primary-500 mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold mb-4">{area.title}</h3>
                <ul className="space-y-2">
                  {area.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-text-secondary">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* 조직도 */}
      <Section background="white">
        <SectionTitle
          title="조직 구성"
          subtitle="전문성과 효율성을 갖춘 조직 체계"
        />
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block bg-primary-500 text-white px-8 py-4 rounded-xl font-bold text-lg">
              대표이사
            </div>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {['경영지원팀', '영업팀', '마케팅팀', '고객지원팀'].map((dept, index) => (
              <Card key={index} className="text-center">
                <CardContent>
                  <h4 className="font-semibold text-primary-500">{dept}</h4>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* 인증/특허 */}
      <Section background="light">
        <SectionTitle
          title="인증 및 특허"
          subtitle="검증된 품질과 기술력"
        />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: '의료기기 제조업 허가', desc: '식품의약품안전처' },
            { title: 'ISO 13485', desc: '의료기기 품질경영시스템' },
            { title: 'CE 인증', desc: '유럽 안전 규격 인증' },
          ].map((cert, index) => (
            <Card key={index} className="text-center">
              <CardContent>
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-primary-500" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{cert.title}</h3>
                <p className="text-text-secondary">{cert.desc}</p>
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
        title: '기업 소개',
        description: '케이아이온 기업 소개 - 회사 개요, 사업 영역, 조직 구성, 인증 및 특허 정보를 확인하세요.',
        keywords: ['케이아이온', '기업 소개', '회사 개요', '사업 영역'],
      },
    },
  }
}
