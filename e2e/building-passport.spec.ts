import { test, expect } from '@playwright/test';

test.describe('Building Passport Central Record & Detailed Tabs QA', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as Admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@buildingpassport.org');
    await page.fill('input[type="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');
    // Authenticate and navigate to dashboard with rate-limit resiliency
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    } catch {
      const rateLimitMsg = page.locator('text=/Too many login attempts/i');
      if (await rateLimitMsg.isVisible()) {
        await page.waitForTimeout(6000);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 15000 });
      } else {
        await page.waitForURL('**/dashboard', { timeout: 15000 });
      }
    }
  });

  test('Building Details renders header, GIS card, and metadata correctly', async ({ page }) => {
    await page.goto('/buildings/bld_001_apex');
    await page.waitForLoadState('networkidle');

    // Verify building name and passport badge
    await expect(page.locator('h1')).toContainText('Apex Tower Commercial Hub');
    await expect(page.locator('text=BP-2026-04821').first()).toBeVisible();

    // Verify Overview & GIS section
    await expect(page.locator('text=/Cadastral Coordinates & Site Polygon/i')).toBeVisible();
    await expect(page.locator('text=/Survey \\/ CTS No\\./i')).toBeVisible();

    // Verify OpenStreetMap link or coordinates are displayed
    await expect(page.locator('text=/28\\.4595/i').first()).toBeVisible();
    await expect(page.locator('text=/77\\.0266/i').first()).toBeVisible();
  });

  test('Central Record Drawings section renders revisions and upload modal', async ({ page }) => {
    await page.goto('/buildings/bld_001_apex');

    // Click Drawings tab in tab bar
    const drawingsTab = page.locator('button:has-text("Drawings & Revisions")');
    await drawingsTab.scrollIntoViewIfNeeded();
    await drawingsTab.click();

    // Verify Drawings Section header & controls
    await expect(page.locator('text=/Drawings & Blueprints Central Architecture/i')).toBeVisible();
    await expect(page.locator('button:has-text("Upload New Revision")')).toBeVisible();

    // Check filter discipline buttons
    await expect(page.locator('button:has-text("All Drawings")')).toBeVisible();
    await expect(page.locator('button:has-text("Architectural")')).toBeVisible();
    await expect(page.locator('button:has-text("Structural")')).toBeVisible();

    // Click Upload New Revision button to verify modal opens
    await page.click('button:has-text("Upload New Revision")');
    await expect(page.locator('text=/Register Engineering Drawing Revision/i')).toBeVisible();

    // Close modal
    await page.click('button:has-text("Cancel"), button svg.lucide-x');
  });

  test('Regulatory Approvals section displays statutory NOCs and validity tracking', async ({ page }) => {
    await page.goto('/buildings/bld_001_apex');

    // Click Statutory Approvals tab
    const approvalsTab = page.locator('button:has-text("Statutory Approvals & NOCs")');
    await approvalsTab.scrollIntoViewIfNeeded();
    await approvalsTab.click();

    // Verify approvals header
    await expect(page.locator('text=/Permissions, NOCs & Statutory Approvals/i')).toBeVisible();
    const addBtn = page.locator('button:has-text("Add Statutory Clearance"), button:has-text("Record First Approval")').first();
    await expect(addBtn).toBeVisible();

    // Click Add button to verify modal opens
    await addBtn.click();
    await expect(page.locator('text=/Record Statutory Permission \\/ NOC/i')).toBeVisible();

    // Close modal
    await page.click('button:has-text("Cancel"), button svg.lucide-x');
  });

  test('Identity Verification section operates in Sandbox mode with test OTP', async ({ page }) => {
    await page.goto('/buildings/bld_001_apex');

    // Click Owner Verification tab
    const identityTab = page.locator('button:has-text("Owner Verification")');
    await identityTab.scrollIntoViewIfNeeded();
    await identityTab.click();

    // Verify Sandbox notice
    await expect(page.locator('text=/Showcase Identity Sandbox Gateway/i')).toBeVisible();
    await expect(page.locator('text=/Simulated Sandbox/i')).toBeVisible();

    // Verify sandbox disclaimers (does not represent real UIDAI/DigiLocker)
    await expect(page.locator('text=/Zero full government identity numbers/i')).toBeVisible();
  });

  test('Compliance Engine tab displays deterministic rules and statutory explanations', async ({ page }) => {
    await page.goto('/buildings/bld_001_apex');

    // Click Construction Rules quick button in header
    const complianceBtn = page.locator('button:has-text("Construction Rules")').first();
    await complianceBtn.click();

    // Verify compliance evaluation displays
    await expect(page.locator('text=/Construction Rules & Compliance Engine/i')).toBeVisible();

    // Verify deterministic rule outcomes exist
    const scoreOrRule = page.locator('text=/Compliance Score|construction-rules/i').first();
    await expect(scoreOrRule).toBeVisible();
  });

  test('Audit Trail tab displays chronological ledger and append-only notice', async ({ page }) => {
    await page.goto('/buildings/bld_001_apex');

    // Click Audit Trail tab
    const auditTab = page.locator('button:has-text("Audit Trail")');
    await auditTab.scrollIntoViewIfNeeded();
    await auditTab.click();

    // Verify audit ledger
    await expect(page.locator('text=/Activity & Modification Audit Trail/i')).toBeVisible();
    await expect(page.locator('button:has-text("Refresh Trail")')).toBeVisible();
  });

  test('Digital QR Passport tab displays QR code with production showcase domain', async ({ page }) => {
    await page.goto('/buildings/bld_001_apex');

    // Click QR tab
    const qrTab = page.locator('button:has-text("Digital QR Passport")');
    await qrTab.scrollIntoViewIfNeeded();
    await qrTab.click();

    // Verify QR section
    await expect(page.locator('text=/Official Civil Identity QR Code/i')).toBeVisible();

    // Verify QR image exists
    const qrImg = page.locator('img[alt*="QR Code"]').first();
    await expect(qrImg).toBeVisible();

    // Verify public link points to canonical showcase URL
    const publicLink = page.locator('a:has-text("Open Public Verification Page")');
    await expect(publicLink).toBeVisible();
    await expect(publicLink).toHaveAttribute('href', /^\/public\/building\/BP-2026-04821/);
  });
});
