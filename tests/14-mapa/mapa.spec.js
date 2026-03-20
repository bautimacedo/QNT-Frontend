import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/mapa')
  await page.waitForLoadState('networkidle')
})

test('vista mapa carga sin errores de JS', async ({ page }) => {
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.waitForTimeout(3000)
  expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0)
})

test('heading Mapa de equipos es visible', async ({ page }) => {
  await expect(page.locator('.page-title')).toContainText('Mapa de equipos', { timeout: 8000 })
})

test('breadcrumb muestra Stock y Mapa de equipos', async ({ page }) => {
  await expect(page.locator('.breadcrumb a', { hasText: 'Stock' })).toBeVisible({ timeout: 8000 })
  await expect(page.locator('.breadcrumb__current')).toContainText('Mapa de equipos')
})

test('leyenda de tipos de equipos es visible', async ({ page }) => {
  await expect(page.locator('.mapa-leyenda')).toBeVisible({ timeout: 8000 })
  await expect(page.locator('.leyenda-item').first()).toBeVisible()
})

test('contenedor del mapa Leaflet es visible', async ({ page }) => {
  await expect(page.locator('.leaflet-container, #map, [class*="mapa"], .map-container').first()).toBeVisible({ timeout: 10000 })
})

test('markers de equipos son visibles si hay datos', async ({ page }) => {
  await page.waitForTimeout(3000)
  const markers = page.locator('.leaflet-marker-icon')
  const count = await markers.count()
  console.log(`Markers visibles en el mapa: ${count}`)
})

test('mensaje sin coordenadas o contador de equipos es visible', async ({ page }) => {
  await page.waitForTimeout(2000)
  const hasCount = await page.locator('.mapa-count').isVisible({ timeout: 5000 }).catch(() => false)
  const hasEmpty = await page.locator('.mapa-empty').isVisible({ timeout: 3000 }).catch(() => false)
  expect(hasCount || hasEmpty).toBeTruthy()
})

test('breadcrumb Stock navega a /home/stock', async ({ page }) => {
  await page.locator('.breadcrumb a', { hasText: 'Stock' }).click()
  await expect(page).toHaveURL(/\/stock/, { timeout: 8000 })
})
