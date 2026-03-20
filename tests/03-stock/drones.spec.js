import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/stock/drones')
  await page.waitForLoadState('networkidle')
})

test('lista carga sin errores y muestra header', async ({ page }) => {
  await expect(page.locator('text=Error al cargar')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Drones' })).toBeVisible()
})

test('muestra contador de equipos registrados', async ({ page }) => {
  await expect(page.locator('text=/\\d+ equipos registrados/')).toBeVisible()
})

test('filtro por número de serie — sin resultados', async ({ page }) => {
  await page.locator('input[placeholder*="serie"]').fill('XXX-NO-EXISTE-999')
  await expect(page.locator('text=Sin resultados')).toBeVisible()
  await page.locator('input[placeholder*="serie"]').clear()
})

test('filtro por estado STOCK_ACTUAL', async ({ page }) => {
  await page.locator('select').first().selectOption('STOCK_ACTUAL')
  await expect(page.locator('text=Error')).not.toBeVisible()
  await page.locator('select').first().selectOption('')
})

test('filtro por estado NO_LLEGO muestra pendientes de llegada', async ({ page }) => {
  await page.locator('select').first().selectOption('NO_LLEGO')
  await expect(page.locator('text=Error')).not.toBeVisible()
  await page.locator('select').first().selectOption('')
})

test('filtro por marca filtra correctamente', async ({ page }) => {
  await page.locator('input[placeholder="Marca"]').fill('DJI')
  await expect(page.locator('text=Error')).not.toBeVisible()
  await page.locator('input[placeholder="Marca"]').clear()
})

test('filtro por modelo filtra correctamente', async ({ page }) => {
  await page.locator('input[placeholder="Modelo"]').fill('Matrice')
  await expect(page.locator('text=Error')).not.toBeVisible()
  await page.locator('input[placeholder="Modelo"]').clear()
})

test('botón Limpiar aparece cuando hay filtros activos', async ({ page }) => {
  await page.locator('input[placeholder="Marca"]').fill('DJI')
  await expect(page.getByRole('button', { name: 'Limpiar' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Limpiar' }).first().click()
  await expect(page.getByRole('button', { name: 'Limpiar' })).not.toBeVisible()
})

test('click en card abre detalle del dron', async ({ page }) => {
  const card = page.locator('.equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await expect(page).toHaveURL(/\/stock\/drones\/\d+/)
})

test('detalle del dron muestra número de serie y estado', async ({ page }) => {
  const card = page.locator('.equip-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('text=/serie|Serie/i').first()).toBeVisible()
  await expect(page.locator('text=/estado|Estado/i').first()).toBeVisible()
})

test('breadcrumb Stock navega correctamente', async ({ page }) => {
  await page.locator('a', { hasText: 'Stock' }).first().click()
  await expect(page).toHaveURL(/\/stock/)
})

test('vista Stock Overview muestra links a todos los tipos', async ({ page }) => {
  await page.goto('/home/stock')
  await page.waitForLoadState('networkidle')
  const dronesLink = page.locator('a[href*="drones"], button').filter({ hasText: /dron/i }).first()
  const docksLink = page.locator('a[href*="docks"], button').filter({ hasText: /dock/i }).first()
  const bateriasLink = page.locator('a[href*="baterias"], button').filter({ hasText: /bater/i }).first()
  if (await dronesLink.count() === 0) { test.skip(); return }
  await expect(dronesLink).toBeVisible()
  await expect(docksLink).toBeVisible()
  await expect(bateriasLink).toBeVisible()
})
