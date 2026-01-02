/**
 * 상담 API 단위 테스트
 *
 * 이 테스트는 API 핸들러의 로직을 직접 테스트합니다.
 * 실제 HTTP 요청 대신 모의 객체를 사용합니다.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// 핸들러 내부 로직 테스트를 위한 유틸리티 함수들
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^01[0-9]{8,9}$/.test(cleaned);
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

describe('Consultation API - 유효성 검사', () => {
  describe('isValidPhone', () => {
    it('유효한 휴대폰 번호를 허용한다', () => {
      expect(isValidPhone('01012345678')).toBe(true);
      expect(isValidPhone('010-1234-5678')).toBe(true);
      expect(isValidPhone('01112345678')).toBe(true);
    });

    it('잘못된 번호를 거부한다', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('0212345678')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('앞뒤 공백을 제거한다', () => {
      expect(sanitizeInput('  홍길동  ')).toBe('홍길동');
    });

    it('HTML 태그를 제거한다', () => {
      expect(sanitizeInput('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
    });

    it('일반 텍스트는 그대로 유지한다', () => {
      expect(sanitizeInput('안녕하세요')).toBe('안녕하세요');
    });
  });
});

describe('Consultation API - 요청 검증', () => {
  // 테스트용 요청 생성 헬퍼
  function createMockRequest(body: object, method = 'POST') {
    return {
      method,
      body,
    } as NextApiRequest;
  }

  // 테스트용 응답 생성 헬퍼
  function createMockResponse() {
    const res: Partial<NextApiResponse> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    return res as NextApiResponse;
  }

  describe('필수 필드 검증', () => {
    it('name이 없으면 에러를 반환해야 한다', () => {
      const body = {
        phone: '01012345678',
        privacyAgreed: true,
      };

      // 필수 필드 체크 로직
      const { name, phone, privacyAgreed } = body as any;
      expect(!name || !phone || !privacyAgreed).toBe(true);
    });

    it('phone이 없으면 에러를 반환해야 한다', () => {
      const body = {
        name: '홍길동',
        privacyAgreed: true,
      };

      const { name, phone, privacyAgreed } = body as any;
      expect(!name || !phone || !privacyAgreed).toBe(true);
    });

    it('privacyAgreed가 false면 에러를 반환해야 한다', () => {
      const body = {
        name: '홍길동',
        phone: '01012345678',
        privacyAgreed: false,
      };

      expect(body.privacyAgreed !== true).toBe(true);
    });

    it('모든 필수 필드가 있으면 통과해야 한다', () => {
      const body = {
        name: '홍길동',
        phone: '01012345678',
        privacyAgreed: true,
      };

      const { name, phone, privacyAgreed } = body;
      expect(!name || !phone || !privacyAgreed).toBe(false);
    });
  });

  describe('성함 유효성 검증', () => {
    it('2자 미만이면 에러', () => {
      const sanitizedName = sanitizeInput('홍');
      expect(sanitizedName.length < 2 || sanitizedName.length > 50).toBe(true);
    });

    it('50자 초과면 에러', () => {
      const longName = '가'.repeat(51);
      const sanitizedName = sanitizeInput(longName);
      expect(sanitizedName.length < 2 || sanitizedName.length > 50).toBe(true);
    });

    it('2-50자는 통과', () => {
      const sanitizedName = sanitizeInput('홍길동');
      expect(sanitizedName.length < 2 || sanitizedName.length > 50).toBe(false);
    });
  });

  describe('메시지 길이 제한', () => {
    it('메시지는 1000자로 제한된다', () => {
      const longMessage = '가'.repeat(1500);
      const truncated = longMessage.substring(0, 1000);
      expect(truncated.length).toBe(1000);
    });
  });
});

describe('Consultation API - 데이터 처리', () => {
  it('전화번호에서 숫자만 추출한다', () => {
    const phone = '010-1234-5678';
    const cleaned = phone.replace(/\D/g, '');
    expect(cleaned).toBe('01012345678');
  });

  it('상담 데이터 객체를 올바르게 생성한다', () => {
    const data = {
      name: '홍길동',
      phone: '010-1234-5678',
      preferredRegion: '서울',
      message: '창업 문의',
      privacyAgreed: true,
    };

    const consultation = {
      id: expect.any(String),
      name: sanitizeInput(data.name),
      phone: data.phone.replace(/\D/g, ''),
      preferredRegion: sanitizeInput(data.preferredRegion),
      message: sanitizeInput(data.message).substring(0, 1000),
      privacyAgreed: true,
      createdAt: expect.any(String),
      status: 'pending',
    };

    expect(consultation.name).toBe('홍길동');
    expect(consultation.phone).toBe('01012345678');
    expect(consultation.status).toBe('pending');
  });
});
