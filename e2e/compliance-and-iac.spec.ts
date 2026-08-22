import { test, expect } from '@playwright/test';
import { setupDemoSession } from './test-helpers';

test.describe('CI/CD Continuous Compliance & Terraform IaC Suite', () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoSession(page);
    // Click CI/CD in Sidebar
    const complianceNavBtn = page.locator('button').filter({ hasText: /CI\/CD/i }).first();
    await expect(complianceNavBtn).toBeVisible({ timeout: 10000 });
    await complianceNavBtn.click();
    await page.waitForTimeout(500);
  });

  test('should synthesize Terraform HCL code for the current zone', async ({ page }) => {
    await expect(page.locator('h1, h2').filter({ hasText: /Continuous Compliance|CI\/CD/i }).first()).toBeVisible({ timeout: 10000 });

    // Click Terraform subtab
    const terraformTabBtn = page.locator('button').filter({ hasText: /Terraform/i }).first();
    await expect(terraformTabBtn).toBeVisible({ timeout: 5000 });
    await terraformTabBtn.click();
    await page.waitForTimeout(500);

    // Check code viewer is rendered
    await expect(page.locator('button:has-text("main.tf")').first()).toBeVisible({ timeout: 8000 });

    // Verify Download & Copy buttons are present
    await expect(page.locator('button').filter({ hasText: /Sao chép|Copy/i }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /main\.tf/i }).first()).toBeVisible();
  });

  test('should navigate to Scheduled Drift CRON tab and trigger immediate scan', async ({ page }) => {
    // Click CRON subtab
    const cronTabBtn = page.locator('button').filter({ hasText: /CRON/i }).first();
    if (await cronTabBtn.isVisible()) {
      await cronTabBtn.click();
      await page.waitForTimeout(400);

      // Verify CRON configuration panel is visible
      await expect(page.getByText(/CRON|Scheduled Drift/i).first()).toBeVisible();

      // Trigger immediate scan if present
      const scanNowBtn = page.locator('button').filter({ hasText: /Quét|Scan/i }).first();
      if (await scanNowBtn.isVisible()) {
        await scanNowBtn.click();
        await page.waitForTimeout(600);
      }
    }
  });

  test('should navigate to Alert Channels tab and inspect webhook configurations', async ({ page }) => {
    // Click Alerts subtab
    const alertsTabBtn = page.locator('button').filter({ hasText: /Cảnh báo|Alert/i }).first();
    if (await alertsTabBtn.isVisible()) {
      await alertsTabBtn.click();
      await page.waitForTimeout(400);

      // Verify Alert section is rendered
      await expect(page.getByText(/Slack|Discord|Webhook|Kênh Cảnh báo|Alert Channels/i).first()).toBeVisible();
    }
  });
});
