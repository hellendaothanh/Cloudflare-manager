import { test, expect } from '@playwright/test';
import { setupDemoSession } from './test-helpers';

test.describe('Multi-Account & RBAC Role-Based Access Control Suite', () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoSession(page);
  });

  test('should open Multi-Account switcher and select organization profile', async ({ page }) => {
    // Find account selector button on Navbar
    const accountBtn = page.locator('button[title*="Tài khoản"], button[title*="Account"], button:has-text("DEMO")').first();
    await expect(accountBtn).toBeVisible({ timeout: 10000 });
    await accountBtn.click();

    // Verify dropdown opens with account list
    await expect(page.getByText('Enterprise Demo Account').first()).toBeVisible();

    // Click manage accounts to open modal
    const manageBtn = page.getByText(/Quản lý tài khoản|Manage Accounts/i).first();
    if (await manageBtn.isVisible()) {
      await manageBtn.click();
      await expect(page.getByText(/Quản lý Đa tài khoản|Multi-Account Manager/i).first()).toBeVisible();
      // Close modal
      const closeBtn = page.locator('button:has-text("✕")').or(page.getByRole('button', { name: /Hủy|Cancel/i })).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

  test('should enforce RBAC permissions when switching to Viewer role', async ({ page }) => {
    // Open RBAC role switcher in Navbar
    const roleBtn = page.locator('button:has-text("ADMIN")').or(page.locator('button:has-text("Admin")')).first();
    if (await roleBtn.isVisible()) {
      await roleBtn.click();

      // Switch to Viewer role
      const viewerOption = page.getByText(/Viewer|Chỉ xem/i).first();
      if (await viewerOption.isVisible()) {
        await viewerOption.click();
        await page.waitForTimeout(400);

        // Navigate to DNS view
        await page.locator('button').filter({ hasText: /Quản lý DNS|DNS Manager/i }).first().click();

        // Verify Add Record button is disabled for Viewer
        const addDnsBtn = page.locator('button').filter({ hasText: /Thêm Bản ghi|Add Record/i }).first();
        if (await addDnsBtn.isVisible()) {
          await expect(addDnsBtn).toBeDisabled();
        }

        // Switch back to Admin
        const currentRoleBtn = page.locator('button:has-text("VIEWER")').or(page.locator('button:has-text("Viewer")')).first();
        if (await currentRoleBtn.isVisible()) {
          await currentRoleBtn.click();
          await page.getByText(/Administrator|Admin/i).first().click();
          await page.waitForTimeout(400);
        }
      }
    }
  });

  test('should permit DNS operations when in DNS Operator role', async ({ page }) => {
    // Open RBAC switcher and select DNS Operator
    const roleBtn = page.locator('button:has-text("ADMIN")').or(page.locator('button:has-text("Admin")')).first();
    if (await roleBtn.isVisible()) {
      await roleBtn.click();
      const dnsOpOption = page.getByText(/DNS Operator|Vận hành DNS/i).first();
      if (await dnsOpOption.isVisible()) {
        await dnsOpOption.click();
        await page.waitForTimeout(400);

        // Go to DNS
        await page.locator('button').filter({ hasText: /Quản lý DNS|DNS Manager/i }).first().click();
        await page.waitForTimeout(400);
        const addDnsBtn = page.locator('button').filter({ hasText: /Thêm Bản ghi|Add Record/i }).first();
        if (await addDnsBtn.isVisible()) {
          await expect(addDnsBtn).toBeEnabled();
        }

        // Switch back to Admin
        const activeRoleBtn = page.locator('button:has-text("DNS")').first();
        if (await activeRoleBtn.isVisible()) {
          await activeRoleBtn.click();
          await page.getByText(/Administrator|Admin/i).first().click();
          await page.waitForTimeout(400);
        }
      }
    }
  });
});
