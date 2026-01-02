import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Card, CardContent } from '@/components/ui'
import { formatPhoneNumber, isValidPhoneNumber } from '@/lib/utils'
import { REGIONS } from '@/lib/constants'
import type { ConsultationRequest, ApiResponse } from '@/types'

interface FormData {
  name: string
  phone: string
  preferredRegion: string
  message: string
  privacyAgreed: boolean
}

interface ConsultationFormProps {
  onSuccess?: () => void
}

export function ConsultationForm({ onSuccess }: ConsultationFormProps) {
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
    watch,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      phone: '',
      preferredRegion: '',
      message: '',
      privacyAgreed: false,
    },
  })

  const phoneValue = watch('phone')

  // 전화번호 자동 포맷팅
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    if (value.length <= 11) {
      setValue('phone', formatPhoneNumber(value))
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          preferredRegion: data.preferredRegion,
          message: data.message,
          privacyAgreed: data.privacyAgreed,
        } as ConsultationRequest),
      })

      const result: ApiResponse<ConsultationRequest> = await response.json()

      if (result.success) {
        setSubmitResult({
          success: true,
          message: '상담 신청이 완료되었습니다. 빠른 시일 내에 연락드리겠습니다.',
        })
        reset()
        onSuccess?.()
      } else {
        setSubmitResult({
          success: false,
          message: result.error || '상담 신청 중 오류가 발생했습니다. 다시 시도해주세요.',
        })
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card padding="lg">
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* 결과 메시지 */}
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

          {/* 성함 */}
          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-base font-medium text-text-primary mb-2"
            >
              성함 <span className="text-primary-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              {...register('name', {
                required: '성함을 입력해주세요.',
                minLength: {
                  value: 2,
                  message: '성함은 2자 이상 입력해주세요.',
                },
              })}
              className={`w-full ${errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              placeholder="홍길동"
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="mt-2 text-sm text-red-500" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* 연락처 */}
          <div className="mb-6">
            <label
              htmlFor="phone"
              className="block text-base font-medium text-text-primary mb-2"
            >
              연락처 <span className="text-primary-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              {...register('phone', {
                required: '연락처를 입력해주세요.',
                validate: (value) =>
                  isValidPhoneNumber(value) ||
                  '올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)',
              })}
              onChange={handlePhoneChange}
              className={`w-full ${errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              placeholder="010-1234-5678"
              aria-invalid={errors.phone ? 'true' : 'false'}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
            />
            {errors.phone && (
              <p id="phone-error" className="mt-2 text-sm text-red-500" role="alert">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* 희망 지역 */}
          <div className="mb-6">
            <label
              htmlFor="preferredRegion"
              className="block text-base font-medium text-text-primary mb-2"
            >
              희망 창업 지역
            </label>
            <select
              id="preferredRegion"
              {...register('preferredRegion')}
              className="w-full"
            >
              <option value="">선택해주세요</option>
              {REGIONS.map((region) => (
                <option key={region.code} value={region.name}>
                  {region.name}
                </option>
              ))}
              <option value="미정">미정 / 상담 후 결정</option>
            </select>
          </div>

          {/* 문의 내용 */}
          <div className="mb-6">
            <label
              htmlFor="message"
              className="block text-base font-medium text-text-primary mb-2"
            >
              문의 내용
            </label>
            <textarea
              id="message"
              {...register('message')}
              rows={4}
              className="w-full resize-none"
              placeholder="궁금하신 점이나 상담받고 싶은 내용을 자유롭게 작성해주세요."
            />
          </div>

          {/* 개인정보 동의 */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('privacyAgreed', {
                  required: '개인정보 수집 및 이용에 동의해주세요.',
                })}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-base text-text-secondary">
                <span className="text-text-primary font-medium">
                  개인정보 수집 및 이용에 동의합니다.
                </span>{' '}
                <span className="text-primary-500">*</span>
                <br />
                <span className="text-sm">
                  수집 항목: 성함, 연락처 / 수집 목적: 창업 상담 / 보유 기간: 상담 완료 후 1년
                </span>
              </span>
            </label>
            {errors.privacyAgreed && (
              <p className="mt-2 text-sm text-red-500" role="alert">
                {errors.privacyAgreed.message}
              </p>
            )}
          </div>

          {/* 제출 버튼 */}
          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? '신청 중...' : '상담 신청하기'}
          </Button>

          <p className="mt-4 text-sm text-text-secondary text-center">
            상담 신청 후 영업일 기준 1~2일 내에 연락드립니다.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
