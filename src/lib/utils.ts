import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 클래스 이름을 병합하는 유틸리티 함수
 * clsx와 tailwind-merge를 결합하여 Tailwind CSS 클래스 충돌을 해결합니다.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 전화번호 포맷팅
 * @param phone - 전화번호 문자열
 * @returns 포맷된 전화번호 (예: 010-1234-5678)
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

/**
 * 전화번호 유효성 검사
 * @param phone - 전화번호 문자열
 * @returns 유효성 여부
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return /^01[0-9]{8,9}$/.test(cleaned)
}

/**
 * 금액 포맷팅
 * @param amount - 금액
 * @param unit - 단위 (기본: '원')
 * @returns 포맷된 금액 문자열
 */
export function formatCurrency(amount: number, unit: string = '원'): string {
  return `${amount.toLocaleString('ko-KR')}${unit}`
}

/**
 * 날짜 포맷팅
 * @param date - Date 객체 또는 ISO 문자열
 * @returns 포맷된 날짜 문자열
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * 외부 링크인지 확인
 * @param href - URL 문자열
 * @returns 외부 링크 여부
 */
export function isExternalLink(href: string): boolean {
  return href.startsWith('http://') || href.startsWith('https://')
}

/**
 * 스크롤을 부드럽게 이동
 * @param elementId - 이동할 요소의 ID
 * @param offset - 상단 여백 (기본: 80)
 */
export function scrollToElement(elementId: string, offset: number = 80): void {
  const element = document.getElementById(elementId)
  if (element) {
    const top = element.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

/**
 * 디바운스 함수
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * 거리 계산 (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // 지구 반경 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
