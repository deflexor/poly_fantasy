import { test, expect } from '@playwright/test'

// ─── Navigation ───────────────────────────────────────────

test.describe('Navigation & 404', () => {
  test('home page loads', async ({ page }) => {
    const resp = await page.goto('/')
    expect(resp?.status()).toBe(200)
    await expect(page.locator('h1')).toContainText('Polymarket Fantasy')
  })

  test('event page loads without 404', async ({ page }) => {
    // First load an event from the dashboard, then verify no 404
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    // Wait for events to load (up to 10s)
    await expect(page.locator('a[href^="/events/"]').first()).toBeVisible({ timeout: 15000 })
    // Click the first event card — with <Link> this is client-side nav
    await page.locator('a[href^="/events/"]').first().click()
    // Should show event detail
    await expect(page).toHaveURL(/\/events\//)
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 })
  })

  test('settings page loads', async ({ page }) => {
    const resp = await page.goto('/settings')
    expect(resp?.status()).toBe(200)
    await expect(page.locator('h1')).toContainText('Settings')
  })

  test('leaderboard page loads', async ({ page }) => {
    const resp = await page.goto('/leaderboard')
    expect(resp?.status()).toBe(200)
    // Either shows data or empty state — just not 404 or error
    await expect(page.locator('body')).not.toContainText('not found')
  })

  test('no links point to /auth', async ({ page }) => {
    await page.goto('/')
    const count = await page.locator('a[href="/auth"]').count()
    expect(count).toBe(0)
  })
})

// ─── Auth ──────────────────────────────────────────────────

test.describe('Auth', () => {
  test('auto-creates nickname on visit', async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    // Wait for auto-creation
    await expect(page.locator('a[href="/settings"]')).toBeVisible({ timeout: 20000 })
    const name = await page.locator('a[href="/settings"]').textContent()
    expect(name).toBeTruthy()
    expect(name).not.toBe('')
  })

  test('can change nickname', async ({ page }) => {
    // Ensure a user exists
    await page.evaluate(() => {
      localStorage.setItem('polyfantasy_user', JSON.stringify({
        id: 'e2e00000-0000-0000-0000-000000000001',
        username: 'e2e-test-player',
      }))
    })
    await page.goto('/settings')
    await expect(page.locator('input[type="text"]')).toBeVisible()

    const newName = 'e2e-' + Date.now()
    await page.locator('input[type="text"]').fill(newName)
    await page.locator('button:has-text("Save")').click()
    await expect(page).toHaveURL('/')
    // Nickname should appear
    await expect(page.locator('a[href="/settings"]')).toContainText(newName)
  })
})

// ─── Dashboard ─────────────────────────────────────────────

test.describe('Dashboard', () => {
  test('displays events', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href^="/events/"]').first()).toBeVisible({ timeout: 20000 })
  })

  test('search filters events', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href^="/events/"]').first()).toBeVisible({ timeout: 20000 })
    const search = page.locator('input[type="text"], input[placeholder*="Search"]')
    await search.fill('will')
    await page.waitForTimeout(500)
    const cards = page.locator('a[href^="/events/"]')
    const count = await cards.count()
    if (count > 0) {
      const text = await cards.first().textContent()
      expect(text?.toLowerCase()).toContain('will')
    }
  })
})
