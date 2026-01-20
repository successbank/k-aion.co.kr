'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';

// SSR 방지 (Quill은 브라우저에서만 동작)
// loading placeholder를 추가하여 Form.Item의 단일 자식 요소 조건 충족
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 200,
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#bfbfbf',
      }}
    >
      에디터 로딩 중...
    </div>
  ),
});

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  height?: number;
}

/**
 * 리치 텍스트 에디터 컴포넌트
 * Quill 기반의 WYSIWYG 에디터
 *
 * @param value - 에디터 값 (HTML 문자열)
 * @param onChange - 값 변경 핸들러
 * @param placeholder - 플레이스홀더 텍스트
 * @param readOnly - 읽기 전용 모드
 * @param height - 에디터 최소 높이 (px)
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '내용을 입력하세요...',
  readOnly = false,
  height = 200,
}) => {
  // Quill 모듈 설정
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'link', 'image'],
      ['clean'],
    ],
  };

  // Quill 포맷 설정
  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'align',
    'list',
    'bullet',
    'blockquote',
    'link',
    'image',
  ];

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{ height: `${height}px`, marginBottom: '42px' }}
      />
    </div>
  );
};

export default RichTextEditor;
