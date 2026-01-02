import {
  cn,
  formatPhoneNumber,
  isValidPhoneNumber,
  formatCurrency,
  formatDate,
  isExternalLink,
  calculateDistance,
} from '@/lib/utils';

describe('cn (className merger)', () => {
  it('단일 클래스를 반환한다', () => {
    expect(cn('class1')).toBe('class1');
  });

  it('여러 클래스를 병합한다', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('조건부 클래스를 처리한다', () => {
    expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
  });

  it('Tailwind 충돌을 해결한다', () => {
    expect(cn('px-4', 'px-8')).toBe('px-8');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('undefined와 null을 무시한다', () => {
    expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2');
  });
});

describe('formatPhoneNumber', () => {
  it('11자리 전화번호를 포맷팅한다', () => {
    expect(formatPhoneNumber('01012345678')).toBe('010-1234-5678');
  });

  it('10자리 전화번호를 포맷팅한다', () => {
    expect(formatPhoneNumber('0101234567')).toBe('010-123-4567');
  });

  it('이미 포맷팅된 번호는 그대로 반환한다', () => {
    expect(formatPhoneNumber('010-1234-5678')).toBe('010-1234-5678');
  });

  it('하이픈이 있는 번호도 처리한다', () => {
    expect(formatPhoneNumber('010-12345678')).toBe('010-1234-5678');
  });

  it('짧은 번호는 그대로 반환한다', () => {
    expect(formatPhoneNumber('010123')).toBe('010123');
  });
});

describe('isValidPhoneNumber', () => {
  it('유효한 11자리 휴대폰 번호를 검증한다', () => {
    expect(isValidPhoneNumber('01012345678')).toBe(true);
    expect(isValidPhoneNumber('010-1234-5678')).toBe(true);
  });

  it('유효한 10자리 휴대폰 번호를 검증한다', () => {
    expect(isValidPhoneNumber('0101234567')).toBe(true);
  });

  it('010, 011, 016, 017, 018, 019로 시작하는 번호를 허용한다', () => {
    expect(isValidPhoneNumber('01112345678')).toBe(true);
    expect(isValidPhoneNumber('01612345678')).toBe(true);
  });

  it('02로 시작하는 유선전화를 거부한다', () => {
    expect(isValidPhoneNumber('0212345678')).toBe(false);
  });

  it('짧은 번호를 거부한다', () => {
    expect(isValidPhoneNumber('010123')).toBe(false);
  });

  it('너무 긴 번호를 거부한다', () => {
    expect(isValidPhoneNumber('010123456789')).toBe(false);
  });

  it('문자가 포함된 번호를 거부한다', () => {
    expect(isValidPhoneNumber('010-abcd-5678')).toBe(false);
  });
});

describe('formatCurrency', () => {
  it('숫자를 원화 형식으로 포맷팅한다', () => {
    expect(formatCurrency(28600000)).toBe('28,600,000원');
  });

  it('사용자 정의 단위를 사용할 수 있다', () => {
    expect(formatCurrency(100, '만원')).toBe('100만원');
  });

  it('0을 포맷팅한다', () => {
    expect(formatCurrency(0)).toBe('0원');
  });

  it('큰 숫자를 포맷팅한다', () => {
    expect(formatCurrency(1000000000)).toBe('1,000,000,000원');
  });
});

describe('formatDate', () => {
  it('Date 객체를 한국어 날짜로 포맷팅한다', () => {
    const date = new Date('2026-01-02');
    expect(formatDate(date)).toMatch(/2026년.*1월.*2일/);
  });

  it('ISO 문자열을 한국어 날짜로 포맷팅한다', () => {
    expect(formatDate('2026-01-02T00:00:00Z')).toMatch(/2026년.*1월.*2일/);
  });
});

describe('isExternalLink', () => {
  it('http 링크를 외부 링크로 인식한다', () => {
    expect(isExternalLink('http://example.com')).toBe(true);
  });

  it('https 링크를 외부 링크로 인식한다', () => {
    expect(isExternalLink('https://example.com')).toBe(true);
  });

  it('상대 경로를 내부 링크로 인식한다', () => {
    expect(isExternalLink('/about')).toBe(false);
    expect(isExternalLink('./about')).toBe(false);
  });

  it('앵커 링크를 내부 링크로 인식한다', () => {
    expect(isExternalLink('#section')).toBe(false);
  });
});

describe('calculateDistance', () => {
  it('같은 위치의 거리는 0이다', () => {
    expect(calculateDistance(37.5665, 126.978, 37.5665, 126.978)).toBeCloseTo(0);
  });

  it('서울-부산 거리를 계산한다 (약 320-330km)', () => {
    const distance = calculateDistance(
      37.5665, 126.978,  // 서울
      35.1796, 129.0756  // 부산
    );
    expect(distance).toBeGreaterThan(300);
    expect(distance).toBeLessThan(350);
  });

  it('거리는 항상 양수이다', () => {
    expect(calculateDistance(0, 0, 90, 180)).toBeGreaterThan(0);
  });
});
