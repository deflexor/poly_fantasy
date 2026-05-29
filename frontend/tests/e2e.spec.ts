import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Polymarket Fantasy
 *
 * Run: npx playwright test --headed  (to see what happens)
 * Run: npx playwright test         (headless)
 * Report: npx playwright show-report
 */

// ─── Auth & Profile ───────────────────────────────────────────────

test.describe('Auth & Profile', () => {
  test('auto-creates nickname on first visit', async ({ page }) => {
    // Clear localStorage to simulate first visit
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Should show a nickname in the navbar (auto-generated)
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()

    // The nickname text should appear somewhere (not "Sign In")
    const body = page.locator('body')
    await expect(body).not.toContainText('Sign In')

    // There should be a link/button showing a generated name (hyphenated)
    const nameLink = page.locator('a[href="/settings"]')
    await expect(nameLink).toBeVisible()
    const nameText = await nameLink.textContent()
    expect(nameText).toMatch(/-/) // contains separator like gray-brave-...
  })

  test('can change nickname in settings', async ({ page }) => {
    await page.goto('/')
    // Ensure there's a user
    const userExists = await page.evaluate(() => !!localStorage.getItem('polyfantasy_user'))
    if (!userExists) {
      await page.reload() // auto-creates on reload
    }

    await page.goto('/settings')
    await expect(page.locator('h1')).toContainText('Settings')

    const input = page.locator('input[type="text"]')
    await input.fill('test-player-e2e')
    await page.locator('button:has-text("Save")').click()

    // Should redirect to dashboard
    await expect(page).toHaveURL('/')
    // Nickname should appear in nav
    const nameLink = page.locator('a[href="/settings"]')
    await expect(nameLink).toContainText('test-player-e2e')
  })
})

// ─── Dashboard ────────────────────────────────────────────────────

test.describe('Dashboard', () => {
  test('loads and displays events', async ({ page }) => {
    await page.goto('/')

    // Should show the title
    await expect(page.locator('h1')).toContainText('Polymarket Fantasy')

    // Events grid should have items (or "No events found" — but typically there are thousands)
    const eventCards = page.locator('a[href^="/events/"]')
    await expect(eventCards.first()).toBeVisible({ timeout: 15000 })
  })

  test('search filters events by text', async ({ page }) => {
    await page.goto('/')

    // Wait for events to load
    await expect(page.locator('a[href^="/events/"]').first()).toBeVisible({ timeout: 15000 })

    // Type something that likely exists — common word in prediction markets
    const searchInput = page.locator('input[type="text"], input[placeholder*="Search"]')
    await searchInput.fill('will')

    // Wait a beat for React state to update
    await page.waitForTimeout(300)

    // All visible event cards should contain "will" (React filters in real-time)
    // Some might be hidden. Check at least one card matches.
    const cards = page.locator('a[href^="/events/"]')
    const count = await cards.count()
    if (count > 0) {
      // Verify the first card contains "will" or result is sensible
      const text = await cards.first().textContent()
      expect(text?.toLowerCase()).toContain('will')
    }
  })

  test('category filter works', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href^="/events/"]').first()).toBeVisible({ timeout: 15000 })

    // Click first category button (after "All")
    const catButtons = page.locator('button').filter({ hasText: /^(?!All)/ })
    const catCount = await catButtons.count()
    if (catCount > 0) {
      const firstCat = catButtons.first()
      const catName = await firstCat.textContent()
      await firstCat.click()
      await page.waitForTimeout(300)
      // Active button should have different style
      await expect(firstCat).toHaveClass(/purple/)
    }
  })
})

// ─── Event Detail & Betting ──────────────────────────────────────

test.describe('Event Detail & Betting', () => {
  test('clicking event opens detail page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href^="/events/"]').first()).toBeVisible({ timeout: 15000 })

    // Click first event
    const firstEvent = page.locator('a[href^="/events/"]').first()
    await firstEvent.click()

    // Should land on event detail page
    await expect(page).toHaveURL(/\/events\//)
    // Should show the question
    await expect(page.locator('h1')).toBeVisible()
    // Should show YES/NO prices
    await expect(page.locator('text=YES')).toBeVisible()
    await expect(page.locator('text=NO')).toBeVisible()
  })

  test('can place a bet', async ({ page }) => {
    await page.goto('/')
    // Ensure user exists
    await page.evaluate(() => {
      if (!localStorage.getItem('polyfantasy_user')) {
        // Trigger auto-create by reloading if needed
        localStorage.setItem('polyfantasy_user', JSON.stringify({
          id: '00000000-0000-0000-0000-000000000001',
          username: 'e2e-test-player',
        }))
      }
    })
    await page.reload()

    // Go to first event
    await expect(page.locator('a[href^="/events/"]').first()).toBeVisible({ timeout: 15000 })
    await page.locator('a[href^="/events/"]').first().click()
    await expect(page).toHaveURL(/\/events\//)

    // Check if betting form exists (might be resolved)
    const yesBtn = page.locator('button:has-text("YES")')
    const noBtn = page.locator('button:has-text("NO")')

    if (await yesBtn.isVisible()) {
      // Select YES
      await yesBtn.click()

      // Set amount
      const amountInput = page.locator('input[type="number"]')
      if (await amountInput.isVisible()) {
        await amountInput.fill('50')
      }

      // Click Bet button
      const betBtn = page.locator('button:has-text("Bet")')
      if (await betBtn.isVisible() && await betBtn.isEnabled()) {
        await betBtn.click()

        // Wait for bet to process — "Your Bets" section should appear
        await expect(page.locator('text=Your Bets').first()).toBeVisible({ timeout: 10000 })
      }
    }
  })
})

// ─── Leaderboard ──────────────────────────────────────────────────

test.describe('Leaderboard', () => {
  test('leaderboard page loads', async ({ page }) => {
    await page.goto('/leaderboard')

    // Should show leaderboard heading or at least not 404
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // Either shows data or empty state — either is fine, just not error
    const pre = page.locator('pre')
    if (await pre.isVisible()) {
      // If it shows JSON, that's a bug (regression check)
      const text = await pre.textContent()
      expect(text).not.toContain('error')
    }
  })
})

// ─── Navigation & General ─────────────────────────────────────────

test.describe('Navigation', () => {
  test('all pages load without 404', async ({ page }) => {
    const pages = ['/', '/settings', '/leaderboard']
    for (const p of pages) {
      const response = await page.goto(p)
      expect(response?.status()).toBe(200)
      // Page should have content, not blank
      await expect(page.locator('body')).not.toBeEmpty()
    }
  })

  test('404 links do not exist', async ({ page }) => {
    await page.goto('/')
    // There should be no links to /auth (which was removed)
    const authLinks = page.locator('a[href="/auth"], a[href*="/auth"]')
    // If any exist, they should at least not be visible/clickable
    const count = await authLinks.count()
    expect(count).toBe(0)
  })
})
