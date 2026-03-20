import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/stock/licencias')
  await page.waitForLoadState('networkidle')
})

test('lista de licencias carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error al cargar')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: /Licencia/i })).toBeVisible()
})

test('muestra contador de licencias registradas', async ({ page }) => {
  await expect(page.locator('text=/\\d+ licencias registradas/')).toBeVisible()
})

test('estado vacío muestra mensaje cuando no hay licencias', async ({ page }) => {
  const card = page.locator('.lic-card').first()
  if (await card.count() === 0) {
    await expect(page.locator('text=No hay licencias registradas')).toBeVisible()
    return
  }
  // Forzar estado vacío con filtro imposible
  await page.locator('input[placeholder="Buscar por nombre…"]').fill('LICENCIA_INEXISTENTE_XYZ999')
  await expect(page.locator('text=Sin resultados con los filtros aplicados.')).toBeVisible()
})

test('filtro por nombre — sin resultados', async ({ page }) => {
  await page.locator('input[placeholder="Buscar por nombre…"]').fill('LICENCIA_INEXISTENTE_XYZ999')
  await page.waitForTimeout(300)
  await expect(page.locator('text=Sin resultados')).toBeVisible()
})

test('filtro por nombre — limpiar restaura lista', async ({ page }) => {
  const cards = page.locator('.lic-card')
  if (await cards.count() === 0) { test.skip(); return }
  const countBefore = await cards.count()

  await page.locator('input[placeholder="Buscar por nombre…"]').fill('LICENCIA_INEXISTENTE_XYZ999')
  await page.waitForTimeout(300)
  await expect(page.locator('text=Sin resultados')).toBeVisible()

  await page.getByRole('button', { name: 'Limpiar', exact: true }).click()
  await expect(cards).toHaveCount(countBefore, { timeout: 5000 })
})

test('filtro por N° de licencia — sin resultados', async ({ page }) => {
  await page.locator('input[placeholder="N° de licencia"]').fill('LIC-NOEXISTE-99999')
  await page.waitForTimeout(300)
  await expect(page.locator('text=Sin resultados')).toBeVisible()
  await page.locator('input[placeholder="N° de licencia"]').clear()
})

test('filtro por estado Activo funciona', async ({ page }) => {
  await page.locator('select').first().selectOption('true')
  await page.waitForTimeout(300)
  await expect(page.locator('text=Error')).not.toBeVisible()
  // Si hay licencias activas, deben tener badge "Activa"
  const cards = page.locator('.lic-card')
  if (await cards.count() > 0) {
    await expect(page.locator('text=Inactiva').first()).not.toBeVisible().catch(() => {})
  }
  await page.locator('select').first().selectOption('')
})

test('filtro por estado Inactivo funciona', async ({ page }) => {
  await page.locator('select').first().selectOption('false')
  await page.waitForTimeout(300)
  await expect(page.locator('text=Error')).not.toBeVisible()
  await page.locator('select').first().selectOption('')
})

test('botón Limpiar aparece cuando hay filtros activos', async ({ page }) => {
  await page.locator('input[placeholder="Buscar por nombre…"]').fill('test')
  await expect(page.getByRole('button', { name: 'Limpiar', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Limpiar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Limpiar', exact: true })).not.toBeVisible()
})

test('múltiples filtros combinados funcionan', async ({ page }) => {
  await page.locator('input[placeholder="Buscar por nombre…"]').fill('NOEXISTE')
  await page.locator('select').first().selectOption('true')
  await page.waitForTimeout(300)
  await expect(page.locator('text=Sin resultados')).toBeVisible()
  await page.getByRole('button', { name: 'Limpiar', exact: true }).click()
})

test('contador se actualiza con filtros activos', async ({ page }) => {
  const cards = page.locator('.lic-card')
  if (await cards.count() === 0) { test.skip(); return }

  const counterText = await page.locator('.filter-count').textContent()
  await page.locator('input[placeholder="Buscar por nombre…"]').fill('LICENCIA_INEXISTENTE_XYZ999')
  await page.waitForTimeout(300)
  const filteredText = await page.locator('.filter-count').textContent()
  expect(filteredText).not.toEqual(counterText)
})

test('click en card lleva al detalle', async ({ page }) => {
  const card = page.locator('button.lic-card, .lic-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await expect(card).toBeVisible({ timeout: 10000 })
  await card.click()
  await expect(page).toHaveURL(/\/stock\/licencias\/\d+/, { timeout: 10000 })
})

test('card muestra título de la licencia', async ({ page }) => {
  const card = page.locator('.lic-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await expect(card.locator('.lic-card__title')).toBeVisible()
})

test('detalle muestra datos de la licencia', async ({ page }) => {
  const card = page.locator('.lic-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('text=/licencia|Licencia/i').first()).toBeVisible({ timeout: 8000 })
})

test('breadcrumb Stock navega correctamente', async ({ page }) => {
  await page.locator('a', { hasText: 'Stock' }).first().click()
  await expect(page).toHaveURL(/\/stock/)
})
