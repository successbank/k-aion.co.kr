import { test, expect } from '@playwright/test';

test.describe('창업 상담 신청', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/franchise/consultation');
    await page.waitForLoadState('networkidle');
  });

  test('상담 신청 페이지가 올바르게 표시된다', async ({ page }) => {
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/창업 상담 신청/);

    // 헤딩 확인
    await expect(page.locator('h1')).toContainText('창업 상담 신청');

    // 폼 확인
    await expect(page.locator('form')).toBeVisible();
  });

  test('필수 입력 필드가 모두 존재한다', async ({ page }) => {
    // 성함 필드
    await expect(page.locator('#name')).toBeVisible();

    // 연락처 필드
    await expect(page.locator('#phone')).toBeVisible();

    // 희망 지역 필드
    await expect(page.locator('#preferredRegion')).toBeVisible();

    // 문의 내용 필드
    await expect(page.locator('#message')).toBeVisible();

    // 개인정보 동의 체크박스
    await expect(page.locator('input[type="checkbox"]')).toBeVisible();

    // 제출 버튼
    await expect(page.getByRole('button', { name: /상담 신청하기/ })).toBeVisible();
  });

  test('필수 항목 미입력 시 에러 메시지가 표시된다', async ({ page }) => {
    // 바로 제출 시도
    await page.getByRole('button', { name: /상담 신청하기/ }).click();

    // 에러 메시지 확인
    await expect(page.locator('text=성함을 입력해주세요')).toBeVisible();
  });

  test('전화번호가 자동으로 포맷팅된다', async ({ page }) => {
    const phoneInput = page.locator('#phone');

    // 전화번호 입력
    await phoneInput.fill('01012345678');

    // 포맷팅 확인
    await expect(phoneInput).toHaveValue('010-1234-5678');
  });

  test('잘못된 전화번호 형식에 에러가 표시된다', async ({ page }) => {
    const phoneInput = page.locator('#phone');

    // 잘못된 전화번호 입력
    await phoneInput.fill('123');
    await page.locator('#name').fill('홍길동'); // 다른 필드로 포커스 이동

    // 제출 시도
    await page.getByRole('button', { name: /상담 신청하기/ }).click();

    // 에러 메시지 확인
    await expect(page.locator('text=올바른 전화번호 형식')).toBeVisible();
  });

  test('개인정보 동의 없이 제출 시 에러가 표시된다', async ({ page }) => {
    // 필수 필드 입력
    await page.locator('#name').fill('홍길동');
    await page.locator('#phone').fill('01012345678');

    // 개인정보 동의 없이 제출
    await page.getByRole('button', { name: /상담 신청하기/ }).click();

    // 에러 메시지 확인
    await expect(page.locator('text=개인정보 수집 및 이용에 동의해주세요')).toBeVisible();
  });

  test('정상적으로 상담 신청이 완료된다', async ({ page }) => {
    // API 모킹
    await page.route('**/api/consultations', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'test-id' },
          message: '상담 신청이 완료되었습니다.',
        }),
      });
    });

    // 폼 입력
    await page.locator('#name').fill('홍길동');
    await page.locator('#phone').fill('01012345678');
    await page.locator('#preferredRegion').selectOption('서울');
    await page.locator('#message').fill('창업 비용에 대해 문의드립니다.');
    await page.locator('input[type="checkbox"]').check();

    // 제출
    await page.getByRole('button', { name: /상담 신청하기/ }).click();

    // 성공 메시지 확인
    await expect(page.locator('text=상담 신청이 완료되었습니다')).toBeVisible();
  });

  test('API 오류 시 에러 메시지가 표시된다', async ({ page }) => {
    // API 오류 모킹
    await page.route('**/api/consultations', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: '서버 오류가 발생했습니다.',
        }),
      });
    });

    // 폼 입력
    await page.locator('#name').fill('홍길동');
    await page.locator('#phone').fill('01012345678');
    await page.locator('input[type="checkbox"]').check();

    // 제출
    await page.getByRole('button', { name: /상담 신청하기/ }).click();

    // 에러 메시지 확인 (실제 구현에서는 "상담 신청 중 오류가 발생했습니다" 또는 유사한 메시지)
    await expect(page.locator('form [role="alert"]')).toBeVisible();
  });
});

test.describe('창업 상담 신청 - 연락처 정보', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/franchise/consultation');
    await page.waitForLoadState('networkidle');
  });

  test('연락처 정보가 표시된다', async ({ page }) => {
    // 전화번호 확인 (SITE_CONFIG.phone = '1588-0000')
    await expect(page.locator('text=1588-0000').first()).toBeVisible();

    // 이메일 확인 (SITE_CONFIG.email = 'info@k-aion.co.kr')
    await expect(page.locator('text=info@k-aion.co.kr').first()).toBeVisible();

    // 카카오톡 상담 링크 확인
    await expect(page.locator('text=카카오톡 상담').first()).toBeVisible();
  });

  test('창업 혜택 요약이 표시된다', async ({ page }) => {
    // 창업 비용 확인 (formatCurrency(28600000) = "28,600,000원")
    await expect(page.locator('text=28,600,000원')).toBeVisible();

    // 제품 지원 확인 (formatCurrency(13300000) + " 상당" = "13,300,000원 상당")
    await expect(page.locator('text=13,300,000원 상당')).toBeVisible();
  });
});

test.describe('창업 상담 신청 - 접근성', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/franchise/consultation');
    await page.waitForLoadState('networkidle');
  });

  test('폼 필드에 적절한 레이블이 있다', async ({ page }) => {
    // 레이블과 입력 필드 연결 확인
    const nameLabel = page.locator('label[for="name"]');
    await expect(nameLabel).toBeVisible();
    await expect(nameLabel).toContainText('성함');

    const phoneLabel = page.locator('label[for="phone"]');
    await expect(phoneLabel).toBeVisible();
    await expect(phoneLabel).toContainText('연락처');
  });

  test('에러 메시지에 role="alert"가 있다', async ({ page }) => {
    // 제출 시도
    await page.getByRole('button', { name: /상담 신청하기/ }).click();

    // alert role 확인
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage.first()).toBeVisible();
  });

  test('키보드로 폼을 탐색할 수 있다', async ({ page }) => {
    // 이름 필드에 포커스
    await page.locator('#name').focus();

    // Tab 키로 폼 탐색
    await page.keyboard.press('Tab');

    // 다음 입력 필드(phone)에 포커스 확인
    const activeElement = page.locator('#phone');
    await expect(activeElement).toBeFocused();
  });
});
