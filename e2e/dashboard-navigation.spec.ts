import { test, expect } from '@playwright/test';
import { setupDemoSession } from './test-helpers';

test.describe('Dashboard & Navigation Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoSession(page);
  });

  test('should display Zone Management and render available domains', async ({ page }) => {
    const zoneCards = page.locator('h3');
    await expect(zoneCards.first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/security-enterprise\.io|fintech-bank\.cloud/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('should switch between Vietnamese and English languages', async ({ page }) => {
    const langBtn = page.locator('button').filter({ hasText: /VI|EN/i }).first();
    await expect(langBtn).toBeVisible({ timeout: 10000 });

    // Open language dropdown
    await langBtn.click();
    await page.waitForTimeout(200);

    // Select English
    const enOption = page.locator('button').filter({ hasText: /English/i }).first();
    if (await enOption.isVisible()) {
      await enOption.click();
      await page.waitForTimeout(300);
      await expect(page.getByText('EN').first()).toBeVisible();

      // Switch back to Vietnamese
      await page.locator('button').filter({ hasText: /EN/i }).first().click();
      await page.waitForTimeout(200);
      await page.locator('button').filter({ hasText: /Tiếng Việt/i }).first().click();
      await page.waitForTimeout(300);
      await expect(page.getByText('VI').first()).toBeVisible();
    }
  });

  test('should navigate across primary sidebar views', async ({ page }) => {
    // Navigate to DNS Management
    await page.locator('button').filter({ hasText: /Quản lý DNS|DNS Manager/i }).first().click();
    await expect(page.locator('h1, h2').filter({ hasText: /DNS/i }).first()).toBeVisible({ timeout: 10000 });

    // Navigate to SSL/TLS Security
    await page.locator('button').filter({ hasText: /Bảo mật SSL\/TLS|SSL\/TLS/i }).first().click();
    await expect(page.locator('h1, h2').filter({ hasText: /SSL/i }).first()).toBeVisible({ timeout: 10000 });

    // Navigate to Rate Limiting
    await page.locator('button').filter({ hasText: /Rate Limiting/i }).first().click();
    await expect(page.locator('h1, h2').filter({ hasText: /Rate Limit/i }).first()).toBeVisible({ timeout: 10000 });

    // Navigate to Zero Trust & Tunnels
    await page.locator('button').filter({ hasText: /Zero Trust/i }).first().click();
    await expect(page.locator('h1, h2').filter({ hasText: /Zero Trust/i }).first()).toBeVisible({ timeout: 10000 });

    // Navigate back to Dashboard / Zones
    await page.locator('button').filter({ hasText: /Tổng quan Zones|Zones Overview/i }).first().click();
    await expect(page.getByText(/security-enterprise\.io|fintech-bank\.cloud/i).first()).toBeVisible({ timeout: 10000 });
  });
});
