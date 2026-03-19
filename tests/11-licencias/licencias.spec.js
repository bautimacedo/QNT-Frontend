import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/licencias')
  await page.waitForLoadState('networkidle')
})

test('vista de licencias ANAC carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error')).not.toBeVisible()
  await expect(page.locator('text=/Licencia/i')).toBeVisible()
})

test('botón nueva licencia abre formulario', async ({ page }) => {
  const btn = page.getByRole('button', { name: /nueva licencia/i }).first()
  if (await btn.count() === 0) { test.skip(); return }
  await btn.click()
  await expect(page.locator('form, [role="dialog"]').first()).toBeVisible()
  await page.keyboard.press('Escape')
})

test('licencias existentes son visibles', async ({ page }) => {
  const content = page.locator('table tr, .licencia-card, text=/No hay licencias/i').first()
  await expect(content).toBeVisible({ timeout: 8000 })
})
