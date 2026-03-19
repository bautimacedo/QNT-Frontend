import { test as setup, expect } from '@playwright/test'
import path from 'path'

const AUTH_FILE = path.join(import.meta.dirname, '.auth/user.json')

const EMAIL    = process.env.TEST_EMAIL    || 'admin@qnt-drones.com'
const PASSWORD = process.env.TEST_PASSWORD || 'admin123'

setup('autenticar usuario', async ({ page }) => {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
  await page.waitForURL('**/home', { timeout: 15000 })
  await expect(page).toHaveURL(/\/home/)
  await page.context().storageState({ path: AUTH_FILE })
})
