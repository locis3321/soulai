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

    // Navigate to Discover via URL
    await page.goto('/discover')
    await expect(page).toHaveURL(/\/discover/)

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

    await page.goto('/discover')
    await expect(page).toHaveURL(/\/discover/)

    // Should be on Discover
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

    await page.goto('/discover')
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

  test('full onboarding flow: register, birth profile, reach home', async ({ page, request }) => {
    const { token, user } = await registerViaApi(request)

    // Intercept /api/auth/me to return user with birth data after onboarding saves it
    const userWithBirth = { ...user, birthDate: '1990-06-15', birthTime: '14:30', birthPlace: 'Bangkok, Thailand' }
    let meReturnsBirth = false
    await page.route('**/api/auth/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: meReturnsBirth ? userWithBirth : user }),
      })
    })

    // Intercept profile update to succeed
    await page.route('**/api/users/profile', (route) => {
      if (route.request().method() === 'PUT') {
        meReturnsBirth = true
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
      } else {
        route.continue()
      }
    })

    // Seed auth state but hasOnboarded: false
    await page.addInitScript(
      ({ token, user }) => {
        const state = {
          state: {
            auth: { user, token, isAuthenticated: true, isLoading: false, error: null },
            language: 'en',
            largeTextMode: false,
            hasOnboarded: false,
          },
          version: 0,
        }
        localStorage.setItem('soul-storage', JSON.stringify(state))
      },
      { token, user },
    )

    await page.goto('/')

    // Should be on onboarding
    await expect(page.locator('#onboarding-flow-container')).toBeVisible({ timeout: 10000 })

    // Step 1: Welcome - click "Let Us Begin Alignment"
    await page.locator('button:has-text("Let Us Begin Alignment")').click()

    // Step 2: Interests - click Continue
    await page.locator('button:has-text("Continue")').click()

    // Step 3: Birth info - click Set Coordinates (pre-filled defaults)
    await page.locator('button:has-text("Set Coordinates")').click()

    // Step 4: Auth - click Generate Destiny and Register
    await page.locator('button:has-text("Generate Destiny and Register")').click()

    // Step 5: Animation - wait for it to complete (6 lines × 1s + 1s buffer = ~8s)
    await page.waitForTimeout(9000)

    // Should now be on the home page
    await expect(page.locator('[data-testid="nav-home"]')).toBeVisible({ timeout: 10000 })
  })

  test('daily insight, tarot, chat, journal via API', async ({ request }) => {
    const { token } = await registerViaApi(request)
    const authHeaders = { Authorization: `Bearer ${token}` }

    // Daily insight
    const insightRes = await request.post('/api/insights/daily', {
      headers: authHeaders,
      data: { mood: 'calm', lang: 'en' },
    })
    expect(insightRes.status()).toBe(200)
    const insightBody = await insightRes.json()
    expect(insightBody.energy).toBeTruthy()
    expect(insightBody.dailyMessage).toBeTruthy()

    // Tarot reading
    const tarotRes = await request.post('/api/tarot/reading', {
      headers: authHeaders,
      data: {
        question: 'What do I need to know today?',
        cards: [{ name: 'The Star', isReversed: false }],
        spreadType: 'single',
      },
    })
    expect(tarotRes.status()).toBe(200)
    expect((await tarotRes.json()).reading).toBeTruthy()

    // Chat: create session
    const sessionRes = await request.post('/api/chat/sessions', {
      headers: authHeaders,
      data: { advisorKey: 'luna' },
    })
    expect(sessionRes.status()).toBe(201)
    const sessionId = (await sessionRes.json()).session.id

    // Chat: send message
    const msgRes = await request.post(`/api/chat/sessions/${sessionId}/messages`, {
      headers: authHeaders,
      data: { content: 'Hello, I need spiritual guidance today.' },
    })
    expect(msgRes.status()).toBe(200)
    const msgBody = await msgRes.json()
    expect(msgBody.aiMessage).toBeTruthy()

    // Journal: create
    const journalRes = await request.post('/api/healing/journals', {
      headers: authHeaders,
      data: { title: 'My E2E Journal', content: 'Today I feel at peace.', mood: 'calm' },
    })
    expect(journalRes.status()).toBe(201)

    // Journal: list
    const journalsRes = await request.get('/api/healing/journals', { headers: authHeaders })
    expect(journalsRes.status()).toBe(200)
    const journals = (await journalsRes.json()).journals
    expect(journals.length).toBeGreaterThan(0)
  })

  test('payment intent creation and subscription flow', async ({ request }) => {
    const { token } = await registerViaApi(request)
    const authHeaders = { Authorization: `Bearer ${token}` }

    // Get plans
    const plansRes = await request.get('/api/payments/plans', { headers: authHeaders })
    expect(plansRes.status()).toBe(200)
    const plans = (await plansRes.json()).plans
    expect(plans.length).toBe(3)

    // Create payment intent (monthly plus)
    const intentRes = await request.post('/api/payments/create-intent', {
      headers: authHeaders,
      data: { planId: 'plus', paymentMethod: 'alipay', period: 'monthly' },
    })
    expect(intentRes.status()).toBe(200)
    const intent = await intentRes.json()
    expect(intent.orderId).toBeTruthy()
    expect(parseFloat(intent.amount)).toBe(34.9)
    expect(intent.period).toBe('monthly')

    // Create yearly premium intent
    const yearlyRes = await request.post('/api/payments/create-intent', {
      headers: authHeaders,
      data: { planId: 'premium', paymentMethod: 'wechat', period: 'yearly' },
    })
    expect(yearlyRes.status()).toBe(200)
    const yearly = await yearlyRes.json()
    expect(parseFloat(yearly.amount)).toBe(699)
    expect(yearly.period).toBe('yearly')

    // Check subscription (should be free)
    const subRes = await request.get('/api/payments/subscription', { headers: authHeaders })
    expect(subRes.status()).toBe(200)
    const sub = (await subRes.json()).subscription
    expect(sub.tier).toBe('free')

    // Cancel subscription (no-op for free)
    const cancelRes = await request.post('/api/payments/subscription/cancel', { headers: authHeaders })
    expect(cancelRes.status()).toBe(200)
  })

  test('tarot three-card requires plus tier', async ({ request }) => {
    const { token } = await registerViaApi(request)
    const authHeaders = { Authorization: `Bearer ${token}` }

    // Free user trying three-card spread
    const res = await request.post('/api/tarot/reading', {
      headers: authHeaders,
      data: {
        question: 'Test',
        cards: [
          { name: 'The Fool', isReversed: false },
          { name: 'The Magician', isReversed: true },
          { name: 'The Star', isReversed: false },
        ],
        spreadType: 'three',
      },
    })
    expect(res.status()).toBe(403)
    const body = await res.json()
    expect(body.requiredTier).toBe('plus')
  })

  test('no critical console errors on load', async ({ page, request }) => {
    const { token, user } = await registerViaApi(request)

    await page.addInitScript(
      ({ token, user }) => {
        const state = {
          state: {
            auth: { user, token, isAuthenticated: true, isLoading: false, error: null },
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
      (e) => !e.includes('favicon') && !e.includes('manifest') && !e.includes('service-worker') && !e.includes('ERR_CONNECTION') && !e.includes('net::') && !e.includes('404'),
    )
    expect(critical).toHaveLength(0)
  })
})
