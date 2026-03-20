import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/stock/accesorios')
  await page.waitForLoadState('networkidle')
})

test('lista de accesorios carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error al cargar')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: /Accesorio/i })).toBeVisible()
})

test('muestra contador de accesorios registrados', async ({ page }) => {
  await expect(page.locator('text=/\\d+ accesorios registrados/')).toBeVisible()
})

test('estado vacío muestra mensaje cuando no hay accesorios', async ({ page }) => {
  // Si ya hay accesorios, aplicar un filtro imposible para forzar estado vacío
  const card = page.locator('.equip-card').first()
  if (await card.count() === 0) {
    await expect(page.locator('text=No hay accesorios registrados')).toBeVisible()
    return
  }
  // Filtrar por nombre inexistente
  await page.locator('input[placeholder="Buscar por nombre…"]').fill('ACCESORIO_INEXISTENTE_XYZ999')
  await expect(page.locator('text=Sin resultados con los filtros aplicados.')).toBeVisible()
})

test('filtro por nombre — sin resultados', async ({ page }) => {
  await page.locator('input[placeholder="Buscar por nombre…"]').fill('NOMBRE_INEXISTENTE_XYZ999')
  await page.waitForTimeout(300)
  await expect(page.locator('text=Sin resultados')).toBeVisible()
})

test('filtro por nombre — limpiar restaura lista', async ({ page }) => {
  const cards = page.locator('.equip-card')
  if (await cards.count() === 0) { test.skip(); return }
  const countBefore = await cards.count()

  await page.locator('input[placeholder="Buscar por nombre…"]').fill('NOMBRE_INEXISTENTE_XYZ999')
  await page.waitForTimeout(300)
  await expect(page.locator('text=Sin resultados')).toBeVisible()

  await page.getByRole('button', { name: 'Limpiar' }).click()
  await expect(cards).toHaveCount(countBefore, { timeout: 5000 })
})

test('filtro por estado STOCK_ACTUAL funciona', async ({ page }) => {
  await page.locator('select').first().selectOption('STOCK_ACTUAL')
  await page.waitForTimeout(300)
  await expect(page.locator('text=Error')).not.toBeVisible()
  await page.locator('select').first().selectOption('')
})

test('filtro por estado NO_LLEGO funciona', async ({ page }) => {
  await page.locator('select').first().selectOption('NO_LLEGO')
  await page.waitForTimeout(300)
  await expect(page.locator('text=Error')).not.toBeVisible()
  await page.locator('select').first().selectOption('')
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

test('filtro por Ubicación — sin resultados', async ({ page }) => {
  await page.locator('input[placeholder="Ubicación"]').fill('UBICACIONXYZ_NOEXISTE_999')
  await page.waitForTimeout(300)
  await expect(page.locator('text=Sin resultados')).toBeVisible()
  await page.locator('input[placeholder="Ubicación"]').clear()
})

test('botón Limpiar aparece cuando hay filtros activos', async ({ page }) => {
  await page.locator('input[placeholder="Marca"]').fill('DJI')
  await expect(page.getByRole('button', { name: 'Limpiar', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Limpiar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Limpiar', exact: true })).not.toBeVisible()
})

test('contador se actualiza con filtros activos', async ({ page }) => {
  const cards = page.locator('.equip-card')
  if (await cards.count() === 0) { test.skip(); return }

  const counterText = await page.locator('.filter-count').textContent()
  await page.locator('input[placeholder="Buscar por nombre…"]').fill('NOMBRE_INEXISTENTE_XYZ999')
  await page.waitForTimeout(300)
  const filteredText = await page.locator('.filter-count').textContent()
  expect(filteredText).not.toEqual(counterText)
})

test('click en card lleva al detalle', async ({ page }) => {
  const card = page.locator('button.equip-card, .equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await expect(card).toBeVisible({ timeout: 10000 })
  await card.click()
  await expect(page).toHaveURL(/\/stock\/accesorios\/\d+/, { timeout: 10000 })
})

test('detalle muestra datos del accesorio', async ({ page }) => {
  const card = page.locator('button.equip-card, .equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await page.waitForLoadState('networkidle')
  // La vista detalle debe tener estado y algún dato identificador
  await expect(page.locator('text=/estado|Estado/i').first()).toBeVisible({ timeout: 8000 })
})

test('breadcrumb Stock navega correctamente', async ({ page }) => {
  await page.locator('a', { hasText: 'Stock' }).first().click()
  await expect(page).toHaveURL(/\/stock/)
})
