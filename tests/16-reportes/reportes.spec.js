import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/reportes')
  await page.waitForLoadState('networkidle')
})

test('vista de reportes carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error')).not.toBeVisible()
  await expect(page.locator('text=/Reporte/i')).toBeVisible()
})

test('secciones de reportes son visibles', async ({ page }) => {
  await page.waitForTimeout(2000)
  const content = page.locator('canvas, table, [class*="chart"], [class*="reporte"], text=/Sin datos/i').first()
  await expect(content).toBeVisible({ timeout: 8000 })
})
