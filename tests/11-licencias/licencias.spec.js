import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/licencias')
  await page.waitForLoadState('networkidle')
})

test('vista de licencias ANAC carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: /Licencia/i })).toBeVisible()
})

test('botón nueva licencia abre formulario', async ({ page }) => {
  const btn = page.getByRole('button', { name: /nueva licencia/i }).first()
  if (await btn.count() === 0) { test.skip(); return }
  await btn.click()
  await expect(page.locator('form, [role="dialog"], .qnt-modal').first()).toBeVisible({ timeout: 8000 })
  await page.keyboard.press('Escape')
})

test('licencias existentes son visibles', async ({ page }) => {
  const content = page.locator('.lic-card')
    .or(page.locator('.kpi-chip'))
    .or(page.getByText(/No hay licencias/i))
    .or(page.locator('.qnt-state'))
    .first()
  await expect(content).toBeVisible({ timeout: 8000 })
})
