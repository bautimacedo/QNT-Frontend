import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/mantenimiento')
  await page.waitForLoadState('networkidle')
})

test('vista de mantenimiento carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: /Mantenimiento/i })).toBeVisible({ timeout: 10000 })
})

test('stats cards son visibles', async ({ page }) => {
  await expect(page.locator('.mant-stat').first()).toBeVisible({ timeout: 8000 })
  await expect(page.locator('.mant-stat__label').filter({ hasText: /Mant. de drones/i })).toBeVisible()
  await expect(page.locator('.mant-stat__label').filter({ hasText: /Mant. de docks/i })).toBeVisible()
})

test('tabs Drones y Docks son visibles', async ({ page }) => {
  await expect(page.locator('.tab-btn').filter({ hasText: /Drones/i })).toBeVisible({ timeout: 8000 })
  await expect(page.locator('.tab-btn').filter({ hasText: /Docks/i })).toBeVisible()
})

test('tab Drones está activo por defecto', async ({ page }) => {
  const tabDrones = page.locator('.tab-btn').filter({ hasText: /Drones/i })
  await expect(tabDrones).toHaveClass(/active/, { timeout: 8000 })
})

test('cambiar a tab Docks muestra contenido de docks', async ({ page }) => {
  await page.locator('.tab-btn').filter({ hasText: /Docks/i }).click()
  // El botón de acción cambia a "Registrar dock"
  await expect(page.getByRole('button', { name: /Registrar dock/i })).toBeVisible({ timeout: 5000 })
})

test('tab Drones muestra botón Registrar dron', async ({ page }) => {
  await expect(page.getByRole('button', { name: /Registrar dron/i })).toBeVisible({ timeout: 8000 })
})

test('botón Registrar dron abre modal con campos requeridos', async ({ page }) => {
  await page.getByRole('button', { name: /Registrar dron/i }).click()
  const modal = page.locator('.qnt-modal').last()
  await expect(modal).toBeVisible({ timeout: 8000 })
  await expect(modal.locator('.qnt-modal__title')).toContainText(/Registrar mantenimiento — Dron/i)
  await expect(modal.locator('select').first()).toBeVisible()
  await expect(modal.locator('input[type="datetime-local"]')).toBeVisible()
})

test('guardar dron sin campos requeridos muestra mensaje de error', async ({ page }) => {
  await page.getByRole('button', { name: /Registrar dron/i }).click()
  const modal = page.locator('.qnt-modal').last()
  await expect(modal).toBeVisible({ timeout: 8000 })
  await modal.getByRole('button', { name: /Guardar/i }).click()
  await expect(page.locator('.qnt-toast')).toBeVisible({ timeout: 5000 })
})

test('cancelar modal dron cierra sin guardar', async ({ page }) => {
  const btn = page.getByRole('button', { name: /Registrar dron/i })
  await expect(btn).toBeVisible({ timeout: 15000 })
  await btn.click()
  const modal = page.locator('.qnt-modal').last()
  await expect(modal).toBeVisible({ timeout: 8000 })
  await modal.getByRole('button', { name: /Cancelar/i }).click()
  await expect(modal).not.toBeVisible({ timeout: 5000 })
})

test('botón Registrar dock abre modal con campos requeridos', async ({ page }) => {
  await page.locator('.tab-btn').filter({ hasText: /Docks/i }).click()
  await page.getByRole('button', { name: /Registrar dock/i }).click()
  const modal = page.locator('.qnt-modal').last()
  await expect(modal).toBeVisible({ timeout: 8000 })
  await expect(modal.locator('.qnt-modal__title')).toContainText(/Registrar mantenimiento — Dock/i)
  await expect(modal.locator('input[type="datetime-local"]')).toBeVisible()
})

test('tabla de drones muestra columnas correctas si hay datos', async ({ page }) => {
  const table = page.locator('.tbl')
  if (await table.count() === 0) { test.skip(); return }
  await expect(table.locator('th').filter({ hasText: /Dron/i })).toBeVisible()
  await expect(table.locator('th').filter({ hasText: /Técnico/i })).toBeVisible()
})

test('tabla de docks muestra columnas correctas si hay datos', async ({ page }) => {
  await page.locator('.tab-btn').filter({ hasText: /Docks/i }).click()
  const table = page.locator('.tbl')
  if (await table.count() === 0) { test.skip(); return }
  await expect(table.locator('th').filter({ hasText: /Dock/i })).toBeVisible()
  await expect(table.locator('th').filter({ hasText: /Técnico/i })).toBeVisible()
})

test('editar mantenimiento de dron abre modal con datos', async ({ page }) => {
  const editBtn = page.locator('.icon-btn').first()
  if (await editBtn.count() === 0) { test.skip(); return }
  await editBtn.click()
  const modal = page.locator('.qnt-modal').last()
  await expect(modal).toBeVisible({ timeout: 8000 })
  await expect(modal.locator('.qnt-modal__title')).toContainText(/Editar mantenimiento — Dron/i)
  await modal.getByRole('button', { name: /Cancelar/i }).click()
})

test('eliminar mantenimiento de dron muestra confirmación y cancela', async ({ page }) => {
  const delBtn = page.locator('.icon-btn--del').first()
  if (await delBtn.count() === 0) { test.skip(); return }
  await delBtn.click()
  const confirm = page.locator('.qnt-modal').last()
  await expect(confirm).toBeVisible({ timeout: 8000 })
  await expect(confirm.getByRole('button', { name: /Eliminar/i })).toBeVisible()
  await confirm.getByRole('button', { name: /Cancelar/i }).click()
  await expect(confirm).not.toBeVisible({ timeout: 5000 })
})
