import { test, expect } from '@playwright/test'

async function gotoFirstBateriaDetail(page) {
  await page.goto('/home/stock/baterias')
  await page.waitForLoadState('networkidle')
  const card = page.locator('.equip-card').first()
  if (await card.count() === 0) return false
  await card.click()
  await page.waitForLoadState('networkidle')
  return true
}

test.describe('Stock Batería — Vista de detalle', () => {

  // ── 404 / not found ──────────────────────────────────────────────────────

  test('URL con ID inexistente muestra "Ítem no encontrado"', async ({ page }) => {
    await page.goto('/home/stock/baterias/999999999')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Ítem no encontrado')).toBeVisible({ timeout: 8000 })
  })

  test('botón Volver desde 404 lleva a la lista de baterías', async ({ page }) => {
    await page.goto('/home/stock/baterias/999999999')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Ítem no encontrado')).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: 'Volver al listado' }).click()
    await expect(page).toHaveURL(/\/stock\/baterias$/, { timeout: 8000 })
  })

  // ── Carga y estructura general ────────────────────────────────────────────

  test('detalle de batería carga sin errores', async ({ page }) => {
    const ok = await gotoFirstBateriaDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('text=Error al cargar')).not.toBeVisible()
    await expect(page.locator('text=Ítem no encontrado')).not.toBeVisible()
  })

  test('breadcrumb muestra Stock > Baterías > nombre de la batería', async ({ page }) => {
    const ok = await gotoFirstBateriaDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.breadcrumb a', { hasText: 'Stock' })).toBeVisible()
    await expect(page.locator('.breadcrumb a', { hasText: 'Baterías' })).toBeVisible()
    await expect(page.locator('.breadcrumb__current')).toBeVisible()
  })

  test('click en "Baterías" del breadcrumb navega a la lista', async ({ page }) => {
    const ok = await gotoFirstBateriaDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.breadcrumb a', { hasText: 'Baterías' }).click()
    await expect(page).toHaveURL(/\/stock\/baterias$/, { timeout: 8000 })
  })

  test('click en "Stock" del breadcrumb navega al stock overview', async ({ page }) => {
    const ok = await gotoFirstBateriaDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.breadcrumb a', { hasText: 'Stock' }).first().click()
    await expect(page).toHaveURL(/\/stock/, { timeout: 8000 })
  })

  // ── Hero ─────────────────────────────────────────────────────────────────

  test('hero muestra badge de estado de la batería', async ({ page }) => {
    const ok = await gotoFirstBateriaDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.hero__badge')).toBeVisible()
  })

  test('hero muestra título de la batería', async ({ page }) => {
    const ok = await gotoFirstBateriaDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.hero__title')).toBeVisible()
  })

  test('hero muestra subtítulo "Batería"', async ({ page }) => {
    const ok = await gotoFirstBateriaDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.hero__subtitle')).toContainText('Batería')
  })

  test('botón "Volver al listado" en hero lleva a /stock/baterias', async ({ page }) => {
    const ok = await gotoFirstBateriaDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: 'Volver al listado' }).click()
    await expect(page).toHaveURL(/\/stock\/baterias$/, { timeout: 8000 })
  })

  test('botón "Editar" o "Completar datos" es visible en hero', async ({ page }) => {
    const ok = await gotoFirstBateriaDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ })).toBeVisible()
  })

  // ── Cards de contenido ───────────────────────────────────────────────────

  test('card "Identificación" es visible con sus campos', async ({ page }) => {
    const ok = await gotoFirstBateriaDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.card__title', { hasText: 'Identificación' })).toBeVisible()
    const labels = page.locator('.card__label')
    await expect(labels.filter({ hasText: 'Nombre' }).first()).toBeVisible()
    await expect(labels.filter({ hasText: 'Marca' }).first()).toBeVisible()
  })

  test('card "Estado y ubicación" es visible', async ({ page }) => {
    const ok = await gotoFirstBateriaDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.card__title', { hasText: 'Estado y ubicación' })).toBeVisible()
  })

  // ── Navegación directa por URL ───────────────────────────────────────────

  test('navegación directa por URL a la batería carga correctamente', async ({ page }) => {
    await page.goto('/home/stock/baterias')
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

  // ── Modal de edición ─────────────────────────────────────────────────────

  test('botón Editar abre modal de edición', async ({ page }) => {
    const ok = await gotoFirstBateriaDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
  })

  test('modal tiene campos de identificación: Nombre, Marca, Modelo, Nº de serie, Garantía', async ({ page }) => {
    const ok = await gotoFirstBateriaDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.modal-card input[placeholder="Nombre del equipo"]')).toBeVisible()
    await expect(page.locator('.modal-card input[placeholder="Ej: DJI"]')).toBeVisible()
    await expect(page.locator('.modal-card input[placeholder="Modelo"]')).toBeVisible()
    await expect(page.locator('.modal-card input[placeholder="Nº de serie"]')).toBeVisible()
    await expect(page.locator('.modal-card input[placeholder="Ej: 12 meses"]')).toBeVisible()
  })

  test('modal tiene select de estado', async ({ page }) => {
    const ok = await gotoFirstBateriaDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    const select = page.locator('.modal-card select')
    await expect(select).toBeVisible()
    expect(await select.locator('option').count()).toBeGreaterThanOrEqual(5)
  })

  test('modal NO tiene campos de coordenadas (batería no tiene ubicación GPS)', async ({ page }) => {
    const ok = await gotoFirstBateriaDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('[placeholder="Latitud (-90 a 90)"]')).not.toBeVisible()
  })

  test('cancelar modal cierra la edición', async ({ page }) => {
    const ok = await gotoFirstBateriaDetail(page)
    if (!ok) { test.skip(); return }
    const editBtn = page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ })
    await expect(editBtn).toBeVisible({ timeout: 12000 })
    await editBtn.click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 10000 })
    await page.locator('.modal-actions').getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.locator('.modal-card')).not.toBeVisible({ timeout: 8000 })
  })

  test('cerrar modal con click en overlay', async ({ page }) => {
    const ok = await gotoFirstBateriaDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } })
    await expect(page.locator('.modal-card')).not.toBeVisible({ timeout: 5000 })
  })

  test('guardar sin cambios muestra toast de éxito y cierra modal', async ({ page }) => {
    const ok = await gotoFirstBateriaDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    await page.locator('.modal-actions').getByRole('button', { name: 'Guardar' }).click()
    await expect(page.locator('.toast')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.toast')).toContainText('actualizado correctamente')
    await expect(page.locator('.modal-card')).not.toBeVisible({ timeout: 8000 })
  })

})
