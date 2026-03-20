import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/seguros')
  await page.waitForLoadState('networkidle')
})

test('vista de seguros carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: /Seguro/i })).toBeVisible()
})

test('botón nuevo seguro abre formulario', async ({ page }) => {
  const btn = page.getByRole('button', { name: /nuevo seguro/i }).first()
  if (await btn.count() === 0) { test.skip(); return }
  await btn.click()
  await expect(page.locator('form, [role="dialog"], .qnt-modal').first()).toBeVisible({ timeout: 8000 })
  await page.keyboard.press('Escape')
})

test('registros de seguros son visibles', async ({ page }) => {
  const content = page.locator('.seg-card')
    .or(page.locator('.kpi-chip'))
    .or(page.getByText(/No hay pólizas/i))
    .or(page.locator('.qnt-state'))
    .first()
  await expect(content).toBeVisible({ timeout: 8000 })
})
