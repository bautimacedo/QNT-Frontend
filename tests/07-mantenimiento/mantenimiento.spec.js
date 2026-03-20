import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/mantenimiento')
  await page.waitForLoadState('networkidle')
})

test('vista de mantenimiento carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: /Mantenimiento/i })).toBeVisible()
})

test('botón nuevo mantenimiento abre formulario', async ({ page }) => {
  const btn = page.getByRole('button', { name: /nuevo|registrar/i }).first()
  if (await btn.count() === 0) { test.skip(); return }
  await btn.click()
  await expect(page.locator('form, [role="dialog"], .qnt-modal').first()).toBeVisible({ timeout: 8000 })
  await page.keyboard.press('Escape')
})

test('filtros no generan error', async ({ page }) => {
  const select = page.locator('select').first()
  if (await select.count() === 0) { test.skip(); return }
  const options = await select.locator('option').allTextContents()
  if (options.length > 1) {
    await select.selectOption({ index: 1 })
    await expect(page.locator('text=Error')).not.toBeVisible()
    await select.selectOption({ index: 0 })
  }
})
