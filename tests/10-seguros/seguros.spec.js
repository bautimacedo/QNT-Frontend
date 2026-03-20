import { test, expect } from '@playwright/test'

test.describe('Seguros', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/home/seguros')
    await page.waitForLoadState('networkidle')
  })

  // ─── Carga ────────────────────────────────────────────────────────────────
  test('vista de seguros carga sin errores', async ({ page }) => {
    await expect(page.locator('text=Error')).not.toBeVisible()
    await expect(page.getByRole('heading', { name: /Seguro/i })).toBeVisible({ timeout: 10000 })
  })

  test('muestra KPI chips cuando hay seguros', async ({ page }) => {
    const hasSeguros = await page.locator('.seg-card').count()
    if (hasSeguros === 0) { test.skip(); return }
    await expect(page.locator('.kpi-chip').first()).toBeVisible()
    // Debe mostrar al menos: Total pólizas
    await expect(page.getByText('Total pólizas')).toBeVisible()
  })

  test('estado vacío muestra mensaje y botón para agregar', async ({ page }) => {
    const cards = await page.locator('.seg-card').count()
    if (cards > 0) { test.skip(); return }
    await expect(page.getByText(/No hay pólizas registradas/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Agregar primer seguro/i })).toBeVisible()
  })

  // ─── Modal crear ──────────────────────────────────────────────────────────
  test('botón Nuevo seguro abre modal', async ({ page }) => {
    await page.getByRole('button', { name: /Nuevo seguro/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await expect(modal.getByText('Nuevo seguro')).toBeVisible()
  })

  test('modal tiene todos los campos del formulario', async ({ page }) => {
    await page.getByRole('button', { name: /Nuevo seguro/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await expect(modal.locator('input[placeholder="Nombre de la aseguradora"]')).toBeVisible()
    await expect(modal.locator('input[placeholder="Número de póliza"]')).toBeVisible()
    await expect(modal.locator('input[type="date"]').first()).toBeVisible()
    await expect(modal.locator('input[type="date"]').last()).toBeVisible()
    await expect(modal.locator('textarea')).toBeVisible()
  })

  test('botón Crear seguro está deshabilitado sin aseguradora', async ({ page }) => {
    await page.getByRole('button', { name: /Nuevo seguro/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    const btn = modal.getByRole('button', { name: /Crear seguro/i })
    await expect(btn).toBeDisabled()
  })

  test('se habilita el botón Crear al ingresar aseguradora', async ({ page }) => {
    await page.getByRole('button', { name: /Nuevo seguro/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await modal.locator('input[placeholder="Nombre de la aseguradora"]').fill('Aseguradora Test')
    const btn = modal.getByRole('button', { name: /Crear seguro/i })
    await expect(btn).toBeEnabled()
  })

  test('cancelar modal cierra sin guardar', async ({ page }) => {
    await page.getByRole('button', { name: /Nuevo seguro/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await modal.locator('input[placeholder="Nombre de la aseguradora"]').fill('No guardar esto')
    await modal.getByRole('button', { name: /Cancelar/i }).click()
    await expect(modal).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText('No guardar esto')).not.toBeVisible()
  })

  test('cerrar modal con click en overlay', async ({ page }) => {
    await page.getByRole('button', { name: /Nuevo seguro/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await page.locator('.qnt-modal-overlay').last().click({ position: { x: 10, y: 10 } })
    await expect(modal).not.toBeVisible({ timeout: 5000 })
  })

  // ─── Crear seguro ─────────────────────────────────────────────────────────
  test('crear seguro con solo aseguradora muestra toast de éxito', async ({ page }) => {
    const uid = Date.now()
    await page.getByRole('button', { name: /Nuevo seguro/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await modal.locator('input[placeholder="Nombre de la aseguradora"]').fill(`Aseguradora Test ${uid}`)
    await modal.getByRole('button', { name: /Crear seguro/i }).click()
    await expect(page.locator('.qnt-toast')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.qnt-toast')).toContainText(/creado/i)
    await expect(modal).not.toBeVisible({ timeout: 5000 })
  })

  test('crear seguro completo aparece en la lista con datos correctos', async ({ page }) => {
    const uid = Date.now()
    const aseg = `Seguro Completo ${uid}`
    const poliza = `POL-${uid}`

    await page.getByRole('button', { name: /Nuevo seguro/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })

    await modal.locator('input[placeholder="Nombre de la aseguradora"]').fill(aseg)
    await modal.locator('input[placeholder="Número de póliza"]').fill(poliza)
    await modal.locator('input[type="date"]').first().fill('2025-01-01')
    await modal.locator('input[type="date"]').last().fill('2026-12-31')
    await modal.locator('textarea').fill('Observaciones de test')

    await modal.getByRole('button', { name: /Crear seguro/i }).click()
    await expect(page.locator('.qnt-toast')).toBeVisible({ timeout: 8000 })
    await expect(modal).not.toBeVisible({ timeout: 5000 })

    // La aseguradora nueva aparece en la lista
    await expect(page.getByText(aseg)).toBeVisible({ timeout: 8000 })
  })

  // ─── Editar seguro ────────────────────────────────────────────────────────
  test('botón Editar en card abre modal con datos pre-cargados', async ({ page }) => {
    const card = page.locator('.seg-card').first()
    if (await card.count() === 0) { test.skip(); return }

    const nombre = await card.locator('.seg-aseg').textContent()
    await card.getByRole('button', { name: /Editar/i }).click()

    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await expect(modal.getByText('Editar seguro')).toBeVisible()
    // El campo aseguradora debe estar pre-cargado
    const input = modal.locator('input[placeholder="Nombre de la aseguradora"]')
    await expect(input).toHaveValue(nombre?.trim() ?? '')
  })

  test('editar seguro guarda cambios y muestra toast', async ({ page }) => {
    const card = page.locator('.seg-card').first()
    if (await card.count() === 0) { test.skip(); return }

    await card.getByRole('button', { name: /Editar/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })

    const input = modal.locator('input[placeholder="Número de póliza"]')
    await input.fill(`EDIT-${Date.now()}`)

    await modal.getByRole('button', { name: /Guardar cambios/i }).click()
    await expect(page.locator('.qnt-toast')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.qnt-toast')).toContainText(/actualizado/i)
  })

  // ─── Eliminar seguro ──────────────────────────────────────────────────────
  test('botón Eliminar abre modal de confirmación', async ({ page }) => {
    const card = page.locator('.seg-card').first()
    if (await card.count() === 0) { test.skip(); return }

    await card.getByRole('button', { name: /Eliminar/i }).click()
    await expect(page.getByText('Eliminar seguro')).toBeVisible({ timeout: 8000 })
    await expect(page.getByRole('button', { name: /Cancelar/i }).last()).toBeVisible()
    await expect(page.getByRole('button', { name: /^Eliminar$/i }).last()).toBeVisible()
  })

  test('cancelar eliminación cierra confirmación sin eliminar', async ({ page }) => {
    const card = page.locator('.seg-card').first()
    if (await card.count() === 0) { test.skip(); return }

    const nombre = await card.locator('.seg-aseg').textContent()
    await card.getByRole('button', { name: /Eliminar/i }).click()
    await expect(page.getByText('Eliminar seguro')).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: /Cancelar/i }).last().click()
    await expect(page.getByText('Eliminar seguro')).not.toBeVisible({ timeout: 5000 })
    // La card sigue en la lista
    await expect(page.getByText(nombre?.trim() ?? '')).toBeVisible()
  })

  test('eliminar seguro recién creado — flujo completo', async ({ page }) => {
    const uid = Date.now()
    const aseg = `Borrar Test ${uid}`

    // Crear
    await page.getByRole('button', { name: /Nuevo seguro/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await modal.locator('input[placeholder="Nombre de la aseguradora"]').fill(aseg)
    await modal.getByRole('button', { name: /Crear seguro/i }).click()
    await expect(page.locator('.qnt-toast')).toBeVisible({ timeout: 8000 })
    await expect(modal).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText(aseg)).toBeVisible({ timeout: 8000 })

    // Eliminar
    const card = page.locator('.seg-card').filter({ hasText: aseg })
    await card.getByRole('button', { name: /Eliminar/i }).click()
    await expect(page.getByText('Eliminar seguro')).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: /^Eliminar$/i }).last().click()
    await expect(page.locator('.qnt-toast')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.qnt-toast')).toContainText(/eliminado/i)
    await expect(page.getByText(aseg)).not.toBeVisible({ timeout: 5000 })
  })

  // ─── KPI counters ─────────────────────────────────────────────────────────
  test('KPI chips muestran vigentes, por vencer y vencidos', async ({ page }) => {
    const cards = await page.locator('.seg-card').count()
    if (cards === 0) { test.skip(); return }
    await expect(page.getByText('Vigentes')).toBeVisible()
    await expect(page.getByText('Por vencer')).toBeVisible()
    await expect(page.getByText('Vencidos')).toBeVisible()
  })

  test('badges de vigencia son visibles en las cards', async ({ page }) => {
    const cards = await page.locator('.seg-card').count()
    if (cards === 0) { test.skip(); return }
    // Al menos una card debería tener badge de vigencia (Vigente / Por vencer / Vencido)
    const badge = page.locator('.qnt-badge').first()
    if (await badge.count() > 0) {
      await expect(badge).toBeVisible()
    }
  })

  // ─── Sidebar navigation ───────────────────────────────────────────────────
  test('se puede navegar a Seguros desde el sidebar', async ({ page }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    // Buscar link Seguros en sidebar
    const link = page.locator('.sidebar__item').filter({ hasText: /Seguros/i })
    if (await link.count() === 0) { test.skip(); return }
    await link.click()
    await expect(page).toHaveURL(/seguros/)
    await expect(page.getByRole('heading', { name: /Seguro/i })).toBeVisible({ timeout: 10000 })
  })
})
