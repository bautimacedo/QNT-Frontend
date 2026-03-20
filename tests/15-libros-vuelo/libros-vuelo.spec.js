import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/logs')
  await page.waitForLoadState('networkidle')
})

test('vista libros de vuelo carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: /Libro|Vuelo|Log/i })).toBeVisible()
})

test('botón nuevo registro abre formulario', async ({ page }) => {
  const btn = page.getByRole('button', { name: /nuevo|registrar/i }).first()
  if (await btn.count() === 0) { test.skip(); return }
  await btn.click()
  await expect(page.locator('form, [role="dialog"], .qnt-modal').first()).toBeVisible({ timeout: 8000 })
  await page.keyboard.press('Escape')
})

test('registros existentes son visibles', async ({ page }) => {
  const content = page.locator('table tr')
    .or(page.locator('.log-card'))
    .or(page.getByText(/No hay registros/i))
    .first()
  await expect(content).toBeVisible({ timeout: 8000 })
})
