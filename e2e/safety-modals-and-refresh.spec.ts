import { test, expect } from '@playwright/test';
import { setupDemoSession } from './test-helpers';

test.describe('Refresh Buttons & Safety Confirmation Modals Suite', () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoSession(page);
  });

  test('should display Refresh List button in DNS View and open Confirmation Modal on Proxy toggle', async ({ page }) => {
    // Navigate to DNS view
    await page.click('button:has-text("Quản lý DNS"), button:has-text("DNS")');
    await expect(page.locator('h1')).toContainText(/DNS/i);

    // Verify Refresh button is visible
    const refreshBtn = page.locator('button:has-text("Làm mới danh sách"), button:has-text("Refresh List")').first();
    await expect(refreshBtn).toBeVisible();

    // Click on a Proxy button (Proxied / DNS Only)
    const proxyBadge = page.locator('button:has-text("Proxied"), button:has-text("DNS Only")').first();
    await expect(proxyBadge).toBeVisible();
    await proxyBadge.click();

    // Expect Safety Confirmation Modal to appear
    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Proxy/i);

    // Cancel modal first to verify it closes safely
    const cancelBtn = modal.locator('button:has-text("Hủy"), button:has-text("Cancel")');
    await cancelBtn.click();
    await expect(modal).not.toBeVisible();
  });

  test('should display Refresh List button in Security WAF and open Modal on Delete / Security Level change', async ({ page }) => {
    // Navigate to WAF & Security view
    await page.click('button:has-text("Tường lửa WAF"), button:has-text("WAF")');
    await expect(page.locator('h1')).toContainText(/WAF/i);

    // Verify Refresh button is visible
    const refreshBtn = page.locator('button:has-text("Làm mới danh sách"), button:has-text("Refresh List")').first();
    await expect(refreshBtn).toBeVisible();

    // Switch to Settings tab
    const settingsTab = page.locator('button:has-text("Cài đặt"), button:has-text("Settings")').last();
    await settingsTab.click();

    // Click on a Security level button
    const secCard = page.locator('button:has-text("Under Attack"), button:has-text("Đang bị tấn công")').first();
    await expect(secCard).toBeVisible();
    await secCard.click();

    // Verify modal appeared
    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Security Level/i);

    // Close modal
    const cancelBtn = modal.locator('button:has-text("Hủy"), button:has-text("Cancel")');
    await cancelBtn.click();
    await expect(modal).not.toBeVisible();
  });

  test('should display Confirmation Modal when changing SSL/TLS encryption mode', async ({ page }) => {
    // Navigate to SSL/TLS view
    await page.click('button:has-text("Bảo mật SSL/TLS"), button:has-text("SSL/TLS")');
    await expect(page.locator('h1')).toContainText(/SSL/i);

    // Check Refresh button
    const refreshBtn = page.locator('button:has-text("Làm mới"), button:has-text("Refresh")').first();
    await expect(refreshBtn).toBeVisible();

    // Click on Off mode card (different from current mode)
    const offModeCard = page.locator('button:has-text("Off (Không bảo mật)"), button:has-text("Off (Not Secure)"), button:has-text("Off")').first();
    await expect(offModeCard).toBeVisible();
    await offModeCard.click();

    // Check modal appeared
    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/SSL/i);

    // Cancel modal
    const cancelBtn = modal.locator('button:has-text("Hủy"), button:has-text("Cancel")');
    await cancelBtn.click();
    await expect(modal).not.toBeVisible();
  });
});
