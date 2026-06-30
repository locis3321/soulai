import { test as base } from '@playwright/test'

export const test = base.extend<{}>({
  page: async ({ page }, use) => {
    // Default to domcontentloaded — the CSS @import for Google Fonts
    // (fonts.googleapis.com) is unreachable in CI/test environments
    // and never resolves, which blocks the 'load' event indefinitely.
    const originalGoto = page.goto.bind(page)
    page.goto = (url: string, options?: Parameters<typeof originalGoto>[1]) =>
      originalGoto(url, { waitUntil: 'domcontentloaded', ...options })

    await use(page)
  },
})

export { expect } from '@playwright/test'
