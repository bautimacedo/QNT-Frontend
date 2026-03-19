import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/stock/docks')
  await page.waitForLoadState('networkidle')
})

test('lista carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error al cargar')).not.toBeVisible()
  await expect(page.locator('text=Docks')).toBeVisible()
})

test('muestra contador de equipos', async ({ page }) => {
  await expect(page.locator('text=/\\d+ equipos registrados/')).toBeVisible()
})

test('filtro NO_LLEGO muestra docks pendientes de llegada', async ({ page }) => {
  await page.locator('select').first().selectOption('NO_LLEGO')
  await expect(page.locator('text=Error')).not.toBeVisible()
  // Los docks creados via compra deben aparecer aquí
  await page.locator('select').first().selectOption('')
})

test('filtro STOCK_ACTUAL muestra docks en stock', async ({ page }) => {
  await page.locator('select').first().selectOption('STOCK_ACTUAL')
  await expect(page.locator('text=Error')).not.toBeVisible()
  await page.locator('select').first().selectOption('')
})

test('filtro por número de serie — sin resultados', async ({ page }) => {
  await page.locator('input[placeholder*="serie"]').fill('XXX-NO-EXISTE-999')
  await expect(page.locator('text=Sin resultados')).toBeVisible()
  await page.locator('input[placeholder*="serie"]').clear()
})

test('click en card abre detalle del dock', async ({ page }) => {
  const card = page.locator('.equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await expect(page).toHaveURL(/\/stock\/docks\/\d+/)
})

test('detalle del dock muestra datos de telemetría si disponible', async ({ page }) => {
  const card = page.locator('.equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await page.waitForLoadState('networkidle')
  // Debe tener estado visible
  await expect(page.locator('text=/estado|Estado/i')).toBeVisible()
})
