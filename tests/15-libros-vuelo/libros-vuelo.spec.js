import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/logs')
  await page.waitForLoadState('networkidle')
})

test('vista libros de vuelo carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: /Libro|Vuelo|Log/i })).toBeVisible()
})

test('stats cards son visibles', async ({ page }) => {
  await expect(page.locator('.lb-stat').first()).toBeVisible({ timeout: 8000 })
  await expect(page.locator('.lb-stat__label').filter({ hasText: /Total registros/i })).toBeVisible()
  await expect(page.locator('.lb-stat__label').filter({ hasText: /Vuelos/i })).toBeVisible()
  await expect(page.locator('.lb-stat__label').filter({ hasText: /Incidentes/i })).toBeVisible()
})

test('botón nuevo registro abre modal', async ({ page }) => {
  await page.getByRole('button', { name: /Nuevo registro/i }).click()
  const modal = page.locator('.qnt-modal').last()
  await expect(modal).toBeVisible({ timeout: 8000 })
  await expect(modal.locator('.qnt-modal__title')).toContainText(/Nuevo registro/i)
})

test('guardar log sin campos requeridos muestra error', async ({ page }) => {
  await page.getByRole('button', { name: /Nuevo registro/i }).click()
  const modal = page.locator('.qnt-modal').last()
  await expect(modal).toBeVisible({ timeout: 8000 })
  // No completar entidadTipo ni entidadId
  await modal.getByRole('button', { name: /Guardar/i }).click()
  await expect(page.locator('.qnt-toast')).toBeVisible({ timeout: 5000 })
})

test('cancelar modal de nuevo registro cierra sin guardar', async ({ page }) => {
  await page.getByRole('button', { name: /Nuevo registro/i }).click()
  const modal = page.locator('.qnt-modal').last()
  await expect(modal).toBeVisible({ timeout: 8000 })
  await modal.getByRole('button', { name: /Cancelar/i }).click()
  await expect(modal).not.toBeVisible({ timeout: 5000 })
})

test('registros existentes son visibles', async ({ page }) => {
  const content = page.locator('.tbl tr')
    .or(page.getByText(/No hay registros de vuelo/i))
    .or(page.getByText(/Sin resultados/i))
    .first()
  await expect(content).toBeVisible({ timeout: 8000 })
})

test('filtro por tipo funciona', async ({ page }) => {
  const filtroTipo = page.locator('.qnt-select').first()
  await filtroTipo.selectOption('VUELO')
  await expect(page.locator('text=Error')).not.toBeVisible()
  await filtroTipo.selectOption('')
})

test('filtro por entidad funciona', async ({ page }) => {
  const filtroEntidad = page.locator('.qnt-select').nth(1)
  await filtroEntidad.selectOption('DRON')
  await expect(page.locator('text=Error')).not.toBeVisible()
  await filtroEntidad.selectOption('')
})

test('búsqueda en detalles funciona', async ({ page }) => {
  const search = page.locator('.lb-search__input')
  await search.fill('XXX-NO-EXISTE-999')
  await expect(page.locator('text=Error')).not.toBeVisible()
  const noResults = page.getByText(/Sin resultados/)
    .or(page.getByText(/No hay registros/))
  await expect(noResults.first()).toBeVisible({ timeout: 5000 })
  await search.clear()
})

test('botón Limpiar aparece con filtros activos', async ({ page }) => {
  const filtroTipo = page.locator('.qnt-select').first()
  await filtroTipo.selectOption('VUELO')
  const limpiar = page.getByRole('button', { name: /Limpiar/i })
  await expect(limpiar).toBeVisible()
  await limpiar.click()
})

test('eliminar registro muestra confirmación y cancela', async ({ page }) => {
  const delBtn = page.locator('.icon-btn--del').first()
  if (await delBtn.count() === 0) { test.skip(); return }
  await delBtn.click()
  const confirm = page.locator('.qnt-modal').last()
  await expect(confirm).toBeVisible({ timeout: 8000 })
  await expect(confirm.getByText(/Eliminar registro/i)).toBeVisible()
  await confirm.getByRole('button', { name: /Cancelar/i }).click()
  await expect(confirm).not.toBeVisible({ timeout: 5000 })
})
