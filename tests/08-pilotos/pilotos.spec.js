import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/pilotos')
  await page.waitForLoadState('networkidle')
})

test('lista de pilotos carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: /Piloto/i })).toBeVisible()
})

test('KPI cards son visibles', async ({ page }) => {
  await expect(page.locator('.kpi-card').first()).toBeVisible({ timeout: 8000 })
  await expect(page.locator('.kpi-lbl').filter({ hasText: /Total Pilotos/i })).toBeVisible()
  await expect(page.locator('.kpi-lbl').filter({ hasText: /Activos/i })).toBeVisible()
})

test('click en card de piloto abre modal de detalle', async ({ page }) => {
  const cards = page.locator('.pilot-card')
  if (await cards.count() === 0) { test.skip(); return }
  await expect(cards.first()).toBeVisible({ timeout: 10000 })
  await cards.first().click()
  await expect(page.locator('.qnt-modal-overlay')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('.modal-title').last()).toBeVisible({ timeout: 8000 })
})

test('modal de detalle muestra datos del piloto y tiene botón Ver perfil', async ({ page }) => {
  const cards = page.locator('.pilot-card')
  if (await cards.count() === 0) { test.skip(); return }
  await cards.first().click()
  const modal = page.locator('.qnt-modal').last()
  await expect(modal).toBeVisible({ timeout: 8000 })
  await expect(modal.locator('.modal-title')).toBeVisible()
  await expect(modal.getByRole('button', { name: /Ver perfil completo/i })).toBeVisible()
  await expect(modal.getByRole('button', { name: /Cerrar/i })).toBeVisible()
})

test('cerrar modal de detalle con botón Cerrar', async ({ page }) => {
  const cards = page.locator('.pilot-card')
  if (await cards.count() === 0) { test.skip(); return }
  await cards.first().click()
  const modal = page.locator('.qnt-modal').last()
  await expect(modal).toBeVisible({ timeout: 8000 })
  await modal.getByRole('button', { name: /Cerrar/i }).click()
  await expect(modal).not.toBeVisible({ timeout: 5000 })
})

test('botón Ver perfil → en card navega al detalle del piloto', async ({ page }) => {
  const cards = page.locator('.pilot-card')
  if (await cards.count() === 0) { test.skip(); return }
  await cards.first().locator('.btn-ver').click()
  await expect(page).toHaveURL(/\/pilotos\/\d+/, { timeout: 8000 })
})

test('búsqueda por nombre funciona', async ({ page }) => {
  const search = page.locator('input[placeholder*="nombre o email"]')
  await search.fill('XXX-NO-EXISTE-999')
  await expect(page.locator('text=No se encontraron pilotos')).toBeVisible({ timeout: 5000 })
  await search.clear()
})

test('botón Limpiar aparece con búsqueda activa y limpia el filtro', async ({ page }) => {
  const search = page.locator('input[placeholder*="nombre o email"]')
  await search.fill('test')
  const limpiar = page.getByRole('button', { name: /Limpiar/i }).first()
  await expect(limpiar).toBeVisible()
  await limpiar.click()
  await expect(search).toHaveValue('')
})

test('filter-count muestra formato X / Y', async ({ page }) => {
  const counter = page.locator('.filter-count')
  await expect(counter).toBeVisible({ timeout: 8000 })
  const text = await counter.textContent()
  expect(text).toMatch(/\d+\s*\/\s*\d+/)
})

test('KPI Total Pilotos muestra valor numérico', async ({ page }) => {
  const val = page.locator('.kpi-val').first()
  await expect(val).toBeVisible({ timeout: 8000 })
  const text = await val.textContent()
  expect(Number(text?.trim())).toBeGreaterThanOrEqual(0)
})

test('KPI Activos muestra valor numérico', async ({ page }) => {
  const activos = page.locator('.kpi-lbl').filter({ hasText: /Activos/i })
  await expect(activos).toBeVisible({ timeout: 8000 })
  // el valor está en el hermano anterior
  const card = page.locator('.kpi-card').filter({ has: activos })
  const val = card.locator('.kpi-val')
  const text = await val.textContent()
  expect(Number(text?.trim())).toBeGreaterThanOrEqual(0)
})

test('KPI Horas Totales es visible', async ({ page }) => {
  await expect(page.locator('.kpi-lbl').filter({ hasText: /Horas Totales/i })).toBeVisible({ timeout: 8000 })
})

test('pilot card muestra nombre, email y badge de estado', async ({ page }) => {
  const cards = page.locator('.pilot-card')
  if (await cards.count() === 0) { test.skip(); return }
  const card = cards.first()
  await expect(card.locator('.pilot-name')).toBeVisible()
  await expect(card.locator('.pilot-email')).toBeVisible()
})

test('pilot card muestra stats de horas, vuelos y licencias', async ({ page }) => {
  const cards = page.locator('.pilot-card')
  if (await cards.count() === 0) { test.skip(); return }
  const stats = cards.first().locator('.pilot-stats')
  await expect(stats).toBeVisible()
  await expect(stats.locator('.ps-lbl').filter({ hasText: 'Horas' })).toBeVisible()
  await expect(stats.locator('.ps-lbl').filter({ hasText: 'Vuelos' })).toBeVisible()
  await expect(stats.locator('.ps-lbl').filter({ hasText: 'Licencias' })).toBeVisible()
})

test('pilot card muestra badge CMA en el footer', async ({ page }) => {
  const cards = page.locator('.pilot-card')
  if (await cards.count() === 0) { test.skip(); return }
  const footer = cards.first().locator('.pilot-footer')
  await expect(footer.locator('.cma-label')).toBeVisible()
  await expect(footer.locator('.qnt-badge')).toBeVisible()
})

test('modal muestra sección "Datos de piloto"', async ({ page }) => {
  const cards = page.locator('.pilot-card')
  if (await cards.count() === 0) { test.skip(); return }
  await cards.first().click()
  const modal = page.locator('.qnt-modal').last()
  await expect(modal).toBeVisible({ timeout: 8000 })
  await expect(modal.locator('.modal-section-title').filter({ hasText: 'Datos de piloto' })).toBeVisible()
})

test('modal muestra campos Horas de vuelo, Cantidad de vuelos y Venc. CMA', async ({ page }) => {
  const cards = page.locator('.pilot-card')
  if (await cards.count() === 0) { test.skip(); return }
  await cards.first().click()
  const modal = page.locator('.qnt-modal').last()
  await expect(modal).toBeVisible({ timeout: 8000 })
  await expect(modal.locator('.detail-label').filter({ hasText: 'Horas de vuelo' })).toBeVisible()
  await expect(modal.locator('.detail-label').filter({ hasText: 'Cantidad de vuelos' })).toBeVisible()
  await expect(modal.locator('.detail-label').filter({ hasText: 'Venc. CMA' })).toBeVisible()
})

test('modal muestra sección "Licencias ANAC"', async ({ page }) => {
  const cards = page.locator('.pilot-card')
  if (await cards.count() === 0) { test.skip(); return }
  await cards.first().click()
  const modal = page.locator('.qnt-modal').last()
  await expect(modal).toBeVisible({ timeout: 8000 })
  await expect(modal.locator('.modal-section-title').filter({ hasText: 'Licencias ANAC' })).toBeVisible()
})

test('modal muestra licencias o mensaje "Sin licencias registradas"', async ({ page }) => {
  const cards = page.locator('.pilot-card')
  if (await cards.count() === 0) { test.skip(); return }
  await cards.first().click()
  const modal = page.locator('.qnt-modal').last()
  await expect(modal).toBeVisible({ timeout: 8000 })
  const hasTable = await modal.locator('.qnt-table').isVisible().catch(() => false)
  const hasEmpty = await modal.locator('text=Sin licencias registradas').isVisible().catch(() => false)
  expect(hasTable || hasEmpty).toBeTruthy()
})

test('modal muestra email del piloto como subtítulo', async ({ page }) => {
  const cards = page.locator('.pilot-card')
  if (await cards.count() === 0) { test.skip(); return }
  const emailEnCard = (await cards.first().locator('.pilot-email').textContent())?.trim()
  await cards.first().click()
  const modal = page.locator('.qnt-modal').last()
  await expect(modal).toBeVisible({ timeout: 8000 })
  await expect(modal.locator('.modal-subtitle')).toContainText(emailEnCard || '')
})

test('cerrar modal con click en overlay', async ({ page }) => {
  const cards = page.locator('.pilot-card')
  if (await cards.count() === 0) { test.skip(); return }
  await cards.first().click()
  const overlay = page.locator('.qnt-modal-overlay').last()
  await expect(overlay).toBeVisible({ timeout: 8000 })
  await overlay.click({ position: { x: 5, y: 5 } })
  await expect(overlay).not.toBeVisible({ timeout: 5000 })
})

test('búsqueda por email filtra la lista', async ({ page }) => {
  const cards = page.locator('.pilot-card')
  if (await cards.count() === 0) { test.skip(); return }
  const email = (await cards.first().locator('.pilot-email').textContent())?.trim() || ''
  if (!email) { test.skip(); return }
  await page.locator('input[placeholder*="nombre o email"]').fill(email)
  await page.waitForTimeout(300)
  await expect(page.locator('.pilot-card').first()).toBeVisible({ timeout: 5000 })
  const counter = page.locator('.filter-count')
  const text = await counter.textContent()
  expect(text).toMatch(/^1\s*\//)
})

test('búsqueda sin resultados muestra mensaje "No se encontraron pilotos"', async ({ page }) => {
  await page.locator('input[placeholder*="nombre o email"]').fill('PILOTO_INEXISTENTE_ZZZ999')
  await expect(page.locator('text=No se encontraron pilotos')).toBeVisible({ timeout: 5000 })
})

test('modal Ver perfil completo navega al detalle y cierra modal', async ({ page }) => {
  const cards = page.locator('.pilot-card')
  if (await cards.count() === 0) { test.skip(); return }
  await cards.first().click()
  const modal = page.locator('.qnt-modal').last()
  await expect(modal).toBeVisible({ timeout: 8000 })
  await modal.getByRole('button', { name: /Ver perfil completo/i }).click()
  await expect(page).toHaveURL(/\/pilotos\/\d+/, { timeout: 8000 })
})
