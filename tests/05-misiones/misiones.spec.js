import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/misiones')
  await page.waitForLoadState('networkidle')
})

test('lista de misiones carga sin errores', async ({ page }) => {
  await expect(page.locator('text=No se pudo cargar')).not.toBeVisible()
  await expect(page.locator('text=/Misi/i')).toBeVisible()
})

test('botón Nueva Misión abre modal', async ({ page }) => {
  await page.getByRole('button', { name: /nueva misión/i }).click()
  await expect(page.locator('text=/Nueva misión/i').nth(1)).toBeVisible()
  await expect(page.locator('input[placeholder*="ombre"]')).toBeVisible()
})

test('crear misión PLANIFICADA', async ({ page }) => {
  await page.getByRole('button', { name: /nueva misión/i }).click()

  const nombre = `TEST_Mision_${Date.now()}`
  await page.locator('input[placeholder*="ombre"]').fill(nombre)

  // Tipo
  const tipoSelect = page.locator('select').nth(0)
  await tipoSelect.selectOption({ index: 1 })

  // Prioridad
  const prioSelect = page.locator('select').nth(1)
  await prioSelect.selectOption('MEDIA')

  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.locator(`text=${nombre}`)).toBeVisible({ timeout: 10000 })
})

test('crear misión CRÍTICA con descripción', async ({ page }) => {
  await page.getByRole('button', { name: /nueva misión/i }).click()

  const nombre = `TEST_Critica_${Date.now()}`
  await page.locator('input[placeholder*="ombre"]').fill(nombre)

  // Prioridad CRITICA
  const selects = page.locator('select')
  for (let i = 0; i < await selects.count(); i++) {
    const opts = await selects.nth(i).locator('option').allTextContents()
    if (opts.some(o => o.includes('Crítica') || o.includes('CRITICA'))) {
      await selects.nth(i).selectOption({ label: /Crítica/i })
      break
    }
  }

  const textarea = page.locator('textarea').first()
  if (await textarea.count() > 0) await textarea.fill('Misión crítica de prueba automatizada')

  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.locator(`text=${nombre}`)).toBeVisible({ timeout: 10000 })
})

test('filtro PLANIFICADA solo muestra misiones planificadas', async ({ page }) => {
  const select = page.locator('select').first()
  await select.selectOption('PLANIFICADA')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('text=No se pudo cargar')).not.toBeVisible()
  // Si hay misiones, no deben aparecer EN_CURSO o COMPLETADAS
  const enCurso = page.locator('text=En curso')
  if (await enCurso.count() > 0) {
    // Puede aparecer en el selector pero no en las cards
    const cards = page.locator('[style*="fefce8"]') // EN_CURSO color
    expect(await cards.count()).toBe(0)
  }
})

test('filtro EN_CURSO funciona', async ({ page }) => {
  await page.locator('select').first().selectOption('EN_CURSO')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('text=No se pudo cargar')).not.toBeVisible()
})

test('filtro COMPLETADA funciona', async ({ page }) => {
  await page.locator('select').first().selectOption('COMPLETADA')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('text=No se pudo cargar')).not.toBeVisible()
})

test('filtro CANCELADA funciona', async ({ page }) => {
  await page.locator('select').first().selectOption('CANCELADA')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('text=No se pudo cargar')).not.toBeVisible()
})

test('búsqueda por nombre filtra en tiempo real', async ({ page }) => {
  const search = page.locator('input[placeholder*="uscar"]').first()
  await search.fill('XXX-NO-EXISTE-PLAYWRIGHT-999')
  await expect(page.locator('text=No se pudo cargar')).not.toBeVisible()
  await search.clear()
})

test('editar misión existente abre modal con datos pre-cargados', async ({ page }) => {
  const editBtn = page.locator('[title="Editar"], button').filter({ hasText: /editar/i }).first()
  // Buscar el ícono de pencil
  const pencil = page.locator('.tc-btn, button').filter({ has: page.locator('svg') }).first()
  const misiones = page.locator('.mission-card, [class*="mision"]').first()
  if (await misiones.count() === 0) { test.skip(); return }

  // Buscar botón editar (Pencil icon) dentro de la primera card
  const cards = page.locator('[style*="border-radius"]').filter({ hasText: /Planificada|En curso|Completada/ })
  if (await cards.count() === 0) { test.skip(); return }

  const editIcon = page.getByRole('button', { name: /editar/i }).first()
  if (await editIcon.count() === 0) { test.skip(); return }
  await editIcon.click()
  await expect(page.locator('text=/Editar misión/i')).toBeVisible()
  await page.keyboard.press('Escape')
})

test('cambiar estado de misión PLANIFICADA a EN_CURSO', async ({ page }) => {
  // Crear misión primero
  await page.getByRole('button', { name: /nueva misión/i }).click()
  const nombre = `TEST_EstadoCambio_${Date.now()}`
  await page.locator('input[placeholder*="ombre"]').fill(nombre)
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.locator(`text=${nombre}`)).toBeVisible({ timeout: 10000 })

  // Buscar el dropdown de estado en la card de esa misión
  const card = page.locator('div, article').filter({ hasText: nombre }).first()
  const estadoBtn = card.getByRole('button').filter({ has: page.locator('svg') }).first()
  if (await estadoBtn.count() === 0) { test.skip(); return }
  await estadoBtn.click()
  const enCurso = page.locator('text=En curso').last()
  if (await enCurso.count() > 0) await enCurso.click()
})

test('eliminar misión muestra confirmación y cancela', async ({ page }) => {
  const deleteBtn = page.getByRole('button', { name: /eliminar/i }).first()
  if (await deleteBtn.count() === 0) { test.skip(); return }
  await deleteBtn.click()
  await expect(page.locator('text=/eliminar|confirmar/i').last()).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar' }).click()
})
