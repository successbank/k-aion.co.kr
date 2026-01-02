import { test, expect } from '@playwright/test';

test.describe('메인 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('페이지 타이틀이 올바르게 표시된다', async ({ page }) => {
    await expect(page).toHaveTitle(/건강 1도씨존/);
  });

  test('히어로 섹션이 표시된다', async ({ page }) => {
    // 메인 헤딩 확인
    const heroHeading = page.locator('h1');
    await expect(heroHeading).toContainText('건강 1도씨존');

    // CTA 버튼 확인
    const consultationButton = page.getByRole('link', { name: /창업 상담 신청/ });
    await expect(consultationButton.first()).toBeVisible();

    const storeButton = page.getByRole('link', { name: /가까운 매장 찾기/ });
    await expect(storeButton).toBeVisible();
  });

  test('히어로 섹션에 핵심 혜택 정보가 표시된다', async ({ page }) => {
    // 창업 비용
    await expect(page.locator('text=2,860만원').first()).toBeVisible();

    // 제품 지원
    await expect(page.locator('text=1,330만원').first()).toBeVisible();

    // 교육 횟수
    await expect(page.locator('text=4회').first()).toBeVisible();
  });

  test('브랜드 가치 섹션이 4개의 카드를 표시한다', async ({ page }) => {
    // 브랜드 가치 섹션으로 스크롤
    const sectionTitle = page.locator('text=건강 1도씨존이 특별한 이유');
    await sectionTitle.scrollIntoViewIfNeeded();

    // 4가지 핵심 가치 확인 (헤딩으로 확인)
    await expect(page.getByRole('heading', { name: '따뜻한 건강 케어' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '신뢰할 수 있는 품질' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '체계적인 교육 시스템' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '안정적인 수익 창출' })).toBeVisible();
  });

  test('제품 미리보기 섹션이 4개의 제품을 표시한다', async ({ page }) => {
    const sectionTitle = page.locator('text=건강 1도씨존 제품 소개');
    await sectionTitle.scrollIntoViewIfNeeded();

    // 4가지 제품 확인
    await expect(page.locator('text=저주파 치료기').first()).toBeVisible();
    await expect(page.locator('text=초음파 치료기').first()).toBeVisible();
    await expect(page.locator('text=통증패치').first()).toBeVisible();
    await expect(page.locator('text=프리미엄 젤').first()).toBeVisible();
  });

  test('네비게이션이 올바르게 작동한다', async ({ page }) => {
    // 로고 확인
    const logo = page.locator('header').getByRole('link').first();
    await expect(logo).toBeVisible();
  });

  test('창업 상담 신청 링크가 올바른 페이지로 연결된다', async ({ page }) => {
    const consultationLink = page.getByRole('link', { name: /창업 상담 신청/ }).first();
    await consultationLink.click();

    await expect(page).toHaveURL(/\/franchise\/consultation/);
    await expect(page.locator('h1')).toContainText('창업 상담 신청');
  });
});

test.describe('메인 페이지 - 접근성', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('스킵 네비게이션 링크가 존재한다', async ({ page }) => {
    const skipLink = page.locator('a.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('메인 콘텐츠 영역이 존재한다', async ({ page }) => {
    const main = page.locator('main#main-content');
    await expect(main).toBeAttached();
  });

  test('히어로 섹션에 적절한 헤딩 레벨이 사용된다', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1); // 페이지에 h1은 하나만
  });

  test('이미지에 대체 텍스트가 있다', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      const ariaHidden = await images.nth(i).getAttribute('aria-hidden');

      // 이미지는 alt 속성이 있거나 aria-hidden="true"여야 함
      expect(alt !== null || ariaHidden === 'true').toBeTruthy();
    }
  });
});

test.describe('메인 페이지 - 반응형', () => {
  test('모바일에서 햄버거 메뉴가 표시된다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 모바일 메뉴 버튼 확인 (lg:hidden이므로 모바일에서만 표시)
    const menuButton = page.locator('button[aria-label="메뉴 열기"]');
    await expect(menuButton).toBeVisible();
  });

  test('데스크톱에서 네비게이션 메뉴가 표시된다', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 데스크톱 메뉴 확인 (헤더 내 네비게이션 링크)
    const nav = page.locator('header nav');
    await expect(nav.getByRole('link', { name: '회사소개' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '제품 소개' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '창업 안내' })).toBeVisible();
  });
});
