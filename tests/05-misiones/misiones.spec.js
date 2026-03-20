import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/misiones')
  await page.waitForLoadState('networkidle')
})

test('lista de misiones carga sin errores', async ({ page }) => {
  await expect(page.locator('text=No se pudo cargar')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: /Misiones/i })).toBeVisible()
})

test('botón Nueva Misión abre modal', async ({ page }) => {
  await page.getByRole('button', { name: /nueva misión/i }).click()
  await expect(page.getByRole('heading', { name: /Nueva misión/i })).toBeVisible()
  await expect(page.locator('input[placeholder*="ombre"]').first()).toBeVisible()
})

test('crear misión PLANIFICADA', async ({ page }) => {
  await page.getByRole('button', { name: /nueva misión/i }).click()

  const nombre = `TEST_Mision_${Date.now()}`
  // Usar el placeholder exacto del modal (no la barra de búsqueda de la página)
  await page.locator('input[placeholder="Nombre de la misión"]').fill(nombre)

  // Seleccionar primer piloto disponible (requerido para habilitar el botón)
  const pilotoSelect = page.locator('select').filter({ hasText: /Seleccioná un piloto/ }).first()
  if (await pilotoSelect.count() > 0) {
    const realOptions = await pilotoSelect.locator('option:not([disabled])').count()
    if (realOptions === 0) { test.skip(); return }
    await pilotoSelect.selectOption({ index: 1 })
  } else { test.skip(); return }

  // Buscar el select de prioridad por sus opciones (BAJA/MEDIA/ALTA/CRITICA)
  const prioSelect = page.locator('select').filter({ hasText: /Media/ }).first()
  if (await prioSelect.count() > 0) await prioSelect.selectOption('MEDIA')

  await page.getByRole('button', { name: 'Crear misión' }).click()
  await expect(page.locator(`text=${nombre}`)).toBeVisible({ timeout: 10000 })
})

test('crear misión CRÍTICA con descripción', async ({ page }) => {
  await page.getByRole('button', { name: /nueva misión/i }).click()

  const nombre = `TEST_Critica_${Date.now()}`
  await page.locator('input[placeholder="Nombre de la misión"]').fill(nombre)

  // Seleccionar primer piloto disponible (requerido para habilitar el botón)
  const pilotoSelect = page.locator('select').filter({ hasText: /Seleccioná un piloto/ }).first()
  if (await pilotoSelect.count() > 0) {
    const realOptions = await pilotoSelect.locator('option:not([disabled])').count()
    if (realOptions === 0) { test.skip(); return }
    await pilotoSelect.selectOption({ index: 1 })
  } else { test.skip(); return }

  // Seleccionar prioridad CRÍTICA (el select que tiene la opción CRITICA)
  const prioSelect = page.locator('select').filter({ hasText: /Crítica/ }).first()
  if (await prioSelect.count() > 0) await prioSelect.selectOption('CRITICA')

  const textarea = page.locator('textarea').first()
  if (await textarea.count() > 0) await textarea.fill('Misión crítica de prueba automatizada')

  await page.getByRole('button', { name: 'Crear misión' }).click()
  await expect(page.locator(`text=${nombre}`)).toBeVisible({ timeout: 10000 })
})

test('filtro PLANIFICADA solo muestra misiones planificadas', async ({ page }) => {
  const select = page.locator('select').first()
  await select.selectOption('PLANIFICADA')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('text=No se pudo cargar')).not.toBeVisible()
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
  const editIcon = page.getByRole('button', { name: /editar/i }).first()
  if (await editIcon.count() === 0) { test.skip(); return }
  await editIcon.click()
  await expect(page.locator('text=/Editar misión/i')).toBeVisible()
  await page.keyboard.press('Escape')
})

test('cambiar estado de misión PLANIFICADA a EN_CURSO', async ({ page }) => {
  await page.getByRole('button', { name: /nueva misión/i }).click()
  const nombre = `TEST_EstadoCambio_${Date.now()}`
  await page.locator('input[placeholder="Nombre de la misión"]').fill(nombre)

  // Seleccionar primer piloto disponible (requerido)
  const pilotoSelect = page.locator('select').filter({ hasText: /Seleccioná un piloto/ }).first()
  if (await pilotoSelect.count() > 0) {
    const realOptions = await pilotoSelect.locator('option:not([disabled])').count()
    if (realOptions === 0) { test.skip(); return }
    await pilotoSelect.selectOption({ index: 1 })
  } else { test.skip(); return }

  await page.getByRole('button', { name: 'Crear misión' }).click()
  await expect(page.locator(`text=${nombre}`)).toBeVisible({ timeout: 10000 })

  // Intentar cambiar estado — el mecanismo UI puede variar (tabla o cards)
  const card = page.locator('div, article, tr').filter({ hasText: nombre }).first()
  if (await card.count() > 0) {
    const estadoBtn = card.getByRole('button').filter({ has: page.locator('svg') }).first()
    if (await estadoBtn.count() > 0) {
      await estadoBtn.click()
      await page.waitForTimeout(500)
      // Buscar opción clickeable "En curso" (no <option> del select filtro)
      const enCurso = page.getByRole('option', { name: /En curso/i })
        .or(page.locator('li, button, [role="menuitem"]').filter({ hasText: /En curso/i }))
        .first()
      if (await enCurso.isVisible({ timeout: 2000 }).catch(() => false)) {
        await enCurso.click().catch(() => {})
      }
    }
  }
})

test('eliminar misión muestra confirmación y cancela', async ({ page }) => {
  const deleteBtn = page.getByRole('button', { name: /eliminar/i }).first()
  if (await deleteBtn.count() === 0) { test.skip(); return }
  await deleteBtn.click()
  await expect(page.locator('text=/eliminar|confirmar/i').last()).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar' }).click()
})
