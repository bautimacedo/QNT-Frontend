import { test, expect } from '@playwright/test'

test.use({ storageState: undefined })

const EMAIL    = process.env.TEST_EMAIL    || 'admin@qnt-drones.com'
const PASSWORD = process.env.TEST_PASSWORD || 'admin123'

test('ruta /home redirige a /login sin sesión', async ({ page }) => {
  await page.goto('/home')
  await expect(page).toHaveURL(/\/login/)
})

test('ruta /home/stock redirige a /login sin sesión', async ({ page }) => {
  await page.goto('/home/stock/drones')
  await expect(page).toHaveURL(/\/login/)
})

test('login con credenciales correctas redirige al dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
  await expect(page).toHaveURL(/\/home/, { timeout: 15000 })
})

test('login con email incorrecto muestra error', async ({ page }) => {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill('noexiste@qnt-drones.com')
  await page.locator('input[type="password"]').fill('wrongpassword')
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
  await expect(page.locator('[style*="fef2f2"]')).toBeVisible({ timeout: 8000 })
  await expect(page.locator('text=Credenciales incorrectas').or(page.locator('text=incorrectas'))).toBeVisible()
})

test('login con contraseña incorrecta muestra error', async ({ page }) => {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill('password_incorrecta_999')
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
  await expect(page.locator('[style*="fef2f2"]')).toBeVisible({ timeout: 8000 })
})

test('campos vacíos muestran validación sin llamar al backend', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
  await expect(page.locator('text=completá todos los campos')).toBeVisible()
  // Sigue en login — no navega
  await expect(page).toHaveURL(/\/login/)
})

test('solo email vacío muestra validación', async ({ page }) => {
  await page.goto('/login')
  await page.locator('input[type="password"]').fill('algo')
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
  await expect(page.locator('text=completá todos los campos')).toBeVisible()
})

test('botón mostrar/ocultar contraseña funciona', async ({ page }) => {
  await page.goto('/login')
  const passInput = page.locator('input[type="password"]')
  await passInput.fill('mipassword')
  await page.locator('button[type="button"]').last().click()
  await expect(page.locator('input[type="text"]')).toBeVisible()
  await page.locator('button[type="button"]').last().click()
  await expect(page.locator('input[type="password"]')).toBeVisible()
})

test('link ¿Olvidaste tu contraseña? muestra formulario de recuperación', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click()
  await expect(page.locator('text=Recuperar Contraseña')).toBeVisible()
  await expect(page.locator('text=Enviar enlace de recuperación')).toBeVisible()
})

test('formulario recuperación sin email no navega', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click()
  const sendBtn = page.getByRole('button', { name: 'Enviar enlace de recuperación' })
  await expect(sendBtn).toBeDisabled()
})

test('formulario recuperación con email muestra confirmación', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click()
  await page.locator('input[type="email"]').last().fill('test@qnt-drones.com')
  await page.getByRole('button', { name: 'Enviar enlace de recuperación' }).click()
  await expect(page.locator('text=¡Correo enviado!')).toBeVisible({ timeout: 5000 })
})

test('volver al inicio de sesión desde recuperación', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click()
  await page.getByRole('button', { name: /volver al inicio/i }).click()
  await expect(page.locator('text=Iniciar Sesión')).toBeVisible()
})
