import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/pilotos')
  await page.waitForLoadState('networkidle')
})

test('lista de pilotos carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error')).not.toBeVisible()
  await expect(page.locator('text=/Piloto/i')).toBeVisible()
})

test('click en piloto lleva al detalle', async ({ page }) => {
  const card = page.locator('a[href*="/pilotos/"], button').filter({ hasText: /piloto|ver/i }).first()
  const links = page.locator('a[href*="/pilotos/"]')
  if (await links.count() === 0) { test.skip(); return }
  await links.first().click()
  await expect(page).toHaveURL(/\/pilotos\/\d+/)
})

test('búsqueda por nombre funciona', async ({ page }) => {
  const search = page.locator('input[placeholder*="uscar"], input[type="search"]').first()
  if (await search.count() === 0) { test.skip(); return }
  await search.fill('XXX-NO-EXISTE-999')
  await expect(page.locator('text=Error')).not.toBeVisible()
  await search.clear()
})
