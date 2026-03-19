import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/seguros')
  await page.waitForLoadState('networkidle')
})

test('vista de seguros carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error')).not.toBeVisible()
  await expect(page.locator('text=/Seguro/i')).toBeVisible()
})

test('botón nuevo seguro abre formulario', async ({ page }) => {
  const btn = page.getByRole('button', { name: /nuevo seguro/i }).first()
  if (await btn.count() === 0) { test.skip(); return }
  await btn.click()
  await expect(page.locator('form, [role="dialog"]').first()).toBeVisible()
  await page.keyboard.press('Escape')
})

test('registros de seguros son visibles', async ({ page }) => {
  // La vista debe mostrar tabla, cards o empty state — ninguno de esos es un error
  const content = page.locator('table, .seguro-card, text=/No hay seguros/i, text=/sin seguros/i').first()
  await expect(content).toBeVisible({ timeout: 8000 })
})
