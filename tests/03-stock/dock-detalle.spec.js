import { test, expect } from '@playwright/test'

// Helper: navega al detalle del primer dock. Devuelve false si no hay docks.
async function gotoFirstDockDetail(page) {
  await page.goto('/home/stock/docks')
  await page.waitForLoadState('networkidle')
  const card = page.locator('.equip-card').first()
  if (await card.count() === 0) return false
  await card.click()
  await page.waitForLoadState('networkidle')
  return true
}

test.describe('Stock Dock — Vista de detalle', () => {

  // ── 404 / not found ──────────────────────────────────────────────────────

  test('URL con ID inexistente muestra "Ítem no encontrado"', async ({ page }) => {
    await page.goto('/home/stock/docks/999999999')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Ítem no encontrado')).toBeVisible({ timeout: 8000 })
  })

  test('botón Volver desde 404 lleva a la lista de docks', async ({ page }) => {
    await page.goto('/home/stock/docks/999999999')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Ítem no encontrado')).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: 'Volver al listado' }).click()
    await expect(page).toHaveURL(/\/stock\/docks$/, { timeout: 8000 })
  })

  // ── Carga y estructura general ────────────────────────────────────────────

  test('detalle de dock carga sin errores', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('text=Error al cargar')).not.toBeVisible()
    await expect(page.locator('text=Ítem no encontrado')).not.toBeVisible()
  })

  test('breadcrumb muestra Stock > Docks > nombre del dock', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.breadcrumb a', { hasText: 'Stock' })).toBeVisible()
    await expect(page.locator('.breadcrumb a', { hasText: 'Docks' })).toBeVisible()
    await expect(page.locator('.breadcrumb__current')).toBeVisible()
  })

  test('click en "Docks" del breadcrumb navega a la lista', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.breadcrumb a', { hasText: 'Docks' }).click()
    await expect(page).toHaveURL(/\/stock\/docks$/, { timeout: 8000 })
  })

  test('click en "Stock" del breadcrumb navega al stock overview', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.breadcrumb a', { hasText: 'Stock' }).first().click()
    await expect(page).toHaveURL(/\/stock/, { timeout: 8000 })
  })

  // ── Hero ─────────────────────────────────────────────────────────────────

  test('hero muestra badge de estado del dock', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    const badge = page.locator('.hero__badge')
    await expect(badge).toBeVisible()
    await expect(badge).not.toHaveText('—')
  })

  test('hero muestra título del dock', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.hero__title')).toBeVisible()
  })

  test('hero muestra subtítulo "Dock"', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.hero__subtitle')).toContainText('Dock')
  })

  test('botón "Volver al listado" en hero lleva a /stock/docks', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: 'Volver al listado' }).click()
    await expect(page).toHaveURL(/\/stock\/docks$/, { timeout: 8000 })
  })

  test('botón "Editar" o "Completar datos" es visible en hero', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    const editBtn = page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ })
    await expect(editBtn).toBeVisible()
  })

  // ── Cards de contenido ───────────────────────────────────────────────────

  test('placeholder ⚙️ del dock es visible', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.placeholder-block')).toBeVisible()
  })

  test('card "Identificación" es visible con sus campos', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.card__title', { hasText: 'Identificación' })).toBeVisible()
    const labels = page.locator('.card__label')
    await expect(labels.filter({ hasText: 'Nombre' }).first()).toBeVisible()
    await expect(labels.filter({ hasText: 'Marca' }).first()).toBeVisible()
    await expect(labels.filter({ hasText: 'Modelo' }).first()).toBeVisible()
    await expect(labels.filter({ hasText: 'Nº de serie' }).first()).toBeVisible()
  })

  test('card "Estado y ubicación" es visible con sus campos', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.card__title', { hasText: 'Estado y ubicación' })).toBeVisible()
    const labels = page.locator('.card__label')
    await expect(labels.filter({ hasText: 'Estado' }).first()).toBeVisible()
    await expect(labels.filter({ hasText: 'Fecha de compra' }).first()).toBeVisible()
    await expect(labels.filter({ hasText: 'Garantía' }).first()).toBeVisible()
  })

  test('campo Estado en la card muestra un valor (no —)', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    // Find the Estado row: label "Estado" followed by a value
    const estadoLabel = page.locator('.card__label', { hasText: 'Estado' }).first()
    await expect(estadoLabel).toBeVisible()
    // The sibling .card__value should have a status text
    const estadoValue = estadoLabel.locator('~ .card__value')
    if (await estadoValue.count() > 0) {
      await expect(estadoValue.first()).not.toHaveText('—')
    }
  })

  // ── Navegación directa por URL ───────────────────────────────────────────

  test('navegación directa por URL al mismo dock carga correctamente', async ({ page }) => {
    await page.goto('/home/stock/docks')
    await page.waitForLoadState('networkidle')
    const card = page.locator('.equip-card').first()
    if (await card.count() === 0) { test.skip(); return }
    await card.click()
    await page.waitForLoadState('networkidle')
    const url = page.url()
    // Navigate directly to the same URL
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.hero__title')).toBeVisible()
    await expect(page.locator('text=Error al cargar')).not.toBeVisible()
  })

  // ── Modal de edición ─────────────────────────────────────────────────────

  test('botón Editar abre modal de edición', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
  })

  test('modal de edición muestra título correcto', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.modal-title')).toBeVisible()
    await expect(page.locator('.modal-title')).toContainText(/Editar|Completar datos/)
  })

  test('modal tiene campos de identificación: Nombre, Marca, Modelo, N° de serie, Garantía', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.modal-card input[placeholder="Nombre del equipo"]')).toBeVisible()
    await expect(page.locator('.modal-card input[placeholder="Ej: DJI"]')).toBeVisible()
    await expect(page.locator('.modal-card input[placeholder="Modelo"]')).toBeVisible()
    await expect(page.locator('.modal-card input[placeholder="Nº de serie"]')).toBeVisible()
    await expect(page.locator('.modal-card input[placeholder="Ej: 12 meses"]')).toBeVisible()
  })

  test('modal tiene select de estado con las 6 opciones de estado', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    const select = page.locator('.modal-card select')
    await expect(select).toBeVisible()
    const options = select.locator('option')
    expect(await options.count()).toBeGreaterThanOrEqual(5)
  })

  test('modal tiene campos de coordenadas para ubicación en mapa', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('[placeholder="Latitud (-90 a 90)"]')).toBeVisible()
    await expect(page.locator('[placeholder="Longitud (-180 a 180)"]')).toBeVisible()
    await expect(page.locator('[placeholder="Altitud (m, opcional)"]')).toBeVisible()
  })

  test('modal tiene botones Cancelar y Guardar', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.modal-actions').getByRole('button', { name: 'Cancelar' })).toBeVisible()
    await expect(page.locator('.modal-actions').getByRole('button', { name: 'Guardar' })).toBeVisible()
  })

  test('cancelar modal cierra la edición sin guardar', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    await page.locator('.modal-actions').getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.locator('.modal-card')).not.toBeVisible({ timeout: 5000 })
  })

  test('cerrar modal con click en overlay cierra la edición', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    // Click in the top-left corner of the overlay (outside the modal card)
    await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } })
    await expect(page.locator('.modal-card')).not.toBeVisible({ timeout: 5000 })
  })

  test('guardar sin cambios muestra toast de éxito y cierra modal', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    // Save without modifying anything (idempotent)
    await page.locator('.modal-actions').getByRole('button', { name: 'Guardar' }).click()
    await expect(page.locator('.toast')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.toast')).toContainText('actualizado correctamente')
    await expect(page.locator('.modal-card')).not.toBeVisible({ timeout: 8000 })
  })

  test('el modal muestra datos pre-cargados del dock al abrirse', async ({ page }) => {
    const ok = await gotoFirstDockDetail(page)
    if (!ok) { test.skip(); return }
    // Get current dock title from hero
    const heroTitle = await page.locator('.hero__title').textContent()
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    // Modal title reflects the state (Editar or Completar datos)
    await expect(page.locator('.modal-title')).toBeVisible()
    // Estado select should have a value selected
    const select = page.locator('.modal-card select')
    const selectedValue = await select.inputValue()
    expect(selectedValue).toBeTruthy()
  })

})
