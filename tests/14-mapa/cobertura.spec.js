import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/cobertura')
  await page.waitForLoadState('networkidle')
})

test('vista Cobertura Operativa carga sin errores', async ({ page }) => {
  await expect(page.locator('text=No se pudo cargar')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: /Cobertura Operativa/i })).toBeVisible()
})

test('stats de cobertura son visibles', async ({ page }) => {
  await expect(page.locator('.cob-stat').first()).toBeVisible({ timeout: 8000 })
  await expect(page.locator('.cob-stat__label').filter({ hasText: /Drones en mapa/i })).toBeVisible()
  await expect(page.locator('.cob-stat__label').filter({ hasText: /Docks en mapa/i })).toBeVisible()
  await expect(page.locator('.cob-stat__label').filter({ hasText: /Misiones en curso/i })).toBeVisible()
  await expect(page.locator('.cob-stat__label').filter({ hasText: /Planificadas/i })).toBeVisible()
})

test('stats muestran valores numéricos', async ({ page }) => {
  const vals = page.locator('.cob-stat__val')
  await expect(vals.first()).toBeVisible({ timeout: 8000 })
  const count = await vals.count()
  expect(count).toBeGreaterThanOrEqual(4)
})

test('botones de capa Drones y Docks son visibles', async ({ page }) => {
  await expect(page.locator('.layer-btn').filter({ hasText: /Drones/i })).toBeVisible({ timeout: 8000 })
  await expect(page.locator('.layer-btn').filter({ hasText: /Docks/i })).toBeVisible()
})

test('botón capa Drones tiene clase active por defecto', async ({ page }) => {
  const dronesBtn = page.locator('.layer-btn').filter({ hasText: /Drones/i })
  await expect(dronesBtn).toHaveClass(/layer-btn--active/, { timeout: 8000 })
})

test('botón capa Docks tiene clase active por defecto', async ({ page }) => {
  const docksBtn = page.locator('.layer-btn').filter({ hasText: /Docks/i })
  await expect(docksBtn).toHaveClass(/layer-btn--active/, { timeout: 8000 })
})

test('click en botón Drones alterna la capa (quita active)', async ({ page }) => {
  const dronesBtn = page.locator('.layer-btn').filter({ hasText: /Drones/i })
  await expect(dronesBtn).toHaveClass(/layer-btn--active/, { timeout: 8000 })
  await dronesBtn.click()
  await expect(dronesBtn).not.toHaveClass(/layer-btn--active/)
  // Restaurar
  await dronesBtn.click()
  await expect(dronesBtn).toHaveClass(/layer-btn--active/)
})

test('mapa Leaflet está presente en el DOM', async ({ page }) => {
  // El contenedor del mapa debe estar presente
  const mapEl = page.locator('.cob-map, .leaflet-container').first()
  await expect(mapEl).toBeAttached({ timeout: 10000 })
})

test('botón Actualizar es visible y clickeable', async ({ page }) => {
  const refreshBtn = page.getByRole('button', { name: /Actualizar/i })
  await expect(refreshBtn).toBeVisible({ timeout: 8000 })
  await refreshBtn.click()
  // No debe mostrar error después de actualizar
  await expect(page.locator('text=No se pudo cargar')).not.toBeVisible({ timeout: 8000 })
})

test('panel lateral está presente', async ({ page }) => {
  await expect(page.locator('.cob-panel')).toBeVisible({ timeout: 8000 })
})

test('mensaje sin equipos o mapa visible cuando no hay datos con coordenadas', async ({ page }) => {
  await page.waitForTimeout(2000)
  const hasMap = await page.locator('.leaflet-container').isVisible({ timeout: 5000 }).catch(() => false)
  const hasEmpty = await page.locator('text=No hay equipos con coordenadas registradas').isVisible({ timeout: 3000 }).catch(() => false)
  // Debe tener uno de los dos
  expect(hasMap || hasEmpty).toBeTruthy()
})
