import { test, expect } from '@playwright/test';

// Basic admin flow: login, create event, publish, verify in public list
test('admin can create and publish an event', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Login');
  await page.fill('input[name="email"]', process.env.E2E_ADMIN_EMAIL || 'admin@example.com');
  await page.fill('input[name="password"]', process.env.E2E_ADMIN_PASSWORD || 'password');
  await page.click('button[type="submit"]');

  // Navigate to admin dashboard
  await page.click('text=Admin Dashboard');
  await page.click('text=Create New Event');

  await page.fill('input[name="title"]', 'E2E Test Event');
  await page.fill('textarea[name="description"]', 'This is a test event created by E2E tests');
  // Fill dates - simple ISO strings or pickers depending on implementation
  const now = new Date();
  const later = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await page.fill('input[name="registrationOpens"]', now.toISOString());
  await page.fill('input[name="registrationCloses"]', later.toISOString());
  await page.fill('input[name="eventStarts"]', later.toISOString());
  await page.fill('input[name="eventEnds"]', new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString());
  await page.fill('input[name="venue"]', 'Test Hall');
  await page.click('input[name="isPaid"]'); // toggle to paid if needed
  await page.fill('input[name="price"]', '0');
  await page.fill('input[name="capacity"]', '100');

  await page.click('button:has-text("Publish Event")');

  // Wait, then verify event appears on public listing
  await page.goto('/events');
  await page.waitForSelector('text=E2E Test Event', { timeout: 10000 });
  expect(await page.isVisible('text=E2E Test Event')).toBeTruthy();
});
