import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Menu, X, ChevronDown, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Container } from '@/components/ui'
import { NAV_ITEMS, SITE_CONFIG } from '@/lib/constants'

export function Header() {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setOpenDropdown(null)
  }, [router.asPath])

  const isActive = (href: string) => {
    return router.asPath === href || router.asPath.startsWith(href + '/')
  }

  return (
    <>
      {/* 스킵 네비게이션 */}
      <a
        href="#main-content"
        className="skip-link"
      >
        본문으로 바로가기
      </a>

      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-white shadow-md'
            : 'bg-white/95 backdrop-blur-sm'
        )}
      >
        {/* 상단 바 */}
        <div className="bg-primary-500 text-white py-2 text-sm hidden md:block">
          <Container>
            <div className="flex justify-between items-center">
              <p>{SITE_CONFIG.slogan}</p>
              <a
                href={`tel:${SITE_CONFIG.phone}`}
                className="flex items-center gap-2 hover:text-accent-400 transition-colors"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                <span>{SITE_CONFIG.phone}</span>
              </a>
            </div>
          </Container>
        </div>

        {/* 메인 네비게이션 */}
        <Container>
          <nav
            className="flex items-center justify-between h-16 md:h-20"
            role="navigation"
            aria-label="메인 네비게이션"
          >
            {/* 로고 */}
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold text-primary-500"
            >
              <span className="sr-only">건강 1도씨존 홈</span>
              <span aria-hidden="true">건강 1도씨존</span>
            </Link>

            {/* 데스크톱 메뉴 */}
            <ul className="hidden lg:flex items-center gap-8">
              {NAV_ITEMS.map((item) => (
                <li
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => item.children && setOpenDropdown(item.href)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1 py-2 text-base font-medium transition-colors',
                      isActive(item.href)
                        ? 'text-primary-500'
                        : 'text-text-primary hover:text-primary-500'
                    )}
                    aria-expanded={item.children ? openDropdown === item.href : undefined}
                    aria-haspopup={item.children ? 'menu' : undefined}
                  >
                    {item.label}
                    {item.children && (
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          openDropdown === item.href && 'rotate-180'
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </Link>

                  {/* 드롭다운 메뉴 */}
                  {item.children && (
                    <div
                      className={cn(
                        'absolute top-full left-0 pt-2 transition-all duration-200',
                        openDropdown === item.href
                          ? 'opacity-100 visible'
                          : 'opacity-0 invisible pointer-events-none'
                      )}
                    >
                      <ul
                        className="w-48 bg-white rounded-lg shadow-lg py-2"
                        role="menu"
                      >
                        {item.children.map((child) => (
                          <li key={child.href} role="none">
                            <Link
                              href={child.href}
                              className={cn(
                                'block px-4 py-3 text-base transition-colors',
                                isActive(child.href)
                                  ? 'bg-primary-50 text-primary-500'
                                  : 'text-text-primary hover:bg-gray-50'
                              )}
                              role="menuitem"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {/* CTA 버튼 (데스크톱) */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/franchise/consultation"
                className="btn-primary"
              >
                창업 상담 신청
              </Link>
            </div>

            {/* 모바일 메뉴 버튼 */}
            <button
              type="button"
              className="lg:hidden p-2 text-text-primary"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </nav>
        </Container>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div
            id="mobile-menu"
            className="lg:hidden bg-white border-t shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <Container>
              <nav className="py-4" aria-label="모바일 네비게이션">
                <ul className="space-y-1">
                  {NAV_ITEMS.map((item) => (
                    <li key={item.href}>
                      {item.children ? (
                        <div>
                          <button
                            type="button"
                            className={cn(
                              'flex items-center justify-between w-full py-3 px-4 text-lg font-medium rounded-lg',
                              openDropdown === item.href
                                ? 'bg-primary-50 text-primary-500'
                                : 'text-text-primary'
                            )}
                            onClick={() =>
                              setOpenDropdown(
                                openDropdown === item.href ? null : item.href
                              )
                            }
                            aria-expanded={openDropdown === item.href}
                          >
                            {item.label}
                            <ChevronDown
                              className={cn(
                                'h-5 w-5 transition-transform',
                                openDropdown === item.href && 'rotate-180'
                              )}
                              aria-hidden="true"
                            />
                          </button>
                          {openDropdown === item.href && (
                            <ul className="mt-1 ml-4 space-y-1 border-l-2 border-primary-200">
                              {item.children.map((child) => (
                                <li key={child.href}>
                                  <Link
                                    href={child.href}
                                    className={cn(
                                      'block py-3 px-4 text-base rounded-r-lg',
                                      isActive(child.href)
                                        ? 'bg-primary-50 text-primary-500'
                                        : 'text-text-secondary hover:bg-gray-50'
                                    )}
                                  >
                                    {child.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className={cn(
                            'block py-3 px-4 text-lg font-medium rounded-lg',
                            isActive(item.href)
                              ? 'bg-primary-50 text-primary-500'
                              : 'text-text-primary hover:bg-gray-50'
                          )}
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>

                {/* 모바일 CTA */}
                <div className="mt-6 pt-6 border-t">
                  <Link
                    href="/franchise/consultation"
                    className="btn-primary w-full"
                  >
                    창업 상담 신청
                  </Link>
                  <a
                    href={`tel:${SITE_CONFIG.phone}`}
                    className="btn-secondary w-full mt-3"
                  >
                    <Phone className="h-5 w-5 mr-2" aria-hidden="true" />
                    {SITE_CONFIG.phone}
                  </a>
                </div>
              </nav>
            </Container>
          </div>
        )}
      </header>
    </>
  )
}
