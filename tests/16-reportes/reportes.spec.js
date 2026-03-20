import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/reportes')
  await page.waitForLoadState('networkidle')
})

test('vista de reportes carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Reportes', exact: true }).first()).toBeVisible()
})

test('banner "Módulo en desarrollo" es visible', async ({ page }) => {
  await expect(page.getByText(/Módulo en desarrollo/i)).toBeVisible({ timeout: 8000 })
  await expect(page.getByText(/Próximamente/i).first()).toBeVisible()
})

test('cards de funcionalidades futuras son visibles', async ({ page }) => {
  await expect(page.getByText(/Reportes de misiones/i)).toBeVisible({ timeout: 8000 })
  await expect(page.getByText(/Reportes de stock y equipos/i)).toBeVisible()
  await expect(page.getByText(/Reportes de mantenimiento/i)).toBeVisible()
  await expect(page.getByText(/Reportes financieros/i)).toBeVisible()
})

test('sección Formatos de exportación es visible', async ({ page }) => {
  await expect(page.getByText(/Formatos de exportación/i)).toBeVisible({ timeout: 8000 })
  await expect(page.getByText('PDF')).toBeVisible()
  await expect(page.getByText('CSV')).toBeVisible()
})

test('sección Filtros disponibles es visible', async ({ page }) => {
  await expect(page.getByText(/Filtros disponibles/i)).toBeVisible({ timeout: 8000 })
})

test('subtítulo describe el módulo', async ({ page }) => {
  await expect(page.getByText(/Generación y exportación/i)).toBeVisible({ timeout: 8000 })
})
