import { test, expect } from '@playwright/test';

test.describe('Authentication & Identity Verification QA', () => {
  test('Registration page validation and error states', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveTitle(/Building Passport|Register/i);

    // Verify official emblem is visible
    const logo = page.locator('header a[aria-label="Building Passport Home"]');
    await expect(logo).toBeVisible();

    // Verify Form is visible
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Verify HTML5 minLength enforcement on password input
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toHaveAttribute('minLength', '8');

    // Test password mismatch
    await page.fill('input[type="text"]', 'Test Citizen');
    await page.fill('input[type="email"]', 'citizen.test@domain.org');
    await passwordInput.fill('Secret12345!');
    await page.locator('input[type="password"]').nth(1).fill('Mismatch999!');

    await page.click('button[type="submit"]');
    const errorNotice = page.locator('text=/Passwords do not match/i');
    await expect(errorNotice).toBeVisible();
  });

  test('Email verification handling for invalid and missing tokens', async ({ page }) => {
    // Missing token
    await page.goto('/verify-email');
    await expect(page.locator('h2:has-text("Missing Verification Token")')).toBeVisible();

    // Invalid / malformed token
    await page.goto('/verify-email?token=invalid_dummy_token_99999');
    await expect(
      page.locator('h2:has-text("Verification Failed"), h2:has-text("Invalid Verification Link")')
    ).toBeVisible({ timeout: 15000 });

    // Verify resend input is available on error
    const resendInput = page.locator('input[type="email"]');
    await expect(resendInput).toBeVisible();
  });

  test('Login failure with incorrect password', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Building Passport|Sign In|Login/i);

    await page.fill('input[type="email"]', 'unregistered.user@testdomain.org');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Look for error notification banner in form
    const errorAlert = page.locator('.bg-rose-50');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText(/Invalid email or password/i);
  });

  test('Successful Admin login, session persistence, and logout', async ({ page, isMobile }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'admin@buildingpassport.org');
    await page.fill('input[type="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');

    // Should redirect to /dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify dashboard content loads
    const heading = page.locator('h1');
    await expect(heading).toContainText(/Building Information Management Dashboard/i);

    // Verify user identity in navigation
    if (!isMobile) {
      const userBadge = page.locator('header .hidden.sm\\:flex');
      await expect(userBadge).toContainText('Alok Verma');
      await expect(userBadge).toContainText(/admin/i);

      // Test session persistence across page reload
      await page.reload();
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('header .hidden.sm\\:flex')).toContainText('Alok Verma');

      // Logout on desktop
      const logoutBtn = page.locator('header button[title="Sign Out"]').first();
      await logoutBtn.click();
      await expect(page.locator('header').getByRole('link', { name: /sign in/i }).first()).toBeVisible();
    } else {
      const menuBtn = page.locator('button[aria-label="Toggle navigation menu"]');
      await menuBtn.click();
      const mobileDrawer = page.locator('#mobile-menu');
      await expect(mobileDrawer).toContainText('Alok Verma');
      await expect(mobileDrawer).toContainText(/admin/i);

      // Test session persistence across page reload
      await page.reload();
      await expect(page).toHaveURL(/\/dashboard/);
      await page.locator('button[aria-label="Toggle navigation menu"]').click();
      await expect(page.locator('#mobile-menu')).toContainText('Alok Verma');

      // Logout on mobile
      const logoutBtn = page.locator('#mobile-menu button:has-text("Sign Out")').first();
      await logoutBtn.click();
      await expect(page.locator('header button[aria-label="Toggle navigation menu"]')).toBeVisible();
    }
  });
});
