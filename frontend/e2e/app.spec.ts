import { test, expect } from '@playwright/test'

const TEST_PASSWORD = 'Test1234!'
const TEST_NAME = 'E2E Tester'

let emailCounter = 0

async function registerViaApi(request: any) {
  emailCounter++
  const email = `e2e-${Date.now()}-${emailCounter}@soulai.test`
  const res = await request.post('/api/auth/register', {
    data: { email, password: TEST_PASSWORD, name: TEST_NAME, language: 'en' },
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body.token).toBeTruthy()
  expect(body.user).toBeTruthy()
  return { token: body.token as string, user: body.user }
}

test.describe('SoulAI App', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('register, reach app shell, and navigate to Discover', async ({ page, request }) => {
    const { token, user } = await registerViaApi(request)

    // Seed Zustand persisted state so the app considers us logged in + onboarded
    await page.addInitScript(
      ({ token, user }) => {
        const state = {
          state: {
            auth: { user, token, isAuthenticated: true, isLoading: false, error: null },
            activeTab: 'home',
            language: 'en',
            largeTextMode: false,
            hasOnboarded: true,
          },
          version: 0,
        }
        localStorage.setItem('soul-storage', JSON.stringify(state))
      },
      { token, user },
    )

    await page.goto('/')
    // Should stay on / (not redirect to /login or /onboarding)
    await expect(page).toHaveURL(/\/$/)

    // Home tab should be active
    await expect(page.locator('[data-testid="nav-home"]')).toBeVisible()

    // Navigate to Discover tab
    await page.locator('[data-testid="nav-discover"]').click()

    // Discover hub should render
    await expect(page.locator('#discover-view-container')).toBeVisible()

    // Category cards should be visible
    await expect(page.locator('[data-testid="discover-card-tarot"]')).toBeVisible()
    await expect(page.locator('[data-testid="discover-card-astrology"]')).toBeVisible()
    await expect(page.locator('[data-testid="discover-card-bazi"]')).toBeVisible()
    await expect(page.locator('[data-testid="discover-card-ziwei"]')).toBeVisible()
    await expect(page.locator('[data-testid="discover-card-numerology"]')).toBeVisible()
  })

  test('divination API routes return 200 (not 404) after auth', async ({ page, request }) => {
    const { token } = await registerViaApi(request)

    const authHeaders = { Authorization: `Bearer ${token}` }

    // Astrology natal-chart
    const astroRes = await request.post('/api/astrology/natal-chart', {
      headers: authHeaders,
      data: { birthDate: '1990-06-15', birthTime: '14:30', birthPlace: 'Bangkok, Thailand' },
    })
    expect(astroRes.status()).toBe(200)
    const astroBody = await astroRes.json()
    expect(astroBody.data).toBeTruthy()

    // BaZi
    const baziRes = await request.post('/api/bazi/calculate', {
      headers: authHeaders,
      data: { birthDate: '1990-06-15', birthTime: '14:30' },
    })
    expect(baziRes.status()).toBe(200)
    const baziBody = await baziRes.json()
    expect(baziBody.data).toBeTruthy()

    // Numerology
    const numRes = await request.post('/api/numerology/calculate', {
      headers: authHeaders,
      data: { birthDate: '1990-06-15', name: 'Test User' },
    })
    expect(numRes.status()).toBe(200)
    const numBody = await numRes.json()
    expect(numBody.data).toBeTruthy()

    // Zi Wei
    const ziweiRes = await request.post('/api/ziwei/calculate', {
      headers: authHeaders,
      data: { birthDate: '1990-06-15', birthTime: '14:30', gender: 'male' },
    })
    expect(ziweiRes.status()).toBe(200)
    const ziweiBody = await ziweiRes.json()
    expect(ziweiBody.data).toBeTruthy()
  })

  test('Discover category cards are clickable and render sub-views', async ({ page, request }) => {
    const { token, user } = await registerViaApi(request)

    await page.addInitScript(
      ({ token, user }) => {
        const state = {
          state: {
            auth: { user, token, isAuthenticated: true, isLoading: false, error: null },
            activeTab: 'discover',
            language: 'en',
            largeTextMode: false,
            hasOnboarded: true,
          },
          version: 0,
        }
        localStorage.setItem('soul-storage', JSON.stringify(state))
      },
      { token, user },
    )

    await page.goto('/')
    await expect(page).toHaveURL(/\/$/)

    // Should already be on Discover (activeTab: 'discover')
    await expect(page.locator('#discover-view-container')).toBeVisible()

    // Click BaZi card
    await page.locator('[data-testid="discover-card-bazi"]').click()
    // The hub should be replaced by the BaZi sub-view
    await expect(page.locator('#discover-hub-dashboard')).not.toBeVisible()
  })

  test('BaZi calculate button calls API and shows result', async ({ page, request }) => {
    const { token, user } = await registerViaApi(request)

    // Include birth data so the calculate button is enabled
    const userWithBirth = { ...user, birthDate: '1990-06-15', birthTime: '14:30', birthPlace: 'Bangkok, Thailand' }

    // Intercept /api/auth/me to return user with birth data
    await page.route('**/api/auth/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: userWithBirth }),
      })
    })

    await page.addInitScript(
      ({ token, user }) => {
        const state = {
          state: {
            auth: { user, token, isAuthenticated: true, isLoading: false, error: null },
            activeTab: 'discover',
            language: 'en',
            largeTextMode: false,
            hasOnboarded: true,
          },
          version: 0,
        }
        localStorage.setItem('soul-storage', JSON.stringify(state))
      },
      { token, user: userWithBirth },
    )

    await page.goto('/')
    await expect(page.locator('#discover-view-container')).toBeVisible()

    // Click BaZi card to open the module
    await page.locator('[data-testid="discover-card-bazi"]').click()
    // The hub should be replaced by the detail view
    await expect(page.locator('#discover-detail-view')).toBeVisible()

    // Click the calculate button
    const calcBtn = page.locator('button:has-text("Calculate Your BaZi Chart")')
    await expect(calcBtn).toBeVisible()
    await calcBtn.click()

    // Wait for result to appear (the chart summary div)
    await expect(page.locator('text=Your Chart Summary')).toBeVisible({ timeout: 15000 })
  })

  test('tarot API returns 200 with correct endpoint', async ({ request }) => {
    const { token } = await registerViaApi(request)
    const authHeaders = { Authorization: `Bearer ${token}` }

    const res = await request.post('/api/tarot/reading', {
      headers: authHeaders,
      data: {
        question: 'What guidance do I need today?',
        cards: [{ name: 'The Star', isReversed: false }],
        spreadType: 'single',
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.reading).toBeTruthy()
  })

  test('healing mood and journal APIs work', async ({ request }) => {
    const { token } = await registerViaApi(request)
    const authHeaders = { Authorization: `Bearer ${token}` }

    // Log a mood
    const moodRes = await request.post('/api/healing/mood/checkin', {
      headers: authHeaders,
      data: { mood: 'calm', note: 'E2E test mood', energyScore: 85 },
    })
    expect(moodRes.status()).toBe(201)

    // Get mood history
    const historyRes = await request.get('/api/healing/mood/history?days=7', {
      headers: authHeaders,
    })
    expect(historyRes.status()).toBe(200)

    // Create a journal
    const journalRes = await request.post('/api/healing/journals', {
      headers: authHeaders,
      data: { title: 'E2E Test Journal', content: 'Testing journal creation', mood: 'calm' },
    })
    expect(journalRes.status()).toBe(201)
  })

  test('no critical console errors on load', async ({ page, request }) => {
    const { token, user } = await registerViaApi(request)

    await page.addInitScript(
      ({ token, user }) => {
        const state = {
          state: {
            auth: { user, token, isAuthenticated: true, isLoading: false, error: null },
            activeTab: 'home',
            language: 'en',
            largeTextMode: false,
            hasOnboarded: true,
          },
          version: 0,
        }
        localStorage.setItem('soul-storage', JSON.stringify(state))
      },
      { token, user },
    )

    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const critical = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('manifest') && !e.includes('service-worker') && !e.includes('ERR_CONNECTION') && !e.includes('net::'),
    )
    expect(critical).toHaveLength(0)
  })
})
