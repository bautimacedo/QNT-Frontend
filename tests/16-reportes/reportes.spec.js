import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/reportes')
  await page.waitForLoadState('networkidle')
})

test('vista de reportes carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Reportes', exact: true }).first()).toBeVisible()
})

test('secciones de reportes son visibles', async ({ page }) => {
  await page.waitForTimeout(2000)
  const content = page.locator('canvas')
    .or(page.locator('table'))
    .or(page.locator('[class*="chart"]'))
    .or(page.locator('[class*="reporte"]'))
    .or(page.getByText(/Sin datos/i))
    .first()
  await expect(content).toBeVisible({ timeout: 8000 })
})
