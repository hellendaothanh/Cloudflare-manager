import { Page, expect } from '@playwright/test';

export async function setupDemoSession(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('cf_accounts', JSON.stringify([
      {
        id: 'acc-demo-01',
        name: 'Enterprise Demo Account',
        token: 'demo-token',
        organization: 'Enterprise Demo Organization',
        addedAt: new Date().toISOString(),
        isDemo: true,
      },
      {
        id: 'acc-ecommerce-02',
        name: 'E-Commerce Retail Ltd',
        token: 'demo-token-ecom',
        organization: 'Retail Global Ltd',
        addedAt: new Date().toISOString(),
        isDemo: true,
      }
    ]));
    localStorage.setItem('cf_active_account_id', 'acc-demo-01');
    localStorage.setItem('cf_active_zone_id', 'mock-zone-1');
    localStorage.setItem('cf_user_role', 'admin');
    localStorage.setItem('cf_app_language', 'vi');
  });
  await page.goto('/');
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(500);
}
