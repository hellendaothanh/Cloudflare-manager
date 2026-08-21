import { test, expect } from '@playwright/test';
import { setupDemoSession } from './test-helpers';

test.describe('Security Audit, Audit Trail & Rollback Suite', () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoSession(page);
    // Navigate to Audit view
    await page.getByRole('button', { name: /Đánh giá DevSecOps|DevSecOps Audit/i }).click();
    await page.waitForTimeout(400);
  });

  test('should display CIS Benchmark Scorecard and Security Checks', async ({ page }) => {
    // Check Scorecard is visible
    await expect(page.locator('h1, h2').filter({ hasText: /Đánh giá Bảo mật|Audit|Rollback/i }).first()).toBeVisible();
    await expect(page.getByText(/Điểm Đánh Giá Bảo Mật|Security Posture Score/i).first()).toBeVisible();

    // Check for check items
    const checkItems = page.locator('.p-4.rounded-2xl');
    await expect(checkItems.first()).toBeVisible();
  });

  test('should switch to System Audit Trail tab and filter logs', async ({ page }) => {
    // Click Audit Trail subtab
    const auditTrailTabBtn = page.getByRole('button', { name: /Nhật ký Thao tác|Audit Trail/i }).first();
    await expect(auditTrailTabBtn).toBeVisible();
    await auditTrailTabBtn.click();
    await page.waitForTimeout(400);

    // Verify logs table headers
    await expect(page.getByText(/Thời gian|Timestamp/i).first()).toBeVisible();
    await expect(page.getByText(/Người thực hiện|Operator/i).first()).toBeVisible();

    // Test Search input
    const searchInput = page.getByPlaceholder(/Tìm kiếm theo tên|Search by operator/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('example.com');
      await page.waitForTimeout(200);
      await searchInput.fill('');
    }

    // Verify Export buttons are present
    await expect(page.getByRole('button', { name: /Xuất CSV|Export CSV/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Xuất JSON|Export JSON/i }).first()).toBeVisible();
  });

  test('should switch to Snapshot & Rollback tab and view Pre-Restore Diff', async ({ page }) => {
    // Click Snapshot & Rollback subtab
    const rollbackTabBtn = page.getByRole('button', { name: /Sao lưu & 1-Click Rollback|Snapshots & Rollback/i }).first();
    await expect(rollbackTabBtn).toBeVisible();
    await rollbackTabBtn.click();
    await page.waitForTimeout(400);

    // Verify snapshot repository is rendered
    await expect(page.getByText(/Snapshots Lưu Trữ|Snapshot Repository|Trình Quản lý Snapshot/i).first()).toBeVisible();

    // Verify Pre-Restore Diff table is visible
    await expect(page.getByText(/Pre-Restore Diff Inspector|Đối soát So sánh/i).first()).toBeVisible();

    // Test Create Snapshot modal opening
    const createSnapBtn = page.getByRole('button', { name: /Tạo Snapshot Mới|Create Snapshot/i }).first();
    if (await createSnapBtn.isVisible()) {
      await createSnapBtn.click();
      await expect(page.getByText(/Tạo Bản Snapshot Mới|Create New Configuration Snapshot/i).first()).toBeVisible();

      // Close modal
      const cancelBtn = page.getByRole('button', { name: /Hủy|Cancel/i }).first();
      await cancelBtn.click();
    }
  });
});
