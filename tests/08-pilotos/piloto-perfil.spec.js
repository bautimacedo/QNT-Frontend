import { test, expect } from '@playwright/test'

// Navegar a un perfil de piloto via la lista (necesitamos un ID real)
async function irAlPrimerPerfil(page) {
  await page.goto('/home/pilotos')
  await page.waitForLoadState('networkidle')
  const cards = page.locator('.pilot-card')
  const count = await cards.count()
  if (count === 0) return false
  await cards.first().locator('.btn-ver').click()
  await expect(page).toHaveURL(/\/home\/pilotos\/\d+/, { timeout: 8000 })
  await page.waitForLoadState('networkidle')
  return true
}

test('perfil de piloto carga sin errores', async ({ page }) => {
  const ok = await irAlPrimerPerfil(page)
  if (!ok) { test.skip(); return }
  await expect(page.locator('text=Error')).not.toBeVisible()
  await expect(page.locator('.perfil-nombre')).toBeVisible()
})

test('perfil muestra nombre y email del piloto', async ({ page }) => {
  const ok = await irAlPrimerPerfil(page)
  if (!ok) { test.skip(); return }
  await expect(page.locator('.perfil-nombre')).toBeVisible()
  await expect(page.locator('.perfil-email')).toBeVisible()
})

test('perfil muestra badges de estado y CMA', async ({ page }) => {
  const ok = await irAlPrimerPerfil(page)
  if (!ok) { test.skip(); return }
  await expect(page.locator('.perfil-badges .badge').first()).toBeVisible()
})

test('breadcrumb Volver a Pilotos navega de regreso', async ({ page }) => {
  const ok = await irAlPrimerPerfil(page)
  if (!ok) { test.skip(); return }
  await page.getByRole('button', { name: /← Volver a Pilotos/i }).click()
  await expect(page).toHaveURL(/\/home\/pilotos$/, { timeout: 8000 })
})

test('card Datos de vuelo es visible', async ({ page }) => {
  const ok = await irAlPrimerPerfil(page)
  if (!ok) { test.skip(); return }
  await expect(page.locator('.perfil-card-title').filter({ hasText: /Datos de vuelo/i })).toBeVisible()
  await expect(page.locator('.dato-label').filter({ hasText: /Horas de vuelo/i })).toBeVisible()
  await expect(page.locator('.dato-label').filter({ hasText: /Cantidad de vuelos/i })).toBeVisible()
})

test('sección Licencias ANAC es visible', async ({ page }) => {
  const ok = await irAlPrimerPerfil(page)
  if (!ok) { test.skip(); return }
  await expect(page.locator('.perfil-card-title').filter({ hasText: /Licencias ANAC/i })).toBeVisible()
})

test('tabla de licencias o mensaje vacío es visible', async ({ page }) => {
  const ok = await irAlPrimerPerfil(page)
  if (!ok) { test.skip(); return }
  const content = page.locator('.data-table')
    .or(page.getByText(/Sin licencias ANAC/i))
    .first()
  await expect(content).toBeVisible({ timeout: 8000 })
})

test('URL directa a perfil de piloto carga correctamente', async ({ page }) => {
  // Primero obtener un ID válido
  await page.goto('/home/pilotos')
  await page.waitForLoadState('networkidle')
  const links = page.locator('.btn-ver')
  if (await links.count() === 0) { test.skip(); return }

  await links.first().click()
  const url = page.url()
  const match = url.match(/\/pilotos\/(\d+)/)
  if (!match) { test.skip(); return }
  const pilotoId = match[1]

  // Navegar directamente (simula refresh/link directo)
  await page.goto(`/home/pilotos/${pilotoId}`)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.perfil-nombre')).toBeVisible({ timeout: 8000 })
})

test('tabla de licencias muestra columnas correctas cuando hay licencias', async ({ page }) => {
  const ok = await irAlPrimerPerfil(page)
  if (!ok) { test.skip(); return }
  const tabla = page.locator('.data-table')
  const hasTable = await tabla.isVisible({ timeout: 5000 }).catch(() => false)
  if (!hasTable) { test.skip(); return }
  const headers = tabla.locator('th')
  await expect(headers.filter({ hasText: 'Fecha emisión' })).toBeVisible()
  await expect(headers.filter({ hasText: 'Venc. CMA' })).toBeVisible()
  await expect(headers.filter({ hasText: 'Activa' })).toBeVisible()
  await expect(headers.filter({ hasText: 'Acciones' })).toBeVisible()
})

test('badge contador de licencias muestra número válido', async ({ page }) => {
  const ok = await irAlPrimerPerfil(page)
  if (!ok) { test.skip(); return }
  await expect(page.locator('.count-badge')).toBeVisible({ timeout: 8000 })
  const texto = await page.locator('.count-badge').textContent()
  expect(Number(texto?.trim())).toBeGreaterThanOrEqual(0)
})

test('nombre del piloto en detalle coincide con el de la lista', async ({ page }) => {
  await page.goto('/home/pilotos')
  await page.waitForLoadState('networkidle')
  const cards = page.locator('.pilot-card')
  if (await cards.count() === 0) { test.skip(); return }
  const nombreLista = (await cards.first().locator('.pilot-name').textContent())?.trim()
  await cards.first().locator('.btn-ver').click()
  await page.waitForURL(/\/home\/pilotos\/\d+/, { timeout: 10000 })
  await expect(page.locator('.perfil-nombre')).toBeVisible({ timeout: 8000 })
  const nombreDetalle = (await page.locator('.perfil-nombre').textContent())?.trim()
  expect(nombreDetalle).toBe(nombreLista)
})

test('campo Venc. CMA en datos de vuelo está visible', async ({ page }) => {
  const ok = await irAlPrimerPerfil(page)
  if (!ok) { test.skip(); return }
  await expect(page.locator('.dato-label').filter({ hasText: /Venc\. CMA/i })).toBeVisible({ timeout: 8000 })
})

test('modal de imágenes de licencia se abre y muestra secciones CMA y Certificado', async ({ page }) => {
  const ok = await irAlPrimerPerfil(page)
  if (!ok) { test.skip(); return }
  const btnVerImagenes = page.locator('button.btn-action').filter({ hasText: /Ver imágenes/i })
  if (await btnVerImagenes.count() === 0) { test.skip(); return }
  await btnVerImagenes.first().click()
  const modal = page.locator('.modal-card--wide').last()
  await expect(modal).toBeVisible({ timeout: 8000 })
  await expect(modal.locator('.image-section__title').filter({ hasText: /Imagen CMA/i })).toBeVisible()
  await expect(modal.locator('.image-section__title').filter({ hasText: /Certificado de Idoneidad/i })).toBeVisible()
})

test('modal de imágenes de licencia se cierra con botón Cerrar', async ({ page }) => {
  const ok = await irAlPrimerPerfil(page)
  if (!ok) { test.skip(); return }
  const btnVerImagenes = page.locator('button.btn-action').filter({ hasText: /Ver imágenes/i })
  if (await btnVerImagenes.count() === 0) { test.skip(); return }
  await btnVerImagenes.first().click()
  const modal = page.locator('.modal-card--wide').last()
  await expect(modal).toBeVisible({ timeout: 8000 })
  await modal.locator('button').filter({ hasText: /Cerrar/i }).click()
  await expect(modal).not.toBeVisible({ timeout: 5000 })
})

test('modal de imágenes se cierra al hacer click fuera (overlay)', async ({ page }) => {
  const ok = await irAlPrimerPerfil(page)
  if (!ok) { test.skip(); return }
  const btnVerImagenes = page.locator('button.btn-action').filter({ hasText: /Ver imágenes/i })
  if (await btnVerImagenes.count() === 0) { test.skip(); return }
  await btnVerImagenes.first().click()
  const overlay = page.locator('.modal-overlay').last()
  await expect(overlay).toBeVisible({ timeout: 8000 })
  await overlay.click({ position: { x: 5, y: 5 } })
  await expect(overlay).not.toBeVisible({ timeout: 5000 })
})
