import { test } from '@playwright/test'

test('debug page state', async ({ page }) => {
  test.setTimeout(60000)
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const text = await page.locator('body').textContent()
  console.log('=== PAGE TEXT (first 2000) ===')
  console.log(text?.substring(0, 2000))
  console.log('=== END ===')

  const h1 = await page.locator('h1').textContent().catch(() => 'NOT FOUND')
  console.log('h1:', h1)

  const links = await page.locator('a[href^="/events/"]').count()
  console.log('Event links:', links)
})
