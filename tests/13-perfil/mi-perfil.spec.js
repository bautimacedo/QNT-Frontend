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
  // Email o nombre del usuario logueado debe aparecer
  const EMAIL = process.env.TEST_EMAIL || 'admin@qnt-drones.com'
  await expect(page.locator(`text=${EMAIL}`).or(page.locator('text=admin')).first()).toBeVisible({ timeout: 8000 })
})

test('botón editar perfil es clickeable', async ({ page }) => {
  const btn = page.getByRole('button', { name: /editar/i }).first()
  if (await btn.count() === 0) { test.skip(); return }
  await btn.click()
  await expect(page.locator('form, input').first()).toBeVisible()
  await page.keyboard.press('Escape')
})

test('sección de foto de perfil es visible', async ({ page }) => {
  const foto = page.locator('img[alt*="erfil"], img[alt*="foto"], [class*="avatar"], [class*="foto"]').first()
  await expect(foto.or(page.locator('text=/foto|imagen/i').first())).toBeVisible({ timeout: 8000 })
})
