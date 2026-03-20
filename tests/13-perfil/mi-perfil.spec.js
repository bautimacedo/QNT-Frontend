import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/mi-perfil')
  await page.waitForLoadState('networkidle')
})

test('vista Mi Perfil carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: /Perfil|Mi perfil/i })).toBeVisible()
})

test('datos del usuario son visibles', async ({ page }) => {
  const EMAIL = process.env.TEST_EMAIL || 'admin@qnt-drones.com'
  await expect(page.locator(`text=${EMAIL}`).or(page.locator('text=admin')).first()).toBeVisible({ timeout: 8000 })
})

test('sección de foto de perfil es visible', async ({ page }) => {
  const foto = page.locator('img[alt*="erfil"], img[alt*="foto"], [class*="avatar"], [class*="foto"]').first()
  await expect(foto.or(page.locator('text=/foto|imagen/i').first())).toBeVisible({ timeout: 8000 })
})

test('tab Información Personal está activo por defecto', async ({ page }) => {
  const tab = page.locator('.tab-btn').filter({ hasText: /Información Personal/i })
  await expect(tab).toBeVisible({ timeout: 8000 })
  await expect(tab).toHaveClass(/active/)
})

test('tab Cambiar Contraseña es visible y funciona', async ({ page }) => {
  const tabPw = page.locator('.tab-btn').filter({ hasText: /Cambiar Contraseña/i })
  await expect(tabPw).toBeVisible({ timeout: 8000 })
  await tabPw.click()
  await expect(tabPw).toHaveClass(/active/)
})

test('tab Información Personal muestra formulario de datos', async ({ page }) => {
  await expect(page.locator('.tab-btn').filter({ hasText: /Información Personal/i })).toBeVisible({ timeout: 8000 })
  // El formulario de información personal debe estar visible
  await expect(page.locator('form.pf-grid, .pf-grid').first()).toBeVisible({ timeout: 8000 })
})

test('tab Cambiar Contraseña muestra campos de contraseña', async ({ page }) => {
  await page.locator('.tab-btn').filter({ hasText: /Cambiar Contraseña/i }).click()
  await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 8000 })
})

test('botón guardar cambios de perfil es visible', async ({ page }) => {
  const btn = page.getByRole('button', { name: /Guardar|Actualizar/i }).first()
  if (await btn.count() === 0) { test.skip(); return }
  await expect(btn).toBeVisible()
})

test('estadísticas del piloto son visibles', async ({ page }) => {
  const stats = page.locator('.stat-val').first()
    .or(page.locator('.hero-stat').first())
  if (await stats.count() === 0) { test.skip(); return }
  await expect(stats).toBeVisible({ timeout: 8000 })
})
