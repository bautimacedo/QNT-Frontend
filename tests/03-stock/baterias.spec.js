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
  await expect(page.locator('text=/\\d+ equipos registrados/')).toBeVisible()
})

test('filtro por número de serie — sin resultados', async ({ page }) => {
  const input = page.locator('input[placeholder*="serie"]')
  await input.fill('XXX-NO-EXISTE-999')
  await expect(page.locator('text=Sin resultados')).toBeVisible()
  await input.clear()
})

test('filtro por estado STOCK_ACTUAL funciona', async ({ page }) => {
  await page.locator('select').first().selectOption('STOCK_ACTUAL')
  await expect(page.locator('text=Error')).not.toBeVisible()
  await page.locator('select').first().selectOption('')
})

test('filtro por estado NO_LLEGO funciona', async ({ page }) => {
  await page.locator('select').first().selectOption('NO_LLEGO')
  await expect(page.locator('text=Error')).not.toBeVisible()
  await page.locator('select').first().selectOption('')
})

test('filtro por marca — sin resultados', async ({ page }) => {
  await page.locator('input[placeholder="Marca"]').fill('MARCAXYZ_NOEXISTE_999')
  await expect(page.locator('text=Sin resultados')).toBeVisible()
  await page.locator('input[placeholder="Marca"]').clear()
})

test('filtro por modelo — sin resultados', async ({ page }) => {
  await page.locator('input[placeholder="Modelo"]').fill('MODELOXYZ_NOEXISTE_999')
  await expect(page.locator('text=Sin resultados')).toBeVisible()
  await page.locator('input[placeholder="Modelo"]').clear()
})

test('botón Limpiar aparece con filtros activos y restablece', async ({ page }) => {
  await page.locator('input[placeholder="Marca"]').fill('DJI')
  await expect(page.getByRole('button', { name: 'Limpiar', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Limpiar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Limpiar', exact: true })).not.toBeVisible()
})

test('contador se actualiza con filtros activos', async ({ page }) => {
  const cards = page.locator('.equip-card')
  if (await cards.count() === 0) { test.skip(); return }
  const total = await page.locator('.filter-count').textContent()
  await page.locator('input[placeholder*="serie"]').fill('XXX-NO-EXISTE-999')
  const filtered = await page.locator('.filter-count').textContent()
  expect(filtered).not.toEqual(total)
  await page.locator('input[placeholder*="serie"]').clear()
})

test('breadcrumb Stock navega a la lista de stock', async ({ page }) => {
  await page.locator('a', { hasText: 'Stock' }).first().click()
  await expect(page).toHaveURL(/\/stock/)
})

test('click en card lleva al detalle de la batería', async ({ page }) => {
  const card = page.locator('button.equip-card, .equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await expect(page).toHaveURL(/\/stock\/baterias\/\d+/)
})

test('detalle muestra hero con título y estado', async ({ page }) => {
  const card = page.locator('button.equip-card, .equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.hero__title').first()).toBeVisible({ timeout: 8000 })
  await expect(page.locator('.hero__badge').first()).toBeVisible({ timeout: 8000 })
})

test('detalle muestra card Identificación', async ({ page }) => {
  const card = page.locator('button.equip-card, .equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.card__title').filter({ hasText: 'Identificación' })).toBeVisible({ timeout: 8000 })
})

test('detalle muestra card Estado y ubicación', async ({ page }) => {
  const card = page.locator('button.equip-card, .equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.card__title').filter({ hasText: /Estado y ubicación/i })).toBeVisible({ timeout: 8000 })
})

test('detalle — botón Volver al listado navega de regreso', async ({ page }) => {
  const card = page.locator('button.equip-card, .equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /Volver al listado/i }).click()
  await expect(page).toHaveURL(/\/stock\/baterias$/, { timeout: 8000 })
})

test('detalle — botón Editar abre modal', async ({ page }) => {
  const card = page.locator('button.equip-card, .equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await page.waitForLoadState('networkidle')
  const editBtn = page.getByRole('button', { name: /Editar|Completar datos/i }).last()
  await expect(editBtn).toBeVisible({ timeout: 8000 })
  await editBtn.click()
  await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 8000 })
  await expect(page.locator('.modal-title')).toBeVisible()
})

test('detalle — modal Editar se cierra con Cancelar', async ({ page }) => {
  const card = page.locator('button.equip-card, .equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await page.waitForLoadState('networkidle')
  const editBtn = page.getByRole('button', { name: /Editar|Completar datos/i }).last()
  await expect(editBtn).toBeVisible({ timeout: 8000 })
  await editBtn.click()
  await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 8000 })
  await page.locator('.modal-card .btn-secondary').click()
  await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 })
})
