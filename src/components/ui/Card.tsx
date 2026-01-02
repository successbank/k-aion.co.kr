import * as React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hoverable?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

const paddings = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, hoverable = false, padding = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-2xl shadow-soft',
          paddings[padding],
          hoverable && 'transition-shadow hover:shadow-card cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

// 카드 헤더
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('mb-4', className)} {...props}>
        {children}
      </div>
    )
  }
)
CardHeader.displayName = 'CardHeader'

// 카드 타이틀
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
  as?: 'h2' | 'h3' | 'h4'
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, as: Tag = 'h3', ...props }, ref) => {
    return (
      <Tag
        ref={ref}
        className={cn('text-xl font-semibold text-text-primary', className)}
        {...props}
      >
        {children}
      </Tag>
    )
  }
)
CardTitle.displayName = 'CardTitle'

// 카드 설명
interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-base text-text-secondary mt-2', className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)
CardDescription.displayName = 'CardDescription'

// 카드 콘텐츠
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(className)} {...props}>
        {children}
      </div>
    )
  }
)
CardContent.displayName = 'CardContent'

// 카드 푸터
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('mt-6 pt-4 border-t border-gray-100', className)} {...props}>
        {children}
      </div>
    )
  }
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
