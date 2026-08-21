import { test, expect } from '@playwright/test';
import { setupDemoSession } from './test-helpers';

test.describe('Cache Purge & Dev Mode Safety Suite', () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoSession(page);
  });

  test('should trigger safety confirmation modal before toggling Development Mode', async ({ page }) => {
    // Look for Dev Mode toggle button on a Zone card
    const devModeBtn = page.getByRole('button', { name: /Dev Mode:/i }).first();
    if (await devModeBtn.isVisible()) {
      await devModeBtn.click();

      // Verify Safety Confirmation Modal pops up
      const modal = page.locator('div[role="dialog"]').or(page.locator('.fixed.inset-0'));
      await expect(modal.filter({ hasText: /Xác nhận|Development Mode|Confirm/i }).first()).toBeVisible();

      // Click Cancel to safely close without making accidental changes
      const cancelBtn = page.getByRole('button', { name: /Hủy|Cancel/i }).first();
      await cancelBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('should open Granular Purge Center and inspect tabs', async ({ page }) => {
    // Open Quick Actions modal from navbar
    const quickActionsBtn = page.locator('button').filter({ hasText: /Tác vụ Nhanh|Quick Actions/i }).first();
    await expect(quickActionsBtn).toBeVisible({ timeout: 10000 });
    await quickActionsBtn.click();

    // Verify modal content is rendered
    await expect(page.locator('h2').filter({ hasText: /Xóa Cache|Cache Purge/i }).first()).toBeVisible({ timeout: 10000 });

    // Switch to Purge by Hostnames tab inside modal
    const hostsTab = page.locator('button').filter({ hasText: /Hostnames/i }).first();
    if (await hostsTab.isVisible()) {
      await hostsTab.click();
      await expect(page.locator('textarea')).toBeVisible();
    }

    // Switch to Tags tab inside modal
    const tagsTab = page.locator('button').filter({ hasText: /Tag/i }).first();
    if (await tagsTab.isVisible()) {
      await tagsTab.click();
      await expect(page.locator('textarea')).toBeVisible();
    }

    // Close modal
    const closeBtn = page.locator('button:has-text("✕")').or(page.getByRole('button', { name: /Đóng|Close|Hủy/i })).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  test('should execute 1-click purge everything and show confirmation feedback', async ({ page }) => {
    const purgeBtn = page.locator('button:has-text("Purge Cache")').first();
    await expect(purgeBtn).toBeVisible({ timeout: 10000 });
    await purgeBtn.click();

    // Switch to Purge Everything tab
    const everythingTab = page.locator('button').filter({ hasText: /Xóa toàn bộ|Everything/i }).first();
    if (await everythingTab.isVisible()) {
      await everythingTab.click();

      // Click Purge action button
      const executeBtn = page.getByRole('button', { name: /Xác nhận Xóa Toàn bộ Cache|Purge All/i }).first();
      if (await executeBtn.isVisible()) {
        await executeBtn.click();
        await page.waitForTimeout(600);

        // Verify success feedback
        await expect(page.locator('.text-emerald-400').or(page.getByText(/thành công|successfully/i)).first()).toBeVisible();
      }
    }
  });
});
