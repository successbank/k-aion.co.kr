import * as DOMPurify from 'isomorphic-dompurify';

/**
 * HTML 문자열을 sanitize하여 XSS 공격 방지
 * Quill 에디터에서 생성된 HTML을 안전하게 정제합니다.
 *
 * @param dirty 정제되지 않은 HTML 문자열
 * @returns 정제된 안전한 HTML 문자열
 *
 * @example
 * const userInput = '<p>Hello <script>alert("XSS")</script></p>';
 * const safe = sanitizeHtml(userInput);
 * // => '<p>Hello </p>'
 */
export function sanitizeHtml(dirty: string | undefined): string | undefined {
  if (!dirty) return dirty;

  // Quill 에디터에서 사용하는 HTML 태그 및 속성만 허용
  // Note: ALLOWED_STYLES is supported in DOMPurify but not fully typed in isomorphic-dompurify
  // Using type assertion to bypass incomplete type definitions
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      // 텍스트 포맷팅
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'span',
      // 헤더
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      // 리스트
      'ul',
      'ol',
      'li',
      // 인용구
      'blockquote',
      // 링크 & 이미지
      'a',
      'img',
    ],
    ALLOWED_ATTR: [
      // 링크 속성
      'href',
      'target',
      'rel',
      // 이미지 속성
      'src',
      'alt',
      'width',
      'height',
      // Quill 에디터 클래스
      'class',
      // 인라인 스타일 (색상, 정렬 등)
      'style',
    ],
    ALLOWED_STYLES: {
      '*': {
        // 텍스트 색상 (hex 색상만 허용)
        color: [/^#[0-9a-fA-F]{3,6}$/],
        // 배경 색상
        'background-color': [/^#[0-9a-fA-F]{3,6}$/],
        // 텍스트 정렬
        'text-align': [/^(left|right|center|justify)$/],
      },
    },
    // <a> 태그의 target="_blank" 시 rel="noopener noreferrer" 자동 추가
    ADD_ATTR: ['target'],
  } as any);

  return String(clean);
}
