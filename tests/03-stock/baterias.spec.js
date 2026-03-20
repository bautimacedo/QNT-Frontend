import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/stock/baterias')
  await page.waitForLoadState('networkidle')
})

test('lista de baterías carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error al cargar')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: /Bater/i })).toBeVisible()
})

test('muestra contador de equipos', async ({ page }) => {
  await expect(page.locator('text=/\\d+ (equipos|bater)/i')).toBeVisible()
})

test('filtro por número de serie funciona', async ({ page }) => {
  const input = page.locator('input[placeholder*="serie"]')
  await input.fill('XXX-NO-EXISTE-999')
  await expect(page.locator('text=Sin resultados')).toBeVisible()
  await input.clear()
})

test('click en card lleva al detalle de la batería', async ({ page }) => {
  const card = page.locator('button.equip-card, .equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await expect(page).toHaveURL(/\/stock\/baterias\/\d+/)
})

test('detalle de batería muestra ciclos de carga', async ({ page }) => {
  const card = page.locator('button.equip-card, .equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await expect(page.locator('text=/ciclos/i')).toBeVisible()
})
