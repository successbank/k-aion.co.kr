import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  describe('렌더링', () => {
    it('기본 버튼을 렌더링한다', () => {
      render(<Button>클릭하세요</Button>);
      expect(screen.getByRole('button', { name: '클릭하세요' })).toBeInTheDocument();
    });

    it('children이 올바르게 렌더링된다', () => {
      render(<Button>테스트 버튼</Button>);
      expect(screen.getByText('테스트 버튼')).toBeInTheDocument();
    });
  });

  describe('variant', () => {
    it('primary variant 클래스가 적용된다', () => {
      render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-primary-500');
    });

    it('secondary variant 클래스가 적용된다', () => {
      render(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('border-primary-500');
    });

    it('accent variant 클래스가 적용된다', () => {
      render(<Button variant="accent">Accent</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-accent-500');
    });

    it('ghost variant 클래스가 적용된다', () => {
      render(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole('button')).toHaveClass('hover:bg-gray-100');
    });
  });

  describe('size', () => {
    it('sm 사이즈 클래스가 적용된다', () => {
      render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-10');
    });

    it('md 사이즈 클래스가 적용된다', () => {
      render(<Button size="md">Medium</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-12');
    });

    it('lg 사이즈 클래스가 적용된다', () => {
      render(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-14');
    });
  });

  describe('fullWidth', () => {
    it('fullWidth가 true일 때 w-full 클래스가 적용된다', () => {
      render(<Button fullWidth>Full Width</Button>);
      expect(screen.getByRole('button')).toHaveClass('w-full');
    });

    it('fullWidth가 false일 때 w-full 클래스가 없다', () => {
      render(<Button fullWidth={false}>Not Full Width</Button>);
      expect(screen.getByRole('button')).not.toHaveClass('w-full');
    });
  });

  describe('상태', () => {
    it('disabled 상태에서 클릭이 무시된다', () => {
      const handleClick = jest.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('disabled 상태에서 스타일이 적용된다', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByRole('button')).toHaveClass('disabled:opacity-50');
    });

    it('loading 상태에서 버튼이 비활성화된다', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('loading 상태에서 로딩 텍스트가 표시된다', () => {
      render(<Button loading>Submit</Button>);
      expect(screen.getByText('처리 중...')).toBeInTheDocument();
    });

    it('loading 상태에서 스피너가 표시된다', () => {
      render(<Button loading>Submit</Button>);
      const spinner = screen.getByRole('button').querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('이벤트', () => {
    it('클릭 이벤트가 동작한다', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('asChild', () => {
    it('asChild가 true일 때 Slot으로 렌더링된다', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      expect(screen.getByRole('link', { name: 'Link Button' })).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('type 속성을 지정할 수 있다', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('aria-label을 지정할 수 있다', () => {
      render(<Button aria-label="닫기">X</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', '닫기');
    });
  });
});
