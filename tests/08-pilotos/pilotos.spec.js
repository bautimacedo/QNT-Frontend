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
  await cards.first().click()
  await expect(page.locator('.qnt-modal').last()).toBeVisible({ timeout: 8000 })
  await expect(page.locator('.modal-title').last()).toBeVisible()
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
