import { test as setup, expect } from '@playwright/test'
import path from 'path'

const AUTH_FILE = path.join(import.meta.dirname, '.auth/user.json')

const EMAIL    = process.env.TEST_EMAIL    || 'admin@admin.com'
const PASSWORD = process.env.TEST_PASSWORD || 'admin'

setup('autenticar usuario', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  // Si ya hay sesión activa, el router redirige a /home automáticamente
  await page.waitForTimeout(2000)
  if (!page.url().includes('/login')) {
    // Ya autenticado — solo guardar estado
    await page.context().storageState({ path: AUTH_FILE })
    return
  }
  await page.locator('input[type="email"]').waitFor({ timeout: 30000 })
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
  await page.waitForURL('**/home', { timeout: 30000 })
  await expect(page).toHaveURL(/\/home/)
  await page.context().storageState({ path: AUTH_FILE })
})
