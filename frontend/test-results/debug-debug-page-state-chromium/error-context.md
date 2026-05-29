# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: debug.spec.ts >> debug page state
- Location: tests/debug.spec.ts:3:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.waitForLoadState: Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - link "🏅 PolyFantasy" [ref=e7] [cursor=pointer]:
          - /url: /
        - link "Events" [ref=e8] [cursor=pointer]:
          - /url: /
        - link "Leaderboard" [ref=e9] [cursor=pointer]:
          - /url: /leaderboard
      - generic [ref=e10]: Creating account…
  - generic [ref=e11]:
    - generic [ref=e12]:
      - generic [ref=e13]:
        - heading "Polymarket Fantasy" [level=1] [ref=e14]
        - paragraph [ref=e15]: Predict events with play money. Compete with friends.
      - paragraph [ref=e17]: 0 active events
    - textbox "Search events…" [ref=e19]
    - button "All" [ref=e21]
    - paragraph [ref=e24]: Loading events…
```

# Test source

```ts
  1  | import { test } from '@playwright/test'
  2  | 
  3  | test('debug page state', async ({ page }) => {
  4  |   test.setTimeout(60000)
  5  |   await page.goto('/')
> 6  |   await page.waitForLoadState('networkidle')
     |              ^ Error: page.waitForLoadState: Test timeout of 60000ms exceeded.
  7  | 
  8  |   const text = await page.locator('body').textContent()
  9  |   console.log('=== PAGE TEXT (first 2000) ===')
  10 |   console.log(text?.substring(0, 2000))
  11 |   console.log('=== END ===')
  12 | 
  13 |   const h1 = await page.locator('h1').textContent().catch(() => 'NOT FOUND')
  14 |   console.log('h1:', h1)
  15 | 
  16 |   const links = await page.locator('a[href^="/events/"]').count()
  17 |   console.log('Event links:', links)
  18 | })
  19 | 
```