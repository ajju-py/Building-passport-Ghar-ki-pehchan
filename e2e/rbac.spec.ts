import { test, expect } from '@playwright/test';

test.describe('Role-Based Access Control (RBAC) & Endpoint Authorization QA', () => {
  test('Admin user has elevated administrative privileges on dashboard', async ({ page, isMobile }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@buildingpassport.org');
    await page.fill('input[type="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify Admin role is recognized
    if (isMobile) {
      await page.click('button[aria-label="Toggle navigation menu"]');
      await expect(page.locator('#mobile-menu')).toContainText(/ADMIN/i);
      await page.click('button[aria-label="Toggle navigation menu"]');
    } else {
      await expect(page.locator('header').getByText(/ADMIN/i).first()).toBeVisible();
    }

    // Verify Admin sees Register Building action
    await expect(page.locator('a:has-text("Register Building")').first()).toBeVisible();
  });

  test('Engineer user can authenticate and access engineering dashboard', async ({ page, isMobile }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'engineer@buildingpassport.org');
    await page.fill('input[type="password"]', 'EngineerPass123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify Engineer role is recognized
    if (isMobile) {
      await page.click('button[aria-label="Toggle navigation menu"]');
      await expect(page.locator('#mobile-menu')).toContainText(/ENGINEER/i);
      await expect(page.locator('#mobile-menu')).toContainText(/Rajesh Sharma/i);
      await page.click('button[aria-label="Toggle navigation menu"]');
    } else {
      await expect(page.locator('header').getByText(/ENGINEER/i).first()).toBeVisible();
      await expect(page.locator('header').getByText(/Rajesh Sharma/i).first()).toBeVisible();
    }
  });

  test('Owner user can authenticate and access owner property portal', async ({ page, isMobile }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'owner@buildingpassport.org');
    await page.fill('input[type="password"]', 'OwnerPass123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify Owner role is recognized
    if (isMobile) {
      await page.click('button[aria-label="Toggle navigation menu"]');
      await expect(page.locator('#mobile-menu')).toContainText(/OWNER/i);
      await page.click('button[aria-label="Toggle navigation menu"]');
    } else {
      await expect(page.locator('header').getByText(/OWNER/i).first()).toBeVisible();
    }
  });

  test('Server-side RBAC blocks unauthenticated requests to protected API routes', async ({ request }) => {
    // Attempt drawing approval status update without Authorization header
    const drawingResponse = await request.patch('/api/drawings/drw_apex_001/status', {
      data: { status: 'APPROVED' },
    });
    expect([401, 403]).toContain(drawingResponse.status());
    const drawingBody = await drawingResponse.json();
    expect(drawingBody.success).toBe(false);

    // Attempt regulatory approval creation without Authorization header
    const approvalResponse = await request.post('/api/buildings/bld_001_apex/approvals', {
      data: {
        approvalType: 'fire_noc',
        issuingAuthority: 'Fire Service',
        approvalNumber: 'NOC-TEST',
        issueDate: '2024-01-01',
      },
    });
    expect([401, 403]).toContain(approvalResponse.status());
    const approvalBody = await approvalResponse.json();
    expect(approvalBody.success).toBe(false);

    // Attempt building registration without Authorization header
    const buildingCreateResponse = await request.post('/api/buildings', {
      data: {
        name: 'Unauthorized Test Building',
        type: 'Commercial High-Rise',
        constructionDate: '2025-01-01',
      },
    });
    expect([401, 403]).toContain(buildingCreateResponse.status());
    const buildingCreateBody = await buildingCreateResponse.json();
    expect(buildingCreateBody.success).toBe(false);
  });

  test('Unauthenticated visitor navigating to /buildings/new redirects to login with return URL', async ({ page }) => {
    // Navigate directly while logged out
    await page.goto('/buildings/new');

    // Should redirect to login preserving redirect parameter
    await page.waitForURL(/\/login(\?redirect=.*)?/, { timeout: 15000 });
    expect(page.url()).toContain('/login');
    expect(page.url()).toContain('redirect=');

    // The registration form must NOT be interactable or displayed
    await expect(page.locator('h1:has-text("Register New Building Passport")')).not.toBeVisible();

    // Authenticate using 1-click quick demo login on the login page
    await page.click('button:has-text("Engineer")');

    // Should return automatically to /buildings/new
    await page.waitForURL('**/buildings/new', { timeout: 15000 });
    expect(page.url()).toContain('/buildings/new');

    // Registration form is now accessible
    await expect(page.locator('h1:has-text("Register New Building Passport")')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('select[name="usage"]')).toBeVisible();
    await expect(page.locator('select[name="usage"]')).toHaveAttribute('required', '');
    await expect(page.locator('select[name="usage"]')).toHaveValue('');

    // Verify Load Sample Demo Details populates usage classification
    await page.click('button:has-text("Load Sample Demo Details")');
    await expect(page.locator('select[name="usage"]')).toHaveValue('Commercial');

    // Intercept outgoing POST /api/buildings request to verify payload contract
    let capturedPayload: Record<string, unknown> | null = null;
    await page.route('**/api/buildings', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        capturedPayload = JSON.parse(request.postData() || '{}');
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 'bld_mock_test_usage', name: capturedPayload?.name },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Submit form and verify payload contains usage: "Commercial"
    await page.click('button[type="submit"]');
    expect(capturedPayload).not.toBeNull();
    const submittedUsage = capturedPayload ? (capturedPayload as { usage?: string }).usage : undefined;
    expect(submittedUsage).toBe('Commercial');
  });

  test('Authenticated user with unauthorized role receives clean 403 state on /buildings/new', async ({ page }) => {
    // Intercept /api/auth/me to validate the public role session
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            userId: 'usr_mock_public',
            name: 'Citizen Public Verifier',
            email: 'public@citizen.in',
            role: 'public',
            accountStatus: 'active',
          },
        }),
      });
    });

    // Seed session in localStorage
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('bp_auth_token', 'test-public-token-mock');
      localStorage.setItem(
        'bp_auth_user',
        JSON.stringify({
          userId: 'usr_mock_public',
          name: 'Citizen Public Verifier',
          email: 'public@citizen.in',
          role: 'public',
          accountStatus: 'active',
        })
      );
    });

    await page.goto('/buildings/new');

    // Form must not be displayed; 403 restriction should be shown
    await expect(page.locator('h1:has-text("Register New Building Passport")')).not.toBeVisible();
    await expect(page.locator('text=/403 Forbidden/i')).toBeVisible();
    await expect(page.locator('h1:has-text("Building Registration Restricted")')).toBeVisible();
  });
});
