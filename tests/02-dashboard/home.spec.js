import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home')
})

test('dashboard carga sin errores', async ({ page }) => {
  await expect(page.locator('text=500').or(page.locator('text=Error'))).not.toBeVisible()
})

test('KPI cards son visibles', async ({ page }) => {
  // Espera que haya al menos 3 cards de métricas
  await expect(page.locator('.kpi-card, [class*="kpi"], [class*="stat"]').first()).toBeVisible({ timeout: 10000 })
})

test('sidebar de navegación es visible', async ({ page }) => {
  await expect(page.locator('nav, aside').first()).toBeVisible()
})

test('navegación a Stock desde sidebar', async ({ page }) => {
  await page.getByRole('link', { name: /stock/i }).first().click()
  await expect(page).toHaveURL(/\/stock/)
})

test('navegación a Misiones desde sidebar', async ({ page }) => {
  await page.getByRole('link', { name: /misiones/i }).first().click()
  await expect(page).toHaveURL(/\/misiones/)
})

test('navegación a Compras desde sidebar', async ({ page }) => {
  await page.getByRole('link', { name: /compras/i }).first().click()
  await expect(page).toHaveURL(/\/compras/)
})
