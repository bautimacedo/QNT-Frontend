import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/proveedores')
  await page.waitForLoadState('networkidle')
})

test('lista de proveedores carga sin errores', async ({ page }) => {
  await expect(page.locator('text=Error al cargar')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: /Proveedor/i })).toBeVisible()
})

test('contador muestra cantidad de proveedores', async ({ page }) => {
  await expect(page.locator('text=/\\d+ proveedores/i')).toBeVisible()
})

test('botón Nuevo proveedor abre modal', async ({ page }) => {
  const btn = page.getByRole('button', { name: 'Nuevo proveedor' })
  if (await btn.count() === 0) { test.skip(); return }
  await btn.click()
  await expect(page.getByRole('heading', { name: 'Nuevo proveedor' })).toBeVisible()
})

test('no se puede guardar proveedor sin nombre', async ({ page }) => {
  const btn = page.getByRole('button', { name: 'Nuevo proveedor' })
  if (await btn.count() === 0) { test.skip(); return }
  await btn.click()
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.locator('text=El nombre es obligatorio')).toBeVisible()
})

test('email inválido muestra error de validación', async ({ page }) => {
  const btn = page.getByRole('button', { name: 'Nuevo proveedor' })
  if (await btn.count() === 0) { test.skip(); return }
  await btn.click()
  await page.locator('input.qnt-input').first().fill('Proveedor Test')
  await page.locator('input[type="email"]').fill('email-invalido')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.locator('text=email válido')).toBeVisible()
})

test('crear proveedor con todos los campos', async ({ page }) => {
  const btn = page.getByRole('button', { name: 'Nuevo proveedor' })
  if (await btn.count() === 0) { test.skip(); return }
  await btn.click()

  const nombre = `TEST_Prov_${Date.now()}`
  // Usar los inputs dentro del form del modal (evitar la barra de búsqueda de la página)
  const modalInputs = page.locator('form.modal-body input.qnt-input')
  await modalInputs.first().fill(nombre)
  await modalInputs.nth(1).fill('30-99999999-9')
  await modalInputs.nth(2).fill('Juan Test')
  await modalInputs.nth(3).fill('2990000001')
  await page.locator('form.modal-body input[type="email"]').fill('test@playwright-qnt.com')
  // Usar selector específico del form del modal para no activar el filtro de la página principal
  await page.locator('form.modal-body select.qnt-input').first().selectOption('EQUIPAMIENTO')

  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.locator('text=Proveedor creado')).toBeVisible({ timeout: 8000 })
  // Esperar a que la lista se actualice y verificar que el proveedor aparece
  await expect(page.locator(`.prov-nombre:has-text("${nombre}")`)).toBeVisible({ timeout: 12000 })
})

test('click en card de proveedor abre modal de detalle', async ({ page }) => {
  const card = page.locator('.prov-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  await expect(page.locator('.qnt-modal--wide, .qnt-modal').first()).toBeVisible()
  await expect(page.locator('text=Compras asociadas').first()).toBeVisible()
})

test('modal de detalle muestra datos del proveedor', async ({ page }) => {
  const card = page.locator('.prov-card').first()
  if (await card.count() === 0) { test.skip(); return }
  const nombre = await card.locator('.prov-nombre').textContent()
  await card.click()
  await expect(page.locator(`.qnt-modal h3:has-text("${nombre?.trim()}")`)).toBeVisible()
})

test('desde modal de detalle se puede ir a Editar', async ({ page }) => {
  const card = page.locator('.prov-card').first()
  if (await card.count() === 0) { test.skip(); return }
  await card.click()
  // Esperar a que el modal de detalle esté visible antes de buscar el botón Editar
  await expect(page.locator('text=Compras asociadas').first()).toBeVisible({ timeout: 8000 })
  // El botón Editar del modal de detalle es el último en DOM (los de tarjetas vienen primero)
  const editBtn = page.getByRole('button', { name: 'Editar' }).last()
  if (await editBtn.count() === 0) { await page.keyboard.press('Escape'); test.skip(); return }
  await editBtn.click()
  await expect(page.locator('text=Editar proveedor')).toBeVisible({ timeout: 8000 })
  await page.keyboard.press('Escape')
})

test('editar proveedor existente guarda cambios', async ({ page }) => {
  const editBtn = page.locator('.btn-act').filter({ hasText: 'Editar' }).first()
  if (await editBtn.count() === 0) { test.skip(); return }
  await editBtn.click()

  await expect(page.locator('text=Editar proveedor')).toBeVisible()
  const obs = page.locator('textarea.qnt-input').last()
  await obs.fill(`Editado por Playwright ${Date.now()}`)
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.locator('text=Proveedor actualizado')).toBeVisible({ timeout: 8000 })
})

test('filtro por categoría EQUIPAMIENTO funciona', async ({ page }) => {
  await page.locator('select').filter({ hasText: /categoría|todas/i }).first().selectOption('EQUIPAMIENTO')
  await expect(page.locator('text=Error')).not.toBeVisible()
  const cards = page.locator('.prov-card')
  const count = await cards.count()
  if (count > 0) {
    await expect(page.locator('.cat-badge--blue').first()).toBeVisible()
  }
})

test('búsqueda por nombre filtra correctamente', async ({ page }) => {
  const search = page.locator('input[placeholder*="nombre"]')
  await search.fill('XXX-NOEXISTE-999')
  await expect(page.locator('text=No se encontraron proveedores')).toBeVisible({ timeout: 8000 })
  await search.clear()
})

test('eliminar proveedor muestra confirmación y cancela', async ({ page }) => {
  const deleteBtn = page.locator('.btn-act--danger').first()
  if (await deleteBtn.count() === 0) { test.skip(); return }
  await deleteBtn.click()
  await expect(page.locator('text=¿Eliminar proveedor?')).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.locator('text=¿Eliminar proveedor?')).not.toBeVisible()
})
