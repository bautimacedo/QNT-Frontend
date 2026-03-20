import { test, expect } from '@playwright/test'

// Helper: navega al detalle de la primera hélice. Devuelve false si no hay hélices.
async function gotoFirstHeliceDetail(page) {
  await page.goto('/home/stock/helices')
  await page.waitForLoadState('networkidle')
  await page.locator('.qnt-spinner').waitFor({ state: 'hidden', timeout: 12000 }).catch(() => {})
  const card = page.locator('.equip-card').first()
  if (await card.count() === 0) return false
  await card.click()
  await page.waitForLoadState('networkidle')
  return true
}

test.describe('Stock Hélice — Vista de detalle', () => {

  // ── 404 / not found ──────────────────────────────────────────────────────

  test('URL con ID inexistente muestra "Ítem no encontrado"', async ({ page }) => {
    await page.goto('/home/stock/helices/999999999')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Ítem no encontrado')).toBeVisible({ timeout: 8000 })
  })

  test('botón Volver desde 404 lleva a la lista de hélices', async ({ page }) => {
    await page.goto('/home/stock/helices/999999999')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Ítem no encontrado')).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: 'Volver al listado' }).click()
    await expect(page).toHaveURL(/\/stock\/helices$/, { timeout: 8000 })
  })

  // ── Carga y estructura general ────────────────────────────────────────────

  test('detalle de hélice carga sin errores', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('text=Error al cargar')).not.toBeVisible()
    await expect(page.locator('text=Ítem no encontrado')).not.toBeVisible()
  })

  test('URL está en formato /stock/helices/:id', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page).toHaveURL(/\/stock\/helices\/\d+/)
  })

  test('breadcrumb muestra Stock > Hélices > nombre de la hélice', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.breadcrumb a', { hasText: 'Stock' })).toBeVisible()
    await expect(page.locator('.breadcrumb a', { hasText: 'Hélices' })).toBeVisible()
    await expect(page.locator('.breadcrumb__current')).toBeVisible()
  })

  test('click en "Hélices" del breadcrumb navega a la lista', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.breadcrumb a', { hasText: 'Hélices' }).click()
    await expect(page).toHaveURL(/\/stock\/helices$/, { timeout: 8000 })
  })

  test('click en "Stock" del breadcrumb navega al stock overview', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.breadcrumb a', { hasText: 'Stock' }).first().click()
    await expect(page).toHaveURL(/\/stock/, { timeout: 8000 })
  })

  // ── Hero ─────────────────────────────────────────────────────────────────

  test('hero muestra badge de estado de la hélice', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    const badge = page.locator('.hero__badge')
    await expect(badge).toBeVisible({ timeout: 8000 })
    await expect(badge).not.toHaveText('—')
  })

  test('hero muestra título de la hélice', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.hero__title')).toBeVisible({ timeout: 8000 })
  })

  test('hero muestra subtítulo "Hélice"', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.hero__subtitle')).toContainText('Hélice', { timeout: 8000 })
  })

  test('botón "Volver al listado" en hero lleva a /stock/helices', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: 'Volver al listado' }).click()
    await expect(page).toHaveURL(/\/stock\/helices$/, { timeout: 8000 })
  })

  test('botón "Editar" o "Completar datos" es visible en hero', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    const editBtn = page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ })
    await expect(editBtn).toBeVisible({ timeout: 8000 })
  })

  // ── Cards de contenido ───────────────────────────────────────────────────

  test('placeholder de hélice (🔄) es visible', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.placeholder-block')).toBeVisible({ timeout: 8000 })
  })

  test('card "Identificación" es visible con sus campos', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.card__title', { hasText: 'Identificación' })).toBeVisible({ timeout: 8000 })
    const labels = page.locator('.card__label')
    await expect(labels.filter({ hasText: 'Nombre' }).first()).toBeVisible()
    await expect(labels.filter({ hasText: 'Marca' }).first()).toBeVisible()
    await expect(labels.filter({ hasText: 'Modelo' }).first()).toBeVisible()
    await expect(labels.filter({ hasText: 'Nº de serie' }).first()).toBeVisible()
  })

  test('card "Estado y ubicación" es visible con sus campos', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await expect(page.locator('.card__title', { hasText: 'Estado y ubicación' })).toBeVisible({ timeout: 8000 })
    const labels = page.locator('.card__label')
    await expect(labels.filter({ hasText: 'Estado' }).first()).toBeVisible()
    await expect(labels.filter({ hasText: 'Fecha de compra' }).first()).toBeVisible()
    await expect(labels.filter({ hasText: 'Garantía' }).first()).toBeVisible()
  })

  test('campo Estado en la card muestra un valor válido', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    const estadoLabel = page.locator('.card__label', { hasText: 'Estado' }).first()
    await expect(estadoLabel).toBeVisible({ timeout: 8000 })
    const estadoValue = estadoLabel.locator('~ .card__value')
    if (await estadoValue.count() > 0) {
      await expect(estadoValue.first()).not.toHaveText('—')
    }
  })

  // ── Navegación directa por URL ───────────────────────────────────────────

  test('navegación directa por URL carga el detalle correctamente', async ({ page }) => {
    await page.goto('/home/stock/helices')
    await page.waitForLoadState('networkidle')
    await page.locator('.qnt-spinner').waitFor({ state: 'hidden', timeout: 12000 }).catch(() => {})
    const card = page.locator('.equip-card').first()
    if (await card.count() === 0) { test.skip(); return }
    await card.click()
    await page.waitForLoadState('networkidle')
    const url = page.url()
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.hero__title')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('text=Error al cargar')).not.toBeVisible()
  })

  // ── Modal de edición ─────────────────────────────────────────────────────

  test('botón Editar abre modal de edición', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
  })

  test('modal de edición muestra título "Editar ítem" o "Completar datos del ítem"', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.modal-title')).toBeVisible()
    await expect(page.locator('.modal-title')).toContainText(/Editar|Completar datos/)
  })

  test('modal tiene campos: Nombre, Marca, Modelo, Nº de serie, Garantía', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.modal-card input[placeholder="Nombre del equipo"]')).toBeVisible()
    await expect(page.locator('.modal-card input[placeholder="Ej: DJI"]')).toBeVisible()
    await expect(page.locator('.modal-card input[placeholder="Modelo"]')).toBeVisible()
    await expect(page.locator('.modal-card input[placeholder="Nº de serie"]')).toBeVisible()
    await expect(page.locator('.modal-card input[placeholder="Ej: 12 meses"]')).toBeVisible()
  })

  test('modal tiene select de estado con las opciones de estado', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    const select = page.locator('.modal-card select')
    await expect(select).toBeVisible()
    const options = select.locator('option')
    expect(await options.count()).toBeGreaterThanOrEqual(5)
  })

  test('modal tiene botones Cancelar y Guardar', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.modal-actions').getByRole('button', { name: 'Cancelar' })).toBeVisible()
    await expect(page.locator('.modal-actions').getByRole('button', { name: 'Guardar' })).toBeVisible()
  })

  test('cancelar modal cierra sin guardar', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    await page.locator('.modal-actions').getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.locator('.modal-card')).not.toBeVisible({ timeout: 5000 })
  })

  test('cerrar modal con click en overlay cierra la edición', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } })
    await expect(page.locator('.modal-card')).not.toBeVisible({ timeout: 5000 })
  })

  test('guardar sin cambios muestra toast de éxito y cierra modal', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    await page.locator('.modal-actions').getByRole('button', { name: 'Guardar' }).click()
    await expect(page.locator('.toast')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.toast')).toContainText('actualizado correctamente')
    await expect(page.locator('.modal-card')).not.toBeVisible({ timeout: 8000 })
  })

  test('modal muestra datos pre-cargados (estado seleccionado) al abrirse', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    const select = page.locator('.modal-card select')
    const selectedValue = await select.inputValue()
    expect(selectedValue).toBeTruthy()
  })

  test('editar marca y guardar actualiza el valor y muestra toast', async ({ page }) => {
    const ok = await gotoFirstHeliceDetail(page)
    if (!ok) { test.skip(); return }
    await page.locator('.hero__actions').getByRole('button', { name: /Editar|Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    const marcaInput = page.locator('.modal-card input[placeholder="Ej: DJI"]')
    await marcaInput.clear()
    await marcaInput.fill(`DJI-TEST-${Date.now()}`)
    await page.locator('.modal-actions').getByRole('button', { name: 'Guardar' }).click()
    await expect(page.locator('.toast')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.toast')).toContainText('actualizado correctamente')
  })

  test('estado NO_LLEGO muestra banner de advertencia "pendiente de llegada"', async ({ page }) => {
    // Navegar al detalle del primer item con estado NO_LLEGO si existe
    await page.goto('/home/stock/helices')
    await page.waitForLoadState('networkidle')
    await page.locator('.qnt-spinner').waitFor({ state: 'hidden', timeout: 12000 }).catch(() => {})
    const cards = page.locator('.equip-card')
    const count = await cards.count()
    if (count === 0) { test.skip(); return }
    // Intentar encontrar una hélice con estado NO_LLEGO filtrando
    await page.locator('select').first().selectOption('NO_LLEGO')
    await page.waitForTimeout(300)
    const filteredCards = page.locator('.equip-card')
    if (await filteredCards.count() === 0) { test.skip(); return }
    await filteredCards.first().click()
    await page.waitForLoadState('networkidle')
    // Debería mostrar el banner de pendiente de llegada
    await expect(page.locator('.banner-nollegó')).toBeVisible({ timeout: 8000 })
  })

  test('modal en estado NO_LLEGO muestra banner informativo', async ({ page }) => {
    await page.goto('/home/stock/helices')
    await page.waitForLoadState('networkidle')
    await page.locator('.qnt-spinner').waitFor({ state: 'hidden', timeout: 12000 }).catch(() => {})
    await page.locator('select').first().selectOption('NO_LLEGO')
    await page.waitForTimeout(300)
    const cards = page.locator('.equip-card')
    if (await cards.count() === 0) { test.skip(); return }
    await cards.first().click()
    await page.waitForLoadState('networkidle')
    await page.locator('.hero__actions').getByRole('button', { name: /Completar datos/ }).click()
    await expect(page.locator('.modal-card')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.modal-banner--info')).toBeVisible({ timeout: 5000 })
  })

})
