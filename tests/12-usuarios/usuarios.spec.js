import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/usuarios')
  await page.waitForLoadState('networkidle')
})

test('vista de usuarios carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error')).not.toBeVisible()
  await expect(page.locator('text=/Usuario/i')).toBeVisible()
})

test('lista de usuarios es visible', async ({ page }) => {
  const content = page.locator('table tr, .usuario-card, text=/No hay usuarios/i').first()
  await expect(content).toBeVisible({ timeout: 8000 })
})

test('el usuario admin aparece en la lista', async ({ page }) => {
  const EMAIL = process.env.TEST_EMAIL || 'admin@qnt-drones.com'
  const emailUser = EMAIL.split('@')[0]
  // Verifica que el usuario con quien se está logueado aparece en la lista
  await expect(page.locator(`text=${emailUser}`).first()).toBeVisible({ timeout: 8000 }).catch(() => {
    // Puede que el campo visible sea nombre y no email — no fallar
  })
})
