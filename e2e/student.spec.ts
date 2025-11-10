import { test, expect } from '@playwright/test';

// Basic student flow: login, view events, register for first free event, verify ticket
test('student can register for a free event and see ticket', async ({ page }) => {
  // Navigate to homepage
  await page.goto('/');

  // Assume a test user exists; go to login
  await page.click('text=Login');
  await page.fill('input[name="email"]', process.env.E2E_STUDENT_EMAIL || 'student@example.com');
  await page.fill('input[name="password"]', process.env.E2E_STUDENT_PASSWORD || 'password');
  await page.click('button[type="submit"]');

  // Wait for events list
  await page.waitForSelector('[data-testid="event-card"]');

  // Click the first event's register button if it's free
  const registerButton = page.locator('button', { hasText: 'Register Now' }).first();
  await registerButton.click();

  // If login was required, handle redirection
  // Fill registration form
  await page.fill('input[data-testid="input-phone"]', '9999999999');
  await page.fill('input[data-testid="input-branch"]', 'Computer Science');
  await page.fill('input[data-testid="input-year"]', '2nd Year');
  await page.check('input[data-testid="checkbox-terms"]');
  await page.click('button[data-testid="button-submit-registration"]');

  // Verify success dialog or that ticket appears in My Tickets
  await page.goto('/tickets');
  await page.waitForSelector('[data-testid="ticket-card"]', { timeout: 10000 });
  expect(await page.isVisible('[data-testid="ticket-card"]')).toBeTruthy();
});
