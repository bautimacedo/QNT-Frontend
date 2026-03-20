import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/stock/antenas-rtk')
  await page.waitForLoadState('networkidle')
})

test('lista de antenas RTK carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error al cargar')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: /RTK/i })).toBeVisible()
})

test('muestra contador de equipos registrados', async ({ page }) => {
  await expect(page.locator('text=/\\d+ equipos registrados/')).toBeVisible()
})

test('estado vacío muestra mensaje cuando no hay antenas', async ({ page }) => {
  const card = page.locator('.equip-card').first()
  if (await card.count() === 0) {
    await expect(page.locator('text=No hay antenas RTK registradas')).toBeVisible()
    return
  }
  await page.locator('input[placeholder*="serie"]').fill('XXX-NO-EXISTE-999')
  await expect(page.locator('text=Sin resultados')).toBeVisible()
  await page.locator('input[placeholder*="serie"]').clear()
})

test('filtro por número de serie — sin resultados', async ({ page }) => {
  const input = page.locator('input[placeholder*="serie"]')
  await input.fill('XXX-NO-EXISTE-999')
  await expect(page.locator('text=Sin resultados')).toBeVisible()
  await input.clear()
})

test('filtro por Marca — sin resultados', async ({ page }) => {
  await page.locator('input[placeholder="Marca"]').fill('MARCAXYZ_NOEXISTE_999')
  await page.waitForTimeout(300)
  await expect(page.locator('text=Sin resultados')).toBeVisible()
  await page.locator('input[placeholder="Marca"]').clear()
})

test('filtro por Modelo — sin resultados', async ({ page }) => {
  await page.locator('input[placeholder="Modelo"]').fill('MODELOXYZ_NOEXISTE_999')
  await page.waitForTimeout(300)
  await expect(page.locator('text=Sin resultados')).toBeVisible()
  await page.locator('input[placeholder="Modelo"]').clear()
})

test('filtro por estado STOCK_ACTUAL funciona', async ({ page }) => {
  await page.locator('select').first().selectOption('STOCK_ACTUAL')
  await page.waitForTimeout(300)
  await expect(page.locator('text=Error')).not.toBeVisible()
  await page.locator('select').first().selectOption('')
})

test('botón Limpiar aparece con filtros activos y los limpia', async ({ page }) => {
  await page.locator('input[placeholder="Marca"]').fill('DJI')
  await expect(page.getByRole('button', { name: 'Limpiar', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Limpiar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Limpiar', exact: true })).not.toBeVisible()
})

test('contador se actualiza con filtros activos', async ({ page }) => {
  const cards = page.locator('.equip-card')
  if (await cards.count() === 0) { test.skip(); return }
  const counterText = await page.locator('.filter-count').textContent()
  await page.locator('input[placeholder*="serie"]').fill('XXX-NO-EXISTE-999')
  await page.waitForTimeout(300)
  const filteredText = await page.locator('.filter-count').textContent()
  expect(filteredText).not.toEqual(counterText)
  await page.locator('input[placeholder*="serie"]').clear()
})

test('click en card lleva al detalle', async ({ page }) => {
  const card = page.locator('button.equip-card, .equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await expect(card).toBeVisible({ timeout: 10000 })
  await card.click()
  await expect(page).toHaveURL(/\/stock\/antenas-rtk\/\d+/, { timeout: 10000 })
})

test('detalle de antena RTK muestra estado', async ({ page }) => {
  const card = page.locator('button.equip-card, .equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('text=/estado|Estado/i').first()).toBeVisible({ timeout: 8000 })
})

test('breadcrumb Stock navega correctamente', async ({ page }) => {
  await page.locator('a', { hasText: 'Stock' }).first().click()
  await expect(page).toHaveURL(/\/stock/)
})
