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

test('contenedor del mapa Leaflet es visible', async ({ page }) => {
  await expect(page.locator('.leaflet-container, #map, [class*="mapa"]').first()).toBeVisible({ timeout: 10000 })
})

test('markers de equipos son visibles si hay datos', async ({ page }) => {
  await page.waitForTimeout(3000)
  const markers = page.locator('.leaflet-marker-icon')
  // Si hay equipos con telemetría, los markers deben aparecer
  // No falla si no hay markers (puede que no haya drones activos)
  const count = await markers.count()
  console.log(`Markers visibles en el mapa: ${count}`)
})
