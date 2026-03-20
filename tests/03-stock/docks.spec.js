import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/stock/docks')
  await page.waitForLoadState('networkidle')
})

test('lista carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error al cargar')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Docks' })).toBeVisible()
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
  await expect(page.locator('text=/estado|Estado/i').first()).toBeVisible()
})

test('detalle del dock muestra hero con título y badge de estado', async ({ page }) => {
  const card = page.locator('.equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.hero__title').first()).toBeVisible({ timeout: 8000 })
  await expect(page.locator('.hero__badge').first()).toBeVisible({ timeout: 8000 })
})

test('detalle del dock muestra card Identificación', async ({ page }) => {
  const card = page.locator('.equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.card__title').filter({ hasText: 'Identificación' })).toBeVisible({ timeout: 8000 })
})

test('detalle — botón Volver al listado navega de regreso', async ({ page }) => {
  const card = page.locator('.equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /Volver al listado/i }).click()
  await expect(page).toHaveURL(/\/stock\/docks$/, { timeout: 8000 })
})

test('detalle — botón Editar abre modal de edición', async ({ page }) => {
  const card = page.locator('.equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await page.waitForLoadState('networkidle')
  const editBtn = page.getByRole('button', { name: /Editar|Completar datos/i }).last()
  await expect(editBtn).toBeVisible({ timeout: 8000 })
  await editBtn.click()
  await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 8000 })
})

test('detalle — modal Editar se cierra con Cancelar', async ({ page }) => {
  const card = page.locator('.equip-card').first()
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

test('filtro por Marca — sin resultados', async ({ page }) => {
  await page.locator('input[placeholder="Marca"]').fill('MARCAXYZ_NOEXISTE_999')
  await expect(page.locator('text=Sin resultados')).toBeVisible()
  await page.locator('input[placeholder="Marca"]').clear()
})

test('filtro por Modelo — sin resultados', async ({ page }) => {
  await page.locator('input[placeholder="Modelo"]').fill('MODELOXYZ_NOEXISTE_999')
  await expect(page.locator('text=Sin resultados')).toBeVisible()
  await page.locator('input[placeholder="Modelo"]').clear()
})

test('botón Limpiar aparece con filtros activos y los limpia', async ({ page }) => {
  await page.locator('input[placeholder="Marca"]').fill('DJI')
  await expect(page.getByRole('button', { name: 'Limpiar', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Limpiar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Limpiar', exact: true })).not.toBeVisible()
})

test('breadcrumb Stock navega correctamente', async ({ page }) => {
  await page.locator('a', { hasText: 'Stock' }).first().click()
  await expect(page).toHaveURL(/\/stock/)
})
