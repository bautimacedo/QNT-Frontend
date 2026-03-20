import { test, expect } from '@playwright/test'

test.describe('Perfil Piloto (mi perfil)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/home/perfil-piloto')
    await page.waitForLoadState('networkidle')
  })

  test('vista carga sin errores', async ({ page }) => {
    await expect(page.locator('text=Error al cargar')).not.toBeVisible()
    await expect(page.locator('.page-title')).toBeVisible({ timeout: 8000 })
  })

  test('título Perfil Piloto es visible', async ({ page }) => {
    await expect(page.locator('.page-title')).toContainText('Perfil Piloto', { timeout: 8000 })
  })

  test('sección Información de vuelo es visible para admin', async ({ page }) => {
    await expect(page.locator('.card__title').filter({ hasText: /Información de vuelo/i })).toBeVisible({ timeout: 8000 })
  })

  test('campos de vuelo son visibles — Horas, Vuelos, CMA, Password', async ({ page }) => {
    await expect(page.locator('.info-label').filter({ hasText: /Horas de vuelo/i })).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.info-label').filter({ hasText: /Cantidad de vuelos/i })).toBeVisible()
    await expect(page.locator('.info-label').filter({ hasText: /CMA Vencimiento/i })).toBeVisible()
    await expect(page.locator('.info-label').filter({ hasText: /Password de misión/i })).toBeVisible()
  })

  test('sección Licencias ANAC es visible', async ({ page }) => {
    await expect(page.locator('.card__title').filter({ hasText: /Licencias ANAC/i })).toBeVisible({ timeout: 8000 })
  })

  test('botón Agregar licencia está visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Agregar licencia/i }).first()).toBeVisible({ timeout: 8000 })
  })

  test('estado de licencias: tabla o mensaje vacío es visible', async ({ page }) => {
    const hasTable = await page.locator('.data-table').isVisible({ timeout: 5000 }).catch(() => false)
    const hasEmpty = await page.locator('text=No tenés licencias cargadas').isVisible({ timeout: 5000 }).catch(() => false)
    expect(hasTable || hasEmpty).toBeTruthy()
  })

  test('tabla de licencias muestra columnas correctas si hay licencias', async ({ page }) => {
    const hasTable = await page.locator('.data-table').isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasTable) { test.skip(); return }
    const headers = page.locator('.data-table th')
    await expect(headers.filter({ hasText: 'Vto. CMA' })).toBeVisible()
    await expect(headers.filter({ hasText: 'Emisión' })).toBeVisible()
    await expect(headers.filter({ hasText: 'Estado' })).toBeVisible()
    await expect(headers.filter({ hasText: 'Imágenes' })).toBeVisible()
    await expect(headers.filter({ hasText: 'Acciones' })).toBeVisible()
  })

  test('botón Agregar licencia abre modal', async ({ page }) => {
    await page.getByRole('button', { name: /Agregar licencia/i }).first().click()
    const modal = page.locator('.modal-card').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await expect(modal.locator('.modal-title')).toContainText('Agregar licencia ANAC')
  })

  test('modal de licencia tiene campos Fecha vencimiento CMA y Fecha de emisión', async ({ page }) => {
    await page.getByRole('button', { name: /Agregar licencia/i }).first().click()
    const modal = page.locator('.modal-card').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await expect(modal.locator('input[type="date"]').first()).toBeVisible()
    await expect(modal.locator('input[type="date"]').nth(1)).toBeVisible()
    await expect(modal.locator('input[type="checkbox"]')).toBeVisible()
  })

  test('modal de licencia tiene botones Cancelar y Guardar', async ({ page }) => {
    await page.getByRole('button', { name: /Agregar licencia/i }).first().click()
    const modal = page.locator('.modal-card').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await expect(modal.getByRole('button', { name: /Cancelar/i })).toBeVisible()
    await expect(modal.getByRole('button', { name: /Guardar/i })).toBeVisible()
  })

  test('cancelar modal de licencia cierra sin guardar', async ({ page }) => {
    await page.getByRole('button', { name: /Agregar licencia/i }).first().click()
    const modal = page.locator('.modal-card').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await modal.getByRole('button', { name: /Cancelar/i }).click()
    await expect(modal).not.toBeVisible({ timeout: 5000 })
  })

  test('cerrar modal de licencia con click en overlay', async ({ page }) => {
    await page.getByRole('button', { name: /Agregar licencia/i }).first().click()
    const overlay = page.locator('.modal-overlay').last()
    await expect(overlay).toBeVisible({ timeout: 8000 })
    await overlay.click({ position: { x: 5, y: 5 } })
    await expect(overlay).not.toBeVisible({ timeout: 5000 })
  })

  test('crear licencia con fechas muestra toast de éxito', async ({ page }) => {
    await page.getByRole('button', { name: /Agregar licencia/i }).first().click()
    const modal = page.locator('.modal-card').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    // Completar campos de fecha
    const inputs = modal.locator('input[type="date"]')
    await inputs.first().fill('2027-12-31')
    await inputs.nth(1).fill('2024-01-15')
    await modal.getByRole('button', { name: /Guardar/i }).click()
    await expect(page.locator('.toast')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.toast')).toContainText(/Licencia ANAC/i)
  })

  test('checkbox Licencia activa está marcado por defecto', async ({ page }) => {
    await page.getByRole('button', { name: /Agregar licencia/i }).first().click()
    const modal = page.locator('.modal-card').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    const checkbox = modal.locator('input[type="checkbox"]')
    await expect(checkbox).toBeChecked()
  })

  test('licencia creada aparece en la tabla con badge Activa', async ({ page }) => {
    const ts = Date.now()
    // Crear licencia
    await page.getByRole('button', { name: /Agregar licencia/i }).first().click()
    const modal = page.locator('.modal-card').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    const inputs = modal.locator('input[type="date"]')
    await inputs.first().fill('2028-06-30')
    await inputs.nth(1).fill('2024-03-01')
    await modal.getByRole('button', { name: /Guardar/i }).click()
    await expect(page.locator('.toast')).toBeVisible({ timeout: 8000 })
    // Tabla debe aparecer o ya existir
    await expect(page.locator('.data-table')).toBeVisible({ timeout: 5000 })
    // La licencia activa debe mostrar badge Activa
    const badges = page.locator('.data-table tbody .badge').filter({ hasText: /Activa/i })
    await expect(badges.first()).toBeVisible({ timeout: 5000 })
  })

  test('botón Editar en fila de licencia abre modal con datos pre-cargados', async ({ page }) => {
    const hasTable = await page.locator('.data-table').isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasTable) { test.skip(); return }
    const editBtn = page.locator('.data-table .btn-action').filter({ hasText: /Editar/i }).first()
    if (await editBtn.count() === 0) { test.skip(); return }
    await editBtn.click()
    const modal = page.locator('.modal-card').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await expect(modal.locator('.modal-title')).toContainText('Editar licencia ANAC')
  })

  test('botón Eliminar en fila abre modal de confirmación', async ({ page }) => {
    const hasTable = await page.locator('.data-table').isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasTable) { test.skip(); return }
    const delBtn = page.locator('.data-table .btn-action--danger').first()
    if (await delBtn.count() === 0) { test.skip(); return }
    await delBtn.click()
    const modal = page.locator('.modal-card').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await expect(modal.locator('.modal-title')).toContainText('Eliminar licencia')
  })

  test('cancelar eliminación cierra confirmación sin eliminar', async ({ page }) => {
    const hasTable = await page.locator('.data-table').isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasTable) { test.skip(); return }
    const rowCount = await page.locator('.data-table tbody tr').count()
    const delBtn = page.locator('.data-table .btn-action--danger').first()
    if (await delBtn.count() === 0) { test.skip(); return }
    await delBtn.click()
    const modal = page.locator('.modal-card').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await modal.getByRole('button', { name: /Cancelar/i }).click()
    await expect(modal).not.toBeVisible({ timeout: 5000 })
    // Misma cantidad de filas
    await expect(page.locator('.data-table tbody tr')).toHaveCount(rowCount)
  })

  test('botón Ver imágenes abre modal de imágenes', async ({ page }) => {
    const hasTable = await page.locator('.data-table').isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasTable) { test.skip(); return }
    const imgBtn = page.locator('.data-table .btn-action').filter({ hasText: /Ver imágenes/i }).first()
    if (await imgBtn.count() === 0) { test.skip(); return }
    await imgBtn.click()
    const modal = page.locator('.modal-card--wide').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await expect(modal.locator('.modal-title')).toContainText('Imágenes de licencia')
    await expect(modal.locator('.image-section__title').filter({ hasText: /Imagen CMA/i })).toBeVisible()
    await expect(modal.locator('.image-section__title').filter({ hasText: /Certificado de Idoneidad/i })).toBeVisible()
  })

  test('flujo completo: crear y eliminar licencia', async ({ page }) => {
    // Crear licencia
    await page.getByRole('button', { name: /Agregar licencia/i }).first().click()
    const modal = page.locator('.modal-card').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    const inputs = modal.locator('input[type="date"]')
    await inputs.first().fill('2029-03-31')
    await modal.getByRole('button', { name: /Guardar/i }).click()
    await expect(page.locator('.toast')).toBeVisible({ timeout: 8000 })

    // Esperar que la tabla aparezca (loadLicencias es async)
    await expect(page.locator('.data-table')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.data-table tbody tr').first()).toBeVisible({ timeout: 8000 })

    // Eliminar la última licencia creada
    const delBtn = page.locator('.data-table .btn-action--danger').last()
    await delBtn.click()
    const confirmModal = page.locator('.modal-card').last()
    await expect(confirmModal).toBeVisible({ timeout: 8000 })
    await confirmModal.getByRole('button', { name: /Eliminar/i }).click()
    await expect(page.locator('.toast')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.toast')).toContainText(/eliminada/i)
  })

  test('Mi Perfil en sidebar administración está visible y navega correctamente', async ({ page }) => {
    await page.goto('/home/pilotos')
    await page.waitForLoadState('networkidle')
    const miPerfil = page.locator('.sidebar__item').filter({ hasText: /Mi Perfil/i })
    if (await miPerfil.count() === 0) { test.skip(); return }
    await miPerfil.click()
    await expect(page).toHaveURL(/\/home\/mi-perfil/, { timeout: 8000 })
  })
})
