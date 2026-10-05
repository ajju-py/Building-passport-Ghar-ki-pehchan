import { test, expect } from '@playwright/test';

test.describe('Public Building Passport & Privacy Redaction QA', () => {
  test('Unauthenticated public visitor views verified building passport with public fields', async ({ page }) => {
    // Open public passport directly without authentication
    const response = await page.goto('/public/building/BP-2026-04821');
    expect(response?.status()).toBe(200);

    // Verify official emblem
    const logo = page.locator('header a[aria-label="Building Passport Home"]');
    await expect(logo).toBeVisible();

    // Verify building name and passport ID
    await expect(page.locator('h1')).toContainText('Apex Tower Commercial Hub');
    await expect(page.locator('text=BP-2026-04821').first()).toBeVisible();

    // Verify structural civil parameters are visible
    await expect(page.locator('text=/Verified Structural Specifications/i')).toBeVisible();
    await expect(page.locator('text=/Special Moment Resisting Frame/i')).toBeVisible();

    // Verify Cadastral & Title Verification details are visible
    await expect(page.locator('text=/Cadastral & Title Verification Record/i')).toBeVisible();
    await expect(page.locator('text=/Plot No\\. 42-A/i')).toBeVisible();

    // Verify Protected Stakeholder Information notice is displayed
    await expect(page.locator('text=/Protected Stakeholder Information/i')).toBeVisible();
    await expect(
      page.locator('text=/Direct owner contact details and internal engineering calculations are restricted/i')
    ).toBeVisible();
  });

  test('Public endpoint strictly redacts confidential owner email, phone, and private records', async ({ page }) => {
    await page.goto('/public/building/BP-2026-04821');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();

    // Confidential Owner Email MUST NOT be present
    expect(pageContent).not.toContain('facilities@apexrealty.in');
    expect(pageContent).not.toContain('owner@buildingpassport.org');

    // Confidential Owner Phone MUST NOT be present
    expect(pageContent).not.toContain('98110 54321');
    expect(pageContent).not.toContain('+91 98110');

    // Aadhaar / KYC information MUST NOT be present
    expect(pageContent).not.toContain('Aadhaar e-KYC');
    expect(pageContent).not.toContain('OTP');

    // Internal audit trail MUST NOT be present
    expect(pageContent).not.toContain('AuditTrailSection');
    expect(pageContent).not.toContain('Chronological Audit Ledger');
  });

  test('Invalid passport ID renders graceful unverified error state', async ({ page }) => {
    await page.goto('/public/building/INVALID-PASSPORT-999');

    // Verify graceful unverified passport UI
    await expect(page.locator('h1:has-text("Unverified Passport ID")')).toBeVisible();
    await expect(
      page.locator('text=/could not be verified in the active registry/i')
    ).toBeVisible();

    // Verify Return to Homepage button
    const returnLink = page.locator('a:has-text("Return to Homepage")');
    await expect(returnLink).toBeVisible();
    await returnLink.click();
    await expect(page).toHaveURL('/');
  });
});
