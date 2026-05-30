import { test, expect } from '@playwright/test'

// ─── Navigation & 404 ────────────────────────────────

test.describe('Navigation', () => {
  test('home page loads', async ({ page }) => {
    const resp = await page.goto('/')
    expect(resp?.status()).toBe(200)
    await expect(page.locator('h1')).toContainText('Polymarket Fantasy')
  })

  test('event page loads without 404', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const card = page.locator('a[href^="/events/"]').first()
    await expect(card).toBeVisible({ timeout: 15000 })
    await card.click()
    await expect(page).toHaveURL(/\/events\//)
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 })
  })

  test('settings page loads', async ({ page }) => {
    const resp = await page.goto('/settings')
    expect(resp?.status()).toBe(200)
    await expect(page.locator('h1')).toContainText('Profile')
  })

  test('leaderboard page loads', async ({ page }) => {
    const resp = await page.goto('/leaderboard')
    expect(resp?.status()).toBe(200)
    await expect(page.locator('h1')).toContainText('Leaderboard')
    // Should show data or empty state, not error
    const body = page.locator('body')
    await expect(body).not.toContainText('not found')
  })

  test('no links to removed /auth page', async ({ page }) => {
    await page.goto('/')
    expect(await page.locator('a[href="/auth"]').count()).toBe(0)
  })
})

// ─── Auth ──────────────────────────────────────────────

test.describe('Auth', () => {
  test('auto-creates nickname on first visit', async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('a[href="/settings"]')).toBeVisible({ timeout: 20000 })
    const name = await page.locator('a[href="/settings"]').textContent()
    expect(name).toBeTruthy()
    expect(name!.length).toBeGreaterThan(5)
  })

  test('can change nickname', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('polyfantasy_user', JSON.stringify({
        id: 'e2e-user-nick',
        username: 'e2e-test-player',
      }))
    })
    await page.goto('/settings')
    await expect(page.locator('input')).toBeVisible()
    const newName = 'e2e-' + Date.now()
    await page.locator('input[type="text"]').first().fill(newName)
    await page.locator('button:has-text("Save")').first().click()
    await expect(page).toHaveURL('/')
    await expect(page.locator('a[href="/settings"]')).toContainText(newName)
  })

  test('profile shows stats', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('polyfantasy_user', JSON.stringify({
        id: 'e2e-user-stats',
        username: 'e2e-stats-player',
      }))
    })
    await page.goto('/settings')
    // Should show balance, total bets, win rate
    await expect(page.locator('text=Balance')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Total Bets')).toBeVisible()
    await expect(page.locator('text=Win Rate')).toBeVisible()
  })
})

// ─── Dashboard ──────────────────────────────────────────

test.describe('Dashboard', () => {
  test('displays events', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href^="/events/"]').first()).toBeVisible({ timeout: 20000 })
  })

  test('search filters events', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href^="/events/"]').first()).toBeVisible({ timeout: 20000 })
    const search = page.locator('input[placeholder*="Search"]')
    await search.fill('will')
    await page.waitForTimeout(500)
    const cards = page.locator('a[href^="/events/"]')
    const count = await cards.count()
    if (count > 0) {
      expect((await cards.first().textContent())?.toLowerCase()).toContain('will')
    }
  })

  test('sort buttons are visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Sort:')).toBeVisible()
    for (const label of ['Volume', 'End Date', 'Price', 'Spread']) {
      await expect(page.locator(`button:has-text("${label}")`)).toBeVisible()
    }
  })

  test('pagination appears when many events', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    // If events > 25, pagination should show
    const prev = page.locator('button:has-text("Prev")')
    const next = page.locator('button:has-text("Next")')
    if (await page.locator('a[href^="/events/"]').count() > 25) {
      await expect(page.locator('button:has-text("1")')).toBeVisible()
    }
  })
})

// ─── Event Detail & Betting ─────────────────────────

test.describe('Betting', () => {
  test('event detail has YES/NO buttons', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href^="/events/"]').first()).toBeVisible({ timeout: 15000 })
    await page.locator('a[href^="/events/"]').first().click()
    await expect(page).toHaveURL(/\/events\//)
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 })
    // Check for YES/NO prices
    await expect(page.locator('text=YES').first()).toBeVisible()
    await expect(page.locator('text=NO').first()).toBeVisible()
  })
})

// ─── Leaderboard ──────────────────────────────────────

test.describe('Leaderboard', () => {
  test('leaderboard has table columns', async ({ page }) => {
    await page.goto('/leaderboard')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('text=Player')).toBeVisible()
    await expect(page.locator('text=Profit')).toBeVisible()
    await expect(page.locator('text=Balance')).toBeVisible()
    await expect(page.locator('text=Win Rate')).toBeVisible()
    await expect(page.locator('text=ROI')).toBeVisible()
  })
})
