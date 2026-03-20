import { test, expect } from '@playwright/test'

async function gotoFirstAccesorioDetail(page) {
  await page.goto('/home/stock/accesorios')
  await page.waitForLoadState('networkidle')
  const card = page.locator('.equip-card').first()
  if (await card.count() === 0) return false
  await card.click()
  await page.waitForLoadState('networkidle')
  return true
}

test.describe('Stock Accesorio — Vista de detalle', () => {

  // ── 404 / not found ──────────────────────────────────────────────────────

  test('URL con ID inexistente muestra "Ítem no encontrado"', async ({ page }) => {
    await page.goto('/home/stock/accesorios/999999999')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Ítem no encontrado')).toBeVisible({ timeout: 8000 })
  })

  test('botón Volver desde 404 lleva a la lista de accesorios', async ({ page }) => {
    await page.goto('/home/stock/accesorios/999999999')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Ítem no encontrado')).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: 'Volver al listado' }).click()
    await expect(page).toHaveURL(/\/stock\/accesorios$/, { timeout: 8000 })
  })

  // ── Carga y estructura general ────────────────────────────────────────────

  test('detalle de accesorio carga sin errores', async ({ page }) => {
    const ok = await gotoFirstAccesorioDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('text=Error al cargar')).not.toBeVisible()
    await expect(page.locator('text=Ítem no encontrado')).not.toBeVisible()
  })

  test('breadcrumb muestra Stock > Accesorios > nombre del accesorio', async ({ page }) => {
    const ok = await gotoFirstAccesorioDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.breadcrumb a', { hasText: 'Stock' })).toBeVisible()
    await expect(page.locator('.breadcrumb a', { hasText: 'Accesorios' })).toBeVisible()
    await expect(page.locator('.breadcrumb__current')).toBeVisible()
  })

  test('click en "Accesorios" del breadcrumb navega a la lista', async ({ page }) => {
    const ok = await gotoFirstAccesorioDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.breadcrumb a', { hasText: 'Accesorios' }).click()
    await expect(page).toHaveURL(/\/stock\/accesorios$/, { timeout: 8000 })
  })

  test('click en "Stock" del breadcrumb navega al stock overview', async ({ page }) => {
    const ok = await gotoFirstAccesorioDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.breadcrumb a', { hasText: 'Stock' }).first().click()
    await expect(page).toHaveURL(/\/stock/, { timeout: 8000 })
  })

  // ── Hero ─────────────────────────────────────────────────────────────────

  test('hero muestra título del accesorio', async ({ page }) => {
    const ok = await gotoFirstAccesorioDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.hero__title')).toBeVisible()
  })

  test('hero muestra subtítulo "Accesorio"', async ({ page }) => {
    const ok = await gotoFirstAccesorioDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.hero__subtitle')).toContainText('Accesorio')
  })

  test('hero muestra badge de estado', async ({ page }) => {
    const ok = await gotoFirstAccesorioDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.hero__badge')).toBeVisible()
  })

  test('botón "Volver al listado" lleva a /stock/accesorios', async ({ page }) => {
    const ok = await gotoFirstAccesorioDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: 'Volver al listado' }).click()
    await expect(page).toHaveURL(/\/stock\/accesorios$/, { timeout: 8000 })
  })

  test('NO hay botón Editar en accesorio (solo lectura)', async ({ page }) => {
    const ok = await gotoFirstAccesorioDetail(page)
    if (!ok) { test.skip(); return }
    const editBtn = page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ })
    await expect(editBtn).not.toBeVisible()
  })

  // ── Cards de contenido ───────────────────────────────────────────────────

  test('card "Identificación" es visible', async ({ page }) => {
    const ok = await gotoFirstAccesorioDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.card__title', { hasText: 'Identificación' })).toBeVisible()
  })

  test('card "Estado y ubicación" es visible', async ({ page }) => {
    const ok = await gotoFirstAccesorioDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.card__title', { hasText: 'Estado y ubicación' })).toBeVisible()
  })

  test('campos de identificación son visibles', async ({ page }) => {
    const ok = await gotoFirstAccesorioDetail(page)
    if (!ok) { test.skip(); return }
    const labels = page.locator('.card__label')
    await expect(labels.filter({ hasText: 'Nombre' }).first()).toBeVisible()
    await expect(labels.filter({ hasText: 'Estado' }).first()).toBeVisible()
  })

  // ── Navegación directa por URL ───────────────────────────────────────────

  test('navegación directa por URL carga correctamente', async ({ page }) => {
    await page.goto('/home/stock/accesorios')
    await page.waitForLoadState('networkidle')
    const card = page.locator('.equip-card').first()
    if (await card.count() === 0) { test.skip(); return }
    await card.click()
    await page.waitForLoadState('networkidle')
    const url = page.url()
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.hero__title')).toBeVisible()
    await expect(page.locator('text=Error al cargar')).not.toBeVisible()
  })

})
