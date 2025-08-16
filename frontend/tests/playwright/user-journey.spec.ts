import { test, expect } from '@playwright/test';

test.describe('User Journey Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('complete user registration and onboarding flow', async ({ page }) => {
    // Step 1: Visit homepage
    await page.goto('/');
    
    // Verify homepage loads correctly
    await expect(page.getByRole('heading', { name: 'Track Your Creator Success' })).toBeVisible();
    await expect(page.getByText('Revenue Tracking')).toBeVisible();
    await expect(page.getByText('Growth Analytics')).toBeVisible();
    
    // Step 2: Click "Get Started" to go to registration
    await page.getByRole('link', { name: 'Get Started' }).click();
    await expect(page).toHaveURL('/register');
    
    // Step 3: Fill out registration form
    const testEmail = `test-${Date.now()}@example.com`;
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill('testpassword123');
    await page.getByLabel('Confirm Password').fill('testpassword123');
    
    // Step 4: Submit registration
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    // Step 5: Should redirect to dashboard after successful registration
    await expect(page).toHaveURL('/dashboard');
    
    // Step 6: Verify dashboard loads with welcome message
    await expect(page.getByText('Welcome to your Creator Dashboard')).toBeVisible();
    
    // Step 7: Add a platform (YouTube)
    await page.getByRole('button', { name: 'Add Platform' }).click();
    await page.getByText('YouTube').click();
    await page.getByLabel('Channel ID or Username').fill('UC_x5XG1OV2P6uZZ5FSM9Ttw');
    await page.getByRole('button', { name: 'Connect' }).click();
    
    // Step 8: Verify platform was added
    await expect(page.getByText('YouTube')).toBeVisible();
    
    // Step 9: Add another platform (Twitch)
    await page.getByRole('button', { name: 'Add Platform' }).click();
    await page.getByText('Twitch').click();
    await page.getByLabel('Channel ID or Username').fill('shroud');
    await page.getByRole('button', { name: 'Connect' }).click();
    
    // Step 10: Verify both platforms are visible
    await expect(page.getByText('YouTube')).toBeVisible();
    await expect(page.getByText('Twitch')).toBeVisible();
    
    // Step 11: Check analytics section
    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page.getByText('Total Followers')).toBeVisible();
    await expect(page.getByText('Total Views')).toBeVisible();
  });

  test('user login and authentication flow', async ({ page }) => {
    // Step 1: Visit homepage
    await page.goto('/');
    
    // Step 2: Click "Sign In"
    await page.getByRole('link', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/login');
    
    // Step 3: Fill login form
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('testpassword123');
    
    // Step 4: Submit login
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Step 5: Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Step 6: Verify user is authenticated
    await expect(page.getByText('Welcome to your Creator Dashboard')).toBeVisible();
    
    // Step 7: Test logout
    await page.getByRole('button', { name: 'Logout' }).click();
    
    // Step 8: Should redirect to homepage
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
  });

  test('platform management and data visualization', async ({ page }) => {
    // Step 1: Login and go to dashboard
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('testpassword123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
    
    // Step 2: Add multiple platforms
    const platforms = [
      { name: 'YouTube', identifier: 'UC_x5XG1OV2P6uZZ5FSM9Ttw' },
      { name: 'Twitch', identifier: 'shroud' },
      { name: 'TikTok', identifier: 'charlidamelio' }
    ];
    
    for (const platform of platforms) {
      await page.getByRole('button', { name: 'Add Platform' }).click();
      await page.getByText(platform.name).click();
      await page.getByLabel('Channel ID or Username').fill(platform.identifier);
      await page.getByRole('button', { name: 'Connect' }).click();
      
      // Wait for platform to be added
      await expect(page.getByText(platform.name)).toBeVisible();
    }
    
    // Step 3: Verify all platforms are displayed
    for (const platform of platforms) {
      await expect(page.getByText(platform.name)).toBeVisible();
    }
    
    // Step 4: Check analytics charts are rendered
    await expect(page.locator('canvas')).toBeVisible();
    
    // Step 5: Test platform removal
    await page.getByText('Twitch').first().hover();
    await page.getByRole('button', { name: 'Remove' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    
    // Step 6: Verify platform was removed
    await expect(page.getByText('Twitch')).not.toBeVisible();
  });

  test('real-time updates and notifications', async ({ page }) => {
    // Step 1: Login and setup platforms
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('testpassword123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Step 2: Add a platform
    await page.getByRole('button', { name: 'Add Platform' }).click();
    await page.getByText('YouTube').click();
    await page.getByLabel('Channel ID or Username').fill('UC_x5XG1OV2P6uZZ5FSM9Ttw');
    await page.getByRole('button', { name: 'Connect' }).click();
    
    // Step 3: Wait for initial data load
    await expect(page.getByText('YouTube')).toBeVisible();
    
    // Step 4: Simulate real-time update (this would normally come from SSE)
    // For testing, we'll trigger a manual refresh
    await page.getByRole('button', { name: 'Refresh Data' }).click();
    
    // Step 5: Verify data updates
    await expect(page.getByText('Data refreshed successfully')).toBeVisible();
  });

  test('responsive design and mobile experience', async ({ page }) => {
    // Step 1: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Step 2: Visit homepage
    await page.goto('/');
    
    // Step 3: Verify mobile navigation works
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible();
    
    // Step 4: Test mobile menu (if exists)
    const menuButton = page.getByRole('button', { name: /menu/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(page.getByRole('navigation')).toBeVisible();
    }
    
    // Step 5: Test mobile dashboard
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('testpassword123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Step 6: Verify dashboard is responsive
    await expect(page.getByText('Welcome to your Creator Dashboard')).toBeVisible();
    
    // Step 7: Test platform cards on mobile
    await page.getByRole('button', { name: 'Add Platform' }).click();
    await page.getByText('YouTube').click();
    await page.getByLabel('Channel ID or Username').fill('UC_x5XG1OV2P6uZZ5FSM9Ttw');
    await page.getByRole('button', { name: 'Connect' }).click();
    
    await expect(page.getByText('YouTube')).toBeVisible();
  });

  test('error handling and edge cases', async ({ page }) => {
    // Step 1: Test invalid login
    await page.goto('/login');
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Step 2: Verify error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    
    // Step 3: Test invalid platform connection
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('testpassword123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await page.getByRole('button', { name: 'Add Platform' }).click();
    await page.getByText('YouTube').click();
    await page.getByLabel('Channel ID or Username').fill('invalid-channel-id');
    await page.getByRole('button', { name: 'Connect' }).click();
    
    // Step 4: Verify error handling
    await expect(page.getByText(/could not connect/i)).toBeVisible();
    
    // Step 5: Test network error handling
    // Simulate offline mode
    await page.route('**/api/**', route => route.abort());
    
    await page.reload();
    await expect(page.getByText(/network error/i)).toBeVisible();
  });

  test('accessibility and keyboard navigation', async ({ page }) => {
    // Step 1: Visit homepage
    await page.goto('/');
    
    // Step 2: Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeFocused();
    
    // Step 3: Test form accessibility
    await page.getByRole('link', { name: 'Get Started' }).click();
    
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('testpassword123');
    await page.getByLabel('Confirm Password').fill('testpassword123');
    
    // Step 4: Submit with keyboard
    await page.keyboard.press('Enter');
    
    // Step 5: Verify form submission worked
    await expect(page).toHaveURL('/dashboard');
    
    // Step 6: Test ARIA labels and roles
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});

