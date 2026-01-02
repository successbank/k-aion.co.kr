import React from 'react'
import Head from 'next/head'
import { Header } from './Header'
import { Footer } from './Footer'
import { DEFAULT_META, SITE_CONFIG } from '@/lib/constants'
import type { PageMeta } from '@/types'

interface LayoutProps {
  children: React.ReactNode
  meta?: Partial<PageMeta>
}

export function Layout({ children, meta = {} }: LayoutProps) {
  const pageMeta = {
    title: meta.title ? `${meta.title} | ${SITE_CONFIG.name}` : DEFAULT_META.title,
    description: meta.description || DEFAULT_META.description,
    keywords: meta.keywords || DEFAULT_META.keywords,
    ogImage: meta.ogImage || DEFAULT_META.ogImage,
    ogType: meta.ogType || 'website',
  }

  return (
    <>
      <Head>
        {/* 기본 메타 태그 */}
        <title>{pageMeta.title}</title>
        <meta name="description" content={pageMeta.description} />
        <meta name="keywords" content={pageMeta.keywords?.join(', ')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />

        {/* Open Graph */}
        <meta property="og:title" content={pageMeta.title} />
        <meta property="og:description" content={pageMeta.description} />
        <meta property="og:type" content={pageMeta.ogType} />
        <meta property="og:image" content={pageMeta.ogImage} />
        <meta property="og:site_name" content={SITE_CONFIG.name} />
        <meta property="og:locale" content="ko_KR" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageMeta.title} />
        <meta name="twitter:description" content={pageMeta.description} />
        <meta name="twitter:image" content={pageMeta.ogImage} />

        {/* 파비콘 */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* 테마 색상 */}
        <meta name="theme-color" content="#E53935" />
        <meta name="msapplication-TileColor" content="#E53935" />

        {/* 폰트 프리로드 */}
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          as="style"
        />
      </Head>

      <div className="flex flex-col min-h-screen">
        <Header />

        {/* 헤더 높이만큼 상단 여백 */}
        <div className="h-16 md:h-28" aria-hidden="true" />

        <main id="main-content" className="flex-grow" tabIndex={-1}>
          {children}
        </main>

        <Footer />
      </div>
    </>
  )
}
