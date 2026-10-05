import { test, expect } from '@playwright/test';

test.describe('Landing Page & Branding QA', () => {
  test('Landing page loads with logo, branding, and clean console', async ({ page, isMobile }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('requestfailed', (req) => {
      failedRequests.push(`${req.method()} ${req.url()}: ${req.failure()?.errorText}`);
    });

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    // Verify Title & Hero
    await expect(page).toHaveTitle(/Building Passport|Ghar Ki Pehchan/i);
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Verify Official Building Passport Logo in Header
    const brandLink = page.locator('header a[aria-label="Building Passport Home"]');
    await expect(brandLink).toBeVisible();
    await expect(brandLink.locator('img, svg').first()).toBeVisible();

    // Verify Hero Section
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();

    if (!isMobile) {
      // Desktop Navigation Check
      const desktopNav = page.locator('nav[aria-label="Desktop Navigation"]');
      await expect(desktopNav).toBeVisible();
      await expect(desktopNav.getByRole('link', { name: 'Home' })).toBeVisible();
      await expect(desktopNav.getByRole('link', { name: 'Registry' })).toBeVisible();
      await expect(desktopNav.getByRole('link', { name: 'Features' })).toBeVisible();

      // Desktop Sign In Link
      const signInLink = page.locator('header').getByRole('link', { name: /sign in/i }).first();
      await expect(signInLink).toBeVisible();
    } else {
      // Mobile Hamburger Button Check
      const menuButton = page.locator('button[aria-label="Toggle navigation menu"]');
      await expect(menuButton).toBeVisible();
      await menuButton.click();

      // Drawer opens
      const mobileMenu = page.locator('#mobile-menu');
      await expect(mobileMenu).toBeVisible();
      await expect(mobileMenu.getByRole('link', { name: /sign in/i })).toBeVisible();

      // Close menu
      await menuButton.click();
      await expect(mobileMenu).not.toBeVisible();
    }

    // Verify Footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(/Building Passport|Ghar Ki Pehchan/i);

    // Assert no severe console errors
    const fatalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('favicon') &&
        !err.includes('metadataBase') &&
        !err.includes('404')
    );
    expect(fatalErrors).toHaveLength(0);
  });

  test('Navigation links route to correct auth pages', async ({ page, isMobile }) => {
    await page.goto('/');

    if (!isMobile) {
      const signInLink = page.locator('header').getByRole('link', { name: /sign in/i }).first();
      await signInLink.click();
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    } else {
      const menuButton = page.locator('button[aria-label="Toggle navigation menu"]');
      await menuButton.click();
      const mobileSignIn = page.locator('#mobile-menu').getByRole('link', { name: /sign in/i });
      await mobileSignIn.click();
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('form')).toBeVisible();
    }
  });
});
