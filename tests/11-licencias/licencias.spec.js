import { test, expect } from '@playwright/test'

test.describe('Licencias', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/home/licencias')
    await page.waitForLoadState('networkidle')
  })

  // ── Carga ─────────────────────────────────────────────────────────────────

  test('vista de licencias carga sin errores', async ({ page }) => {
    await expect(page.locator('text=Error')).not.toBeVisible()
    await expect(page.getByRole('heading', { name: /Licencia/i })).toBeVisible({ timeout: 10000 })
  })

  test('KPI chips muestran estadísticas cuando hay licencias', async ({ page }) => {
    const cards = await page.locator('.lic-card').count()
    if (cards === 0) { test.skip(); return }
    await expect(page.locator('.kpi-chip').first()).toBeVisible()
    await expect(page.getByText('Total')).toBeVisible()
    await expect(page.getByText('Vigentes')).toBeVisible()
    await expect(page.getByText('Por vencer')).toBeVisible()
  })

  test('licencias existentes son visibles', async ({ page }) => {
    const content = page.locator('.lic-card')
      .or(page.locator('.kpi-chip'))
      .or(page.getByText(/No hay licencias/i))
      .or(page.locator('.qnt-state'))
      .first()
    await expect(content).toBeVisible({ timeout: 8000 })
  })

  test('estado vacío muestra mensaje y botón de agregar primera licencia', async ({ page }) => {
    const cards = await page.locator('.lic-card').count()
    if (cards > 0) { test.skip(); return }
    await expect(page.getByText(/No hay licencias registradas/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Agregar primera licencia/i })).toBeVisible()
  })

  // ── Modal crear ───────────────────────────────────────────────────────────

  test('botón Nueva licencia abre modal con título correcto', async ({ page }) => {
    await page.getByRole('button', { name: /Nueva licencia/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await expect(modal.getByText('Nueva licencia')).toBeVisible()
  })

  test('modal tiene todos los campos del formulario', async ({ page }) => {
    await page.getByRole('button', { name: /Nueva licencia/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await expect(modal.locator('input[placeholder="Nombre de la licencia"]')).toBeVisible()
    await expect(modal.locator('input[placeholder="Número"]')).toBeVisible()
    await expect(modal.locator('input[placeholder="Ej: 2.1.0"]')).toBeVisible()
    await expect(modal.locator('input[type="date"]').first()).toBeVisible()
    await expect(modal.locator('input[type="date"]').last()).toBeVisible()
    await expect(modal.locator('.toggle-btn')).toBeVisible()
  })

  test('botón Crear licencia deshabilitado sin nombre', async ({ page }) => {
    await page.getByRole('button', { name: /Nueva licencia/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await expect(modal.getByRole('button', { name: /Crear licencia/i })).toBeDisabled()
  })

  test('se habilita el botón Crear al escribir nombre', async ({ page }) => {
    await page.getByRole('button', { name: /Nueva licencia/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await modal.locator('input[placeholder="Nombre de la licencia"]').fill('DJI FlightHub')
    await expect(modal.getByRole('button', { name: /Crear licencia/i })).toBeEnabled()
  })

  test('toggle de estado activo/inactivo funciona', async ({ page }) => {
    await page.getByRole('button', { name: /Nueva licencia/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    const toggle = modal.locator('.toggle-btn')
    // Por defecto activa
    await expect(toggle).toHaveClass(/active/)
    // Click para desactivar
    await toggle.click()
    await expect(toggle).not.toHaveClass(/active/)
    // Click para reactivar
    await toggle.click()
    await expect(toggle).toHaveClass(/active/)
  })

  test('cerrar modal con Cancelar', async ({ page }) => {
    await page.getByRole('button', { name: /Nueva licencia/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await modal.getByRole('button', { name: /Cancelar/i }).click()
    await expect(modal).not.toBeVisible({ timeout: 5000 })
  })

  test('cerrar modal con click en overlay', async ({ page }) => {
    await page.getByRole('button', { name: /Nueva licencia/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await page.locator('.qnt-modal-overlay').last().click({ position: { x: 10, y: 10 } })
    await expect(modal).not.toBeVisible({ timeout: 5000 })
  })

  // ── Crear licencia ────────────────────────────────────────────────────────

  test('crear licencia con solo nombre muestra toast de éxito', async ({ page }) => {
    const uid = Date.now()
    await page.getByRole('button', { name: /Nueva licencia/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await modal.locator('input[placeholder="Nombre de la licencia"]').fill(`Licencia Test ${uid}`)
    await modal.getByRole('button', { name: /Crear licencia/i }).click()
    await expect(page.locator('.qnt-toast')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.qnt-toast')).toContainText(/creada/i)
    await expect(modal).not.toBeVisible({ timeout: 5000 })
  })

  test('crear licencia completa aparece en la lista', async ({ page }) => {
    const uid = Date.now()
    const nombre = `LicFull ${uid}`

    const btn = page.getByRole('button', { name: /Nueva licencia/i })
      .or(page.getByRole('button', { name: /Agregar primera licencia/i }))
      .first()
    await expect(btn).toBeVisible({ timeout: 12000 })
    await btn.click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })

    await modal.locator('input[placeholder="Nombre de la licencia"]').fill(nombre)
    await modal.locator('input[placeholder="Número"]').fill(`NUM-${uid}`)
    await modal.locator('input[placeholder="Ej: 2.1.0"]').fill('3.0.0')
    await modal.locator('input[type="date"]').first().fill('2025-01-01')
    await modal.locator('input[type="date"]').last().fill('2026-12-31')

    await modal.getByRole('button', { name: /Crear licencia/i }).click()
    await expect(page.locator('.qnt-toast')).toBeVisible({ timeout: 8000 })
    await expect(modal).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText(nombre)).toBeVisible({ timeout: 8000 })
  })

  test('crear licencia inactiva muestra badge Inactiva', async ({ page }) => {
    const uid = Date.now()
    const nombre = `LicInact ${uid}`

    await page.getByRole('button', { name: /Nueva licencia/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await modal.locator('input[placeholder="Nombre de la licencia"]').fill(nombre)
    // Desactivar toggle
    await modal.locator('.toggle-btn').click()
    await modal.getByRole('button', { name: /Crear licencia/i }).click()
    await expect(page.locator('.qnt-toast')).toBeVisible({ timeout: 8000 })
    await expect(modal).not.toBeVisible({ timeout: 5000 })
    // La card debe existir con badge Inactiva
    const card = page.locator('.lic-card').filter({ hasText: nombre })
    await expect(card).toBeVisible({ timeout: 8000 })
    await expect(card.getByText('Inactiva')).toBeVisible()
  })

  // ── Editar licencia ───────────────────────────────────────────────────────

  test('botón Editar abre modal con datos pre-cargados', async ({ page }) => {
    const card = page.locator('.lic-card').first()
    if (await card.count() === 0) { test.skip(); return }

    const nombre = await card.locator('.lic-nombre').textContent()
    await card.getByRole('button', { name: /Editar/i }).click()

    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await expect(modal.getByText('Editar licencia')).toBeVisible()
    await expect(modal.locator('input[placeholder="Nombre de la licencia"]')).toHaveValue(nombre?.trim() ?? '')
  })

  test('editar licencia guarda cambios y muestra toast', async ({ page }) => {
    const card = page.locator('.lic-card').first()
    if (await card.count() === 0) { test.skip(); return }

    await card.getByRole('button', { name: /Editar/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })

    await modal.locator('input[placeholder="Número"]').fill(`EDIT-${Date.now()}`)
    await modal.getByRole('button', { name: /Guardar cambios/i }).click()
    await expect(page.locator('.qnt-toast')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.qnt-toast')).toContainText(/actualizada/i)
  })

  test('cancelar edición no guarda cambios', async ({ page }) => {
    const card = page.locator('.lic-card').first()
    if (await card.count() === 0) { test.skip(); return }

    const original = await card.locator('.lic-nombre').textContent()
    await card.getByRole('button', { name: /Editar/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })

    await modal.locator('input[placeholder="Nombre de la licencia"]').fill('NOMBRE CANCELADO')
    await modal.getByRole('button', { name: /Cancelar/i }).click()
    await expect(modal).not.toBeVisible({ timeout: 5000 })
    await expect(card.locator('.lic-nombre')).toContainText(original?.trim() ?? '')
  })

  // ── Eliminar licencia ─────────────────────────────────────────────────────

  test('botón Eliminar abre modal de confirmación', async ({ page }) => {
    const card = page.locator('.lic-card').first()
    if (await card.count() === 0) { test.skip(); return }

    await card.getByRole('button', { name: /Eliminar/i }).click()
    await expect(page.getByRole('heading', { name: 'Eliminar licencia' })).toBeVisible({ timeout: 8000 })
    await expect(page.getByRole('button', { name: /Cancelar/i }).last()).toBeVisible()
    await expect(page.getByRole('button', { name: /^Eliminar$/i }).last()).toBeVisible()
  })

  test('cancelar eliminación cierra confirmación sin eliminar', async ({ page }) => {
    const card = page.locator('.lic-card').first()
    if (await card.count() === 0) { test.skip(); return }

    const nombre = await card.locator('.lic-nombre').textContent()
    await card.getByRole('button', { name: /Eliminar/i }).click()
    await expect(page.getByRole('heading', { name: 'Eliminar licencia' })).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: /Cancelar/i }).last().click()
    await expect(page.getByRole('heading', { name: 'Eliminar licencia' })).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText(nombre?.trim() ?? '')).toBeVisible()
  })

  test('eliminar licencia recién creada — flujo completo', async ({ page }) => {
    const uid = Date.now()
    const nombre = `BorrarLic ${uid}`

    // Crear
    await page.getByRole('button', { name: /Nueva licencia/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await modal.locator('input[placeholder="Nombre de la licencia"]').fill(nombre)
    await modal.getByRole('button', { name: /Crear licencia/i }).click()
    await expect(page.locator('.qnt-toast')).toBeVisible({ timeout: 8000 })
    await expect(modal).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText(nombre)).toBeVisible({ timeout: 8000 })

    // Eliminar
    const card = page.locator('.lic-card').filter({ hasText: nombre })
    await card.getByRole('button', { name: /Eliminar/i }).click()
    await expect(page.getByRole('heading', { name: 'Eliminar licencia' })).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: /^Eliminar$/i }).last().click()
    await expect(page.locator('.qnt-toast')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.qnt-toast')).toContainText(/eliminada/i)
    await expect(page.getByText(nombre)).not.toBeVisible({ timeout: 5000 })
  })

  // ── Badges de estado ──────────────────────────────────────────────────────

  test('cards muestran badge Activa o Inactiva', async ({ page }) => {
    const cards = await page.locator('.lic-card').count()
    if (cards === 0) { test.skip(); return }
    const badge = page.locator('.lic-card').first().locator('.qnt-badge').first()
    await expect(badge).toBeVisible()
    const text = await badge.textContent()
    expect(['Activa', 'Inactiva']).toContain(text?.trim())
  })
})
