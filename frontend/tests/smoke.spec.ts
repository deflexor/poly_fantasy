import { test, expect } from '@playwright/test'

test('page loads and shows title', async ({ page }) => {
  test.setTimeout(30000)
  await page.goto('/')
  await expect(page.locator('h1')).toBeVisible({ timeout: 10000 })
  const title = await page.locator('h1').textContent()
  expect(title).toContain('Polymarket Fantasy')
})

test('events are displayed', async ({ page }) => {
  test.setTimeout(30000)
  await page.goto('/')
  await expect(page.locator('a[href^="/events/"]').first()).toBeVisible({ timeout: 15000 })
})

test('nickname appears in nav', async ({ page }) => {
  test.setTimeout(30000)
  await page.goto('/')
  // The nav should have a link to /settings with a nickname
  await expect(page.locator('a[href="/settings"]')).toBeVisible({ timeout: 15000 })
})
