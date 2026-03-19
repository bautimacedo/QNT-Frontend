import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/stock/accesorios')
  await page.waitForLoadState('networkidle')
})

test('lista de accesorios carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error al cargar')).not.toBeVisible()
  await expect(page.locator('text=/Accesorio/i')).toBeVisible()
})

test('click en card lleva al detalle', async ({ page }) => {
  const card = page.locator('button.equip-card, .equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await expect(page).toHaveURL(/\/stock\/accesorios\/\d+/)
})
