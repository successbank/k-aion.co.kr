import * as React from 'react'
import { cn } from '@/lib/utils'
import { Container } from './Container'

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  background?: 'white' | 'light' | 'primary' | 'secondary'
  padding?: 'sm' | 'md' | 'lg'
}

const backgrounds = {
  white: 'bg-white',
  light: 'bg-background-light',
  primary: 'bg-primary-500 text-white',
  secondary: 'bg-secondary-500 text-white',
}

const paddings = {
  sm: 'py-8 md:py-12',
  md: 'py-12 md:py-16',
  lg: 'py-16 md:py-24',
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  (
    {
      className,
      children,
      containerSize = 'xl',
      background = 'white',
      padding = 'lg',
      ...props
    },
    ref
  ) => {
    return (
      <section
        ref={ref}
        className={cn(backgrounds[background], paddings[padding], className)}
        {...props}
      >
        <Container size={containerSize}>{children}</Container>
      </section>
    )
  }
)
Section.displayName = 'Section'

// 섹션 제목 컴포넌트
interface SectionTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  align?: 'left' | 'center'
}

const SectionTitle = React.forwardRef<HTMLDivElement, SectionTitleProps>(
  ({ className, title, subtitle, align = 'center', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'mb-12',
          align === 'center' && 'text-center',
          className
        )}
        {...props}
      >
        <h2 className="heading-2 mb-4">{title}</h2>
        {subtitle && (
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>
    )
  }
)
SectionTitle.displayName = 'SectionTitle'

export { Section, SectionTitle }
