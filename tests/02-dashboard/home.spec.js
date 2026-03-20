import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home')
  await page.waitForLoadState('networkidle')
})

test('dashboard carga sin errores', async ({ page }) => {
  await expect(page.locator('text=500').or(page.locator('text=Error'))).not.toBeVisible()
})

test('KPI cards son visibles', async ({ page }) => {
  // El dashboard renderiza KPIs en un grid de 2/4 columnas
  await expect(page.locator('.grid.grid-cols-2, .grid-cols-4').first()).toBeVisible({ timeout: 10000 })
})

test('sidebar de navegación es visible', async ({ page }) => {
  await expect(page.locator('nav, aside').first()).toBeVisible()
})

test('navegación a Stock desde sidebar', async ({ page }) => {
  // Show Operaciones section first
  await page.locator('.header__tab').filter({ hasText: 'Operaciones' }).click()
  await page.waitForLoadState('networkidle')
  await page.locator('.sidebar__item').filter({ hasText: 'Stock' }).click()
  await expect(page).toHaveURL(/\/stock/, { timeout: 15000 })
})

test('navegación a Misiones desde sidebar', async ({ page }) => {
  // Show Operaciones section first
  await page.locator('.header__tab').filter({ hasText: 'Operaciones' }).click()
  await page.waitForLoadState('networkidle')
  await page.locator('.sidebar__item').filter({ hasText: 'Misiones' }).click()
  await expect(page).toHaveURL(/\/misiones/, { timeout: 15000 })
})

test('navegación a Compras desde sidebar', async ({ page }) => {
  // Show Administración section first
  await page.locator('.header__tab').filter({ hasText: 'Administración' }).click()
  await page.waitForLoadState('networkidle')
  await page.locator('.sidebar__item').filter({ hasText: 'Compras' }).click()
  await expect(page).toHaveURL(/\/compras/, { timeout: 15000 })
})
