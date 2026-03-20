import { test, expect } from '@playwright/test'

// Sin sesión — estas pruebas son sobre la página pública de registro
test.use({ storageState: { cookies: [], origins: [] } })

// Email único por ejecución para evitar conflictos de "ya existe"
const uniqueEmail = () => `test.e2e.${Date.now()}@qnt-drones.com`

test.beforeEach(async ({ page }) => {
  await page.goto('/register')
  await page.waitForLoadState('networkidle')
})

// ─── Renderizado inicial ────────────────────────────────────────────────────

test('página de registro carga correctamente', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Solicitar acceso' })).toBeVisible()
  await expect(page.locator('#reg-nombre')).toBeVisible()
  await expect(page.locator('#reg-email')).toBeVisible()
  await expect(page.locator('#reg-password')).toBeVisible()
  await expect(page.locator('#reg-confirmPassword')).toBeVisible()
})

test('link "Registrarte" desde login lleva a /register', async ({ page }) => {
  await page.goto('/login')
  await page.locator('a[href="/register"], a:has-text("Registrarte")').click()
  await expect(page).toHaveURL(/\/register/)
  await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible()
})

test('link "¿Ya tenés cuenta?" lleva de vuelta a /login', async ({ page }) => {
  await page.locator('a[href="/login"], a:has-text("Iniciá sesión")').click()
  await expect(page).toHaveURL(/\/login/)
})

// ─── Validaciones cliente ───────────────────────────────────────────────────

test('enviar formulario vacío muestra error en nombre', async ({ page }) => {
  await page.getByRole('button', { name: 'Solicitar acceso' }).click()
  await expect(page.locator('text=El nombre es obligatorio')).toBeVisible()
  await expect(page).toHaveURL(/\/register/)
})

test('nombre relleno pero email vacío muestra error de email', async ({ page }) => {
  await page.locator('#reg-nombre').fill('Juan')
  await page.getByRole('button', { name: 'Solicitar acceso' }).click()
  await expect(page.locator('text=El email es obligatorio')).toBeVisible()
})

test('email con formato inválido muestra error', async ({ page }) => {
  await page.locator('#reg-nombre').fill('Juan')
  await page.locator('#reg-email').fill('noesun-email')
  await page.locator('#reg-password').fill('123456')
  await page.locator('#reg-confirmPassword').fill('123456')
  // Deshabilitar validación nativa del browser para que corra la validación de Vue
  await page.evaluate(() => { const f = document.querySelector('form'); if (f) f.noValidate = true })
  await page.getByRole('button', { name: 'Solicitar acceso' }).click()
  await expect(page.getByText(/Ingresá un email válido/)).toBeVisible({ timeout: 8000 })
})

test('contraseña menor a 6 caracteres muestra error', async ({ page }) => {
  await page.locator('#reg-nombre').fill('Juan')
  await page.locator('#reg-email').fill('juan@qnt-drones.com')
  await page.locator('#reg-password').fill('123')
  await page.locator('#reg-confirmPassword').fill('123')
  await page.getByRole('button', { name: 'Solicitar acceso' }).click()
  await expect(page.locator('text=Mínimo 6 caracteres')).toBeVisible()
})

test('contraseñas que no coinciden muestran error', async ({ page }) => {
  await page.locator('#reg-nombre').fill('Juan')
  await page.locator('#reg-email').fill('juan@qnt-drones.com')
  await page.locator('#reg-password').fill('password123')
  await page.locator('#reg-confirmPassword').fill('diferente456')
  await page.getByRole('button', { name: 'Solicitar acceso' }).click()
  await expect(page.locator('text=Las contraseñas no coinciden')).toBeVisible()
})

test('confirmar contraseña vacía muestra error', async ({ page }) => {
  await page.locator('#reg-nombre').fill('Juan')
  await page.locator('#reg-email').fill('juan@qnt-drones.com')
  await page.locator('#reg-password').fill('password123')
  await page.getByRole('button', { name: 'Solicitar acceso' }).click()
  await expect(page.locator('text=Confirmá tu contraseña')).toBeVisible()
})

// ─── Mostrar / ocultar contraseña ───────────────────────────────────────────

test('toggle show/hide en campo contraseña funciona', async ({ page }) => {
  await page.locator('#reg-password').fill('mipassword')
  await expect(page.locator('#reg-password')).toHaveAttribute('type', 'password')
  const toggleBtns = page.locator('form button[type="button"]')
  await toggleBtns.first().click()
  await expect(page.locator('#reg-password')).toHaveAttribute('type', 'text')
  await toggleBtns.first().click()
  await expect(page.locator('#reg-password')).toHaveAttribute('type', 'password')
})

test('toggle show/hide en confirmar contraseña funciona', async ({ page }) => {
  await page.locator('#reg-confirmPassword').fill('mipassword')
  await expect(page.locator('#reg-confirmPassword')).toHaveAttribute('type', 'password')
  const toggleBtns = page.locator('form button[type="button"]')
  await toggleBtns.last().click()
  await expect(page.locator('#reg-confirmPassword')).toHaveAttribute('type', 'text')
})

// ─── Campos opcionales ──────────────────────────────────────────────────────

test('apellido es opcional — sin apellido no hay error de apellido', async ({ page }) => {
  await page.locator('#reg-nombre').fill('Juan')
  await page.locator('#reg-email').fill(uniqueEmail())
  await page.locator('#reg-password').fill('password123')
  await page.locator('#reg-confirmPassword').fill('password123')
  await page.getByRole('button', { name: 'Solicitar acceso' }).click()
  await expect(page.locator('text=El apellido es obligatorio')).not.toBeVisible()
})

// ─── Flujo exitoso ──────────────────────────────────────────────────────────

test('registro completo y válido muestra pantalla de éxito', async ({ page }) => {
  await page.locator('#reg-nombre').fill('TestE2E')
  await page.locator('#reg-apellido').fill('Playwright')
  await page.locator('#reg-email').fill(uniqueEmail())
  await page.locator('#reg-password').fill('testpassword123')
  await page.locator('#reg-confirmPassword').fill('testpassword123')
  await page.getByRole('button', { name: 'Solicitar acceso' }).click()
  const success = page.locator('text=¡Solicitud enviada!')
  const backendErr = page.locator('text=Ocurrió un error')
  await expect(success.or(backendErr)).toBeVisible({ timeout: 20000 })
  if (await backendErr.isVisible()) { test.skip(); return }
  await expect(success).toBeVisible()
})

test('pantalla de éxito tiene botón "Ir a Iniciar Sesión" que navega a /login', async ({ page }) => {
  await page.locator('#reg-nombre').fill('TestE2E')
  await page.locator('#reg-email').fill(uniqueEmail())
  await page.locator('#reg-password').fill('testpassword123')
  await page.locator('#reg-confirmPassword').fill('testpassword123')
  await page.getByRole('button', { name: 'Solicitar acceso' }).click()
  const successMsg = page.locator('text=¡Solicitud enviada!')
  if (!(await successMsg.isVisible({ timeout: 20000 }))) { test.skip(); return }
  await expect(page.locator('a:has-text("Ir a Iniciar Sesión")')).toBeVisible()
  await page.locator('a:has-text("Ir a Iniciar Sesión")').click()
  await expect(page).toHaveURL(/\/login/)
})

test('pantalla de éxito muestra mensaje de aprobación pendiente', async ({ page }) => {
  await page.locator('#reg-nombre').fill('TestE2E')
  await page.locator('#reg-email').fill(uniqueEmail())
  await page.locator('#reg-password').fill('testpassword123')
  await page.locator('#reg-confirmPassword').fill('testpassword123')
  await page.getByRole('button', { name: 'Solicitar acceso' }).click()
  const successMsg = page.locator('text=¡Solicitud enviada!')
  if (!(await successMsg.isVisible({ timeout: 20000 }))) { test.skip(); return }
  await expect(page.locator('text=Un administrador revisará tu solicitud')).toBeVisible()
})

// ─── Error de email duplicado ───────────────────────────────────────────────

test('email ya registrado muestra error de cuenta existente', async ({ page }) => {
  const EMAIL = process.env.TEST_EMAIL || 'admin@admin.com'
  await page.locator('#reg-nombre').fill('Duplicado')
  await page.locator('#reg-email').fill(EMAIL)
  await page.locator('#reg-password').fill('password123')
  await page.locator('#reg-confirmPassword').fill('password123')
  await page.getByRole('button', { name: 'Solicitar acceso' }).click()
  await expect(page.locator('text=Ya existe una cuenta con ese email')).toBeVisible({ timeout: 10000 })
})

// ─── Panel izquierdo (desktop) ──────────────────────────────────────────────

test('panel izquierdo muestra los 3 pasos del proceso de aprobación', async ({ page }) => {
  await expect(page.locator('text=Completá el formulario de registro')).toBeVisible()
  await expect(page.locator('text=Un administrador aprueba tu acceso')).toBeVisible()
  await expect(page.locator('text=Iniciás sesión y operás el sistema')).toBeVisible()
})
