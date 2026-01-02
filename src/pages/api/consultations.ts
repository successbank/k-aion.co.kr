import type { NextApiRequest, NextApiResponse } from 'next'
import type { ConsultationRequest, ApiResponse } from '@/types'

// 간단한 ID 생성 함수 (실제 환경에서는 UUID 라이브러리 사용 권장)
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 전화번호 기본 유효성 검사
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return /^01[0-9]{8,9}$/.test(cleaned)
}

// 입력값 정제
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ConsultationRequest>>
) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: '허용되지 않는 요청 방식입니다.',
    })
  }

  try {
    const { name, phone, preferredRegion, message, privacyAgreed } = req.body

    // 필수 필드 검증
    if (!name || !phone || !privacyAgreed) {
      return res.status(400).json({
        success: false,
        error: '필수 항목을 모두 입력해주세요.',
      })
    }

    // 성함 유효성 검사
    const sanitizedName = sanitizeInput(name)
    if (sanitizedName.length < 2 || sanitizedName.length > 50) {
      return res.status(400).json({
        success: false,
        error: '성함은 2~50자 이내로 입력해주세요.',
      })
    }

    // 전화번호 유효성 검사
    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        error: '올바른 전화번호 형식을 입력해주세요.',
      })
    }

    // 개인정보 동의 확인
    if (privacyAgreed !== true) {
      return res.status(400).json({
        success: false,
        error: '개인정보 수집 및 이용에 동의해주세요.',
      })
    }

    // 상담 신청 데이터 생성
    const consultation: ConsultationRequest = {
      id: generateId(),
      name: sanitizedName,
      phone: phone.replace(/\D/g, ''), // 숫자만 저장
      preferredRegion: preferredRegion ? sanitizeInput(preferredRegion) : '',
      message: message ? sanitizeInput(message).substring(0, 1000) : '', // 최대 1000자
      privacyAgreed: true,
      createdAt: new Date().toISOString(),
      status: 'pending',
    }

    // TODO: 실제 환경에서는 데이터베이스에 저장
    // await db.consultations.create(consultation)

    // TODO: 실제 환경에서는 알림 발송
    // - 관리자 이메일 알림
    // - 관리자 Slack 알림
    // - 고객 SMS/이메일 확인 발송

    console.log('[Consultation] New consultation request:', {
      id: consultation.id,
      name: consultation.name,
      region: consultation.preferredRegion,
      createdAt: consultation.createdAt,
    })

    return res.status(201).json({
      success: true,
      data: consultation,
      message: '상담 신청이 완료되었습니다.',
    })
  } catch (error) {
    console.error('[Consultation] Error:', error)
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    })
  }
}
