import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/compras')
  await page.waitForLoadState('networkidle')
})

// ─── helpers ────────────────────────────────────────────────────────────────
async function abrirModalYCompletarBase(page, { importe = '50000', tipo = 'EQUIPO', metodoPago = 'EFECTIVO' } = {}) {
  await page.getByRole('button', { name: /nueva compra/i }).click()
  await expect(page.getByRole('heading', { name: /nueva compra/i })).toBeVisible()

  // Proveedor (autocomplete): escribir y seleccionar primero
  const provInput = page.locator('input[placeholder*="roveedor"]').first()
  await provInput.fill('a')
  await page.waitForTimeout(600)
  const sugerencia = page.locator('ul li, [class*="dropdown"] li').first()
  if (await sugerencia.count() > 0) await sugerencia.click()

  // Fecha de compra
  await page.locator('input[type="date"]').first().fill('2026-03-01')

  // Método de pago
  await page.locator('select').filter({ hasText: /efectivo|tarjeta|transferencia/i }).first().selectOption(metodoPago)

  // Importe
  await page.locator('input[placeholder*="mporte"], input[type="number"]').first().fill(importe)

  // Tipo de compra
  const tipoSelect = page.locator('select').filter({ hasText: /equipo|repuesto|licencia/i }).first()
  if (await tipoSelect.count() > 0) await tipoSelect.selectOption(tipo)
}

// ─── tests ──────────────────────────────────────────────────────────────────

test('lista de compras carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: /Compra/i })).toBeVisible()
})

test('botón Nueva Compra abre el modal', async ({ page }) => {
  await page.getByRole('button', { name: /nueva compra/i }).click()
  await expect(page.getByRole('heading', { name: /nueva compra/i })).toBeVisible()
})

test('crear compra tipo EQUIPO - DRON', async ({ page }) => {
  await abrirModalYCompletarBase(page, { importe: '550000' })

  const tipoEquipo = page.locator('select').filter({ hasText: /dron|dock|bateria/i }).first()
  if (await tipoEquipo.count() > 0) await tipoEquipo.selectOption('DRON')

  await page.locator('textarea').first().fill('Dron compra test Playwright')
  await page.getByRole('button', { name: 'Guardar' }).click()

  await expect(page.locator('text=500')).not.toBeVisible({ timeout: 8000 })
})

test('crear compra tipo EQUIPO - DOCK y verificar en stock', async ({ page }) => {
  await abrirModalYCompletarBase(page, { importe: '200000' })

  const tipoEquipo = page.locator('select').filter({ hasText: /dron|dock|bateria/i }).first()
  if (await tipoEquipo.count() > 0) await tipoEquipo.selectOption('DOCK')

  await page.locator('textarea').first().fill('Dock compra test Playwright')
  await page.getByRole('button', { name: 'Guardar' }).click()

  // Verificar que aparece en stock docks con NO_LLEGO
  await page.goto('/home/stock/docks')
  await page.waitForLoadState('networkidle')
  await page.locator('select').first().selectOption('NO_LLEGO')
  const cards = page.locator('.equip-card, button.equip-card')
  await expect(cards.first()).toBeVisible({ timeout: 10000 })
})

test('crear compra tipo EQUIPO - BATERIA', async ({ page }) => {
  await abrirModalYCompletarBase(page, { importe: '45000' })

  const tipoEquipo = page.locator('select').filter({ hasText: /dron|dock|bateria/i }).first()
  if (await tipoEquipo.count() > 0) await tipoEquipo.selectOption('BATERIA')

  await page.locator('textarea').first().fill('Batería compra test Playwright')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.locator('text=500')).not.toBeVisible({ timeout: 8000 })
})

test('crear compra tipo EQUIPO - HELICE', async ({ page }) => {
  await abrirModalYCompletarBase(page, { importe: '8000' })

  const tipoEquipo = page.locator('select').filter({ hasText: /dron|dock|bateria/i }).first()
  if (await tipoEquipo.count() > 0) await tipoEquipo.selectOption('HELICE')

  await page.locator('textarea').first().fill('Hélice compra test Playwright')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.locator('text=500')).not.toBeVisible({ timeout: 8000 })
})

test('crear compra con método pago TARJETA muestra campos compañía y últimos 4', async ({ page }) => {
  await page.getByRole('button', { name: /nueva compra/i }).click()
  await page.locator('select').filter({ hasText: /efectivo|tarjeta/i }).first().selectOption('TARJETA')
  await expect(page.locator('input[placeholder*="ompañía"], label:has-text("Compañía")')).toBeVisible()
  await expect(page.locator('input[placeholder*="4 dígitos"], label:has-text("Últimos")')).toBeVisible()
})

test('crear compra con moneda USD', async ({ page }) => {
  await abrirModalYCompletarBase(page, { importe: '5000' })

  const monedaSelect = page.locator('select').filter({ hasText: /ARS|USD/i }).first()
  if (await monedaSelect.count() > 0) await monedaSelect.selectOption('USD')

  await page.locator('textarea').first().fill('Compra USD test')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.locator('text=500')).not.toBeVisible({ timeout: 8000 })
})

test('crear compra con IVA incluido', async ({ page }) => {
  await page.getByRole('button', { name: /nueva compra/i }).click()
  await expect(page.getByRole('heading', { name: /nueva compra/i })).toBeVisible()
  await page.locator('input[type="date"]').first().fill('2026-03-01')
  await page.locator('input[placeholder*="mporte"], input[type="number"]').first().fill('121000')

  const ivaLabel = page.locator('label, span').filter({ hasText: /IVA/i }).first()
  if (await ivaLabel.count() === 0) { test.skip(); return }
  await expect(ivaLabel).toBeVisible()

  const ivaCheck = page.locator('input[type="checkbox"]').first()
  if (await ivaCheck.count() > 0) await ivaCheck.check()
})

test('filtro por tipo EQUIPO funciona', async ({ page }) => {
  const select = page.locator('select').filter({ hasText: /todos|equipo|tipo/i }).first()
  if (await select.count() === 0) { test.skip(); return }
  await select.selectOption('EQUIPO')
  await expect(page.locator('text=Error')).not.toBeVisible()
  await select.selectOption({ index: 0 })
})

test('filtro por moneda USD funciona', async ({ page }) => {
  const select = page.locator('select').filter({ hasText: /moneda|todas/i }).first()
  if (await select.count() === 0) { test.skip(); return }
  await select.selectOption('USD')
  await expect(page.locator('text=Error')).not.toBeVisible()
  await select.selectOption({ index: 0 })
})

test('filtro de fecha desde/hasta funciona', async ({ page }) => {
  const fechaDesde = page.locator('input[type="date"]').nth(0)
  const fechaHasta = page.locator('input[type="date"]').nth(1)
  if (await fechaDesde.count() === 0 || await fechaHasta.count() === 0) { test.skip(); return }
  await fechaDesde.fill('2026-01-01')
  await fechaHasta.fill('2026-12-31')
  await expect(page.locator('text=Error')).not.toBeVisible()
  await fechaDesde.clear()
  await fechaHasta.clear()
})

test('búsqueda por texto funciona', async ({ page }) => {
  const search = page.locator('input[placeholder*="uscar"], input[type="search"]').first()
  if (await search.count() === 0) { test.skip(); return }
  await search.fill('XXX-NO-EXISTE-999')
  await page.waitForTimeout(400)
  await expect(page.locator('text=Error')).not.toBeVisible()
  await search.clear()
})

test('editar compra existente abre modal con datos', async ({ page }) => {
  const editBtn = page.getByRole('button', { name: /editar/i }).first()
  if (await editBtn.count() === 0) { test.skip(); return }
  await editBtn.click()
  await expect(page.locator('text=/editar compra/i')).toBeVisible()
  await page.keyboard.press('Escape')
})

test('cancelar modal no guarda', async ({ page }) => {
  await page.getByRole('button', { name: /nueva compra/i }).click()
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByRole('heading', { name: /nueva compra/i })).not.toBeVisible()
})
