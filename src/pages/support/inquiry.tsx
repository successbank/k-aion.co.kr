import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Phone, Mail, MessageCircle, Clock, Send } from 'lucide-react'
import { Section, SectionTitle, Container, Card, CardContent, Button } from '@/components/ui'
import { SITE_CONFIG } from '@/lib/constants'
import { formatPhoneNumber, isValidPhoneNumber } from '@/lib/utils'

interface InquiryFormData {
  name: string
  email: string
  phone: string
  category: string
  title: string
  content: string
  privacyAgreed: boolean
}

const INQUIRY_CATEGORIES = [
  { value: '', label: '문의 유형을 선택해주세요' },
  { value: 'product', label: '제품 문의' },
  { value: 'store', label: '매장 이용 문의' },
  { value: 'franchise', label: '창업 문의' },
  { value: 'as', label: 'A/S 문의' },
  { value: 'partnership', label: '제휴/협력 문의' },
  { value: 'other', label: '기타 문의' },
]

export default function InquiryPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<InquiryFormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      category: '',
      title: '',
      content: '',
      privacyAgreed: false,
    },
  })

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    if (value.length <= 11) {
      setValue('phone', formatPhoneNumber(value))
    }
  }

  const onSubmit = async (data: InquiryFormData) => {
    setIsSubmitting(true)
    setSubmitResult(null)

    // 실제 구현시 API 호출
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setSubmitResult({
      success: true,
      message: '문의가 접수되었습니다. 영업일 기준 1~2일 내에 답변드리겠습니다.',
    })
    reset()
    setIsSubmitting(false)
  }

  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white py-16 md:py-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              1:1 문의
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              궁금하신 점이 있으시면
              <br />
              문의 남겨주세요.
            </p>
          </div>
        </Container>
      </section>

      <Section background="light">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 문의 폼 */}
          <div className="lg:col-span-2">
            <Card padding="lg">
              <CardContent>
                <h2 className="text-xl font-semibold mb-6">문의하기</h2>

                {submitResult && (
                  <div
                    className={`mb-6 p-4 rounded-lg ${
                      submitResult.success
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                    role="alert"
                  >
                    {submitResult.message}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* 이름 */}
                    <div>
                      <label htmlFor="name" className="block text-base font-medium text-text-primary mb-2">
                        이름 <span className="text-primary-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        {...register('name', { required: '이름을 입력해주세요.' })}
                        className={`w-full ${errors.name ? 'border-red-500' : ''}`}
                        placeholder="홍길동"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-500" role="alert">{errors.name.message}</p>
                      )}
                    </div>

                    {/* 이메일 */}
                    <div>
                      <label htmlFor="email" className="block text-base font-medium text-text-primary mb-2">
                        이메일 <span className="text-primary-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        {...register('email', {
                          required: '이메일을 입력해주세요.',
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: '올바른 이메일 형식을 입력해주세요.',
                          },
                        })}
                        className={`w-full ${errors.email ? 'border-red-500' : ''}`}
                        placeholder="example@email.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-500" role="alert">{errors.email.message}</p>
                      )}
                    </div>

                    {/* 연락처 */}
                    <div>
                      <label htmlFor="phone" className="block text-base font-medium text-text-primary mb-2">
                        연락처
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        {...register('phone', {
                          validate: (value) =>
                            !value || isValidPhoneNumber(value) || '올바른 전화번호 형식을 입력해주세요.',
                        })}
                        onChange={handlePhoneChange}
                        className={`w-full ${errors.phone ? 'border-red-500' : ''}`}
                        placeholder="010-1234-5678"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-500" role="alert">{errors.phone.message}</p>
                      )}
                    </div>

                    {/* 문의 유형 */}
                    <div>
                      <label htmlFor="category" className="block text-base font-medium text-text-primary mb-2">
                        문의 유형 <span className="text-primary-500">*</span>
                      </label>
                      <select
                        id="category"
                        {...register('category', { required: '문의 유형을 선택해주세요.' })}
                        className={`w-full ${errors.category ? 'border-red-500' : ''}`}
                      >
                        {INQUIRY_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="mt-1 text-sm text-red-500" role="alert">{errors.category.message}</p>
                      )}
                    </div>
                  </div>

                  {/* 제목 */}
                  <div className="mt-6">
                    <label htmlFor="title" className="block text-base font-medium text-text-primary mb-2">
                      제목 <span className="text-primary-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      {...register('title', { required: '제목을 입력해주세요.' })}
                      className={`w-full ${errors.title ? 'border-red-500' : ''}`}
                      placeholder="문의 제목을 입력해주세요"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-500" role="alert">{errors.title.message}</p>
                    )}
                  </div>

                  {/* 내용 */}
                  <div className="mt-6">
                    <label htmlFor="content" className="block text-base font-medium text-text-primary mb-2">
                      문의 내용 <span className="text-primary-500">*</span>
                    </label>
                    <textarea
                      id="content"
                      {...register('content', { required: '문의 내용을 입력해주세요.' })}
                      rows={6}
                      className={`w-full resize-none ${errors.content ? 'border-red-500' : ''}`}
                      placeholder="문의하실 내용을 자세히 작성해주세요."
                    />
                    {errors.content && (
                      <p className="mt-1 text-sm text-red-500" role="alert">{errors.content.message}</p>
                    )}
                  </div>

                  {/* 개인정보 동의 */}
                  <div className="mt-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('privacyAgreed', { required: '개인정보 수집에 동의해주세요.' })}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-secondary-500 focus:ring-secondary-500"
                      />
                      <span className="text-base text-text-secondary">
                        <span className="font-medium text-text-primary">
                          개인정보 수집 및 이용에 동의합니다.
                        </span>{' '}
                        <span className="text-primary-500">*</span>
                        <br />
                        <span className="text-sm">
                          수집 항목: 이름, 이메일, 연락처 / 수집 목적: 문의 답변 / 보유 기간: 답변 완료 후 1년
                        </span>
                      </span>
                    </label>
                    {errors.privacyAgreed && (
                      <p className="mt-1 text-sm text-red-500" role="alert">{errors.privacyAgreed.message}</p>
                    )}
                  </div>

                  {/* 제출 버튼 */}
                  <div className="mt-8">
                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      <Send className="w-5 h-5 mr-2" aria-hidden="true" />
                      {isSubmitting ? '접수 중...' : '문의 접수하기'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 다른 연락 방법 */}
            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold mb-4">다른 연락 방법</h3>
                <ul className="space-y-4">
                  <li>
                    <a
                      href={`tel:${SITE_CONFIG.phone}`}
                      className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      <Phone className="w-5 h-5 text-primary-500" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-text-primary">{SITE_CONFIG.phone}</p>
                        <p className="text-sm text-text-secondary">전화 상담</p>
                      </div>
                    </a>
                  </li>
                  <li>
                    <a
                      href={SITE_CONFIG.kakaoChannel}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5 text-yellow-600" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-text-primary">카카오톡 상담</p>
                        <p className="text-sm text-text-secondary">실시간 채팅</p>
                      </div>
                    </a>
                  </li>
                  <li>
                    <a
                      href={`mailto:${SITE_CONFIG.email}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Mail className="w-5 h-5 text-gray-600" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-text-primary">{SITE_CONFIG.email}</p>
                        <p className="text-sm text-text-secondary">이메일 문의</p>
                      </div>
                    </a>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* 안내사항 */}
            <Card className="bg-secondary-50 border-secondary-200">
              <CardContent>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-secondary-500" aria-hidden="true" />
                  답변 안내
                </h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>• 영업일 기준 1~2일 내 답변</li>
                  <li>• 답변은 입력하신 이메일로 발송</li>
                  <li>• 주말/공휴일 접수 건은 다음 영업일 처리</li>
                  <li>• 긴급 문의는 전화 상담 이용</li>
                </ul>
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
        title: '1:1 문의',
        description: '건강 1도씨존 1:1 문의 - 궁금하신 점을 문의해 주세요. 영업일 기준 1~2일 내 답변드립니다.',
        keywords: ['건강 1도씨존', '1:1 문의', '고객 문의', '상담', '질문'],
      },
    },
  }
}
