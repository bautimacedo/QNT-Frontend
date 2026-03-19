import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/home/tareas')
  await page.waitForLoadState('networkidle')
})

test('kanban carga con las tres columnas', async ({ page }) => {
  await expect(page.locator('text=Pendiente')).toBeVisible()
  await expect(page.locator('text=En progreso')).toBeVisible()
  await expect(page.locator('text=Completada')).toBeVisible()
})

test('contador de tareas por columna es visible', async ({ page }) => {
  // Los chips de stats muestran número + label
  await expect(page.locator('.kanban-stats, .ks-chip').first()).toBeVisible()
})

test('botón Nueva tarea abre modal', async ({ page }) => {
  await page.getByRole('button', { name: 'Nueva tarea' }).click()
  await expect(page.locator('text=Nueva tarea').nth(1)).toBeVisible()
  await expect(page.locator('input.qnt-input[placeholder*="Describí"]')).toBeVisible()
})

test('no se puede guardar tarea sin título — botón queda deshabilitado', async ({ page }) => {
  await page.getByRole('button', { name: 'Nueva tarea' }).click()
  const btn = page.getByRole('button', { name: 'Crear tarea' })
  await expect(btn).toBeDisabled()
})

test('crear tarea PENDIENTE con prioridad ALTA', async ({ page }) => {
  await page.getByRole('button', { name: 'Nueva tarea' }).click()

  const titulo = `TEST_Tarea_${Date.now()}`
  await page.locator('input.qnt-input').fill(titulo)
  await page.locator('select').filter({ hasText: /Media|prioridad/i }).first().selectOption('ALTA')

  await page.getByRole('button', { name: 'Crear tarea' }).click()

  // Toast de confirmación
  await expect(page.locator('text=Tarea creada')).toBeVisible({ timeout: 6000 })
  // Card aparece en columna Pendiente
  await expect(page.locator(`text=${titulo}`)).toBeVisible()
})

test('crear tarea con fecha de vencimiento', async ({ page }) => {
  await page.getByRole('button', { name: 'Nueva tarea' }).click()

  const titulo = `TEST_Vence_${Date.now()}`
  await page.locator('input.qnt-input').fill(titulo)
  await page.locator('input[type="date"]').fill('2026-12-31')
  await page.getByRole('button', { name: 'Crear tarea' }).click()

  await expect(page.locator('text=Tarea creada')).toBeVisible({ timeout: 6000 })
})

test('editar una tarea existente', async ({ page }) => {
  // Verificar que hay al menos una tarea
  const editBtn = page.locator('.tc-btn').first()
  if (await editBtn.count() === 0) { test.skip(); return }

  await editBtn.first().click()
  await expect(page.locator('text=Editar tarea')).toBeVisible()

  // Modificar descripción
  await page.locator('textarea').fill(`Descripción editada por Playwright ${Date.now()}`)
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.locator('text=Tarea actualizada')).toBeVisible({ timeout: 6000 })
})

test('cancelar modal no guarda cambios', async ({ page }) => {
  await page.getByRole('button', { name: 'Nueva tarea' }).click()
  await page.locator('input.qnt-input').fill('TAREA_QUE_NO_DEBE_GUARDARSE')
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.locator('text=TAREA_QUE_NO_DEBE_GUARDARSE')).not.toBeVisible()
})

test('cerrar modal con click en overlay', async ({ page }) => {
  await page.getByRole('button', { name: 'Nueva tarea' }).click()
  await expect(page.locator('.qnt-modal')).toBeVisible()
  await page.locator('.qnt-modal-overlay').click({ position: { x: 10, y: 10 } })
  await expect(page.locator('.qnt-modal')).not.toBeVisible()
})

test('eliminar tarea muestra confirmación y elimina (solo admin)', async ({ page }) => {
  // Primero crear una tarea para eliminar
  await page.getByRole('button', { name: 'Nueva tarea' }).click()
  const titulo = `TEST_DELETE_${Date.now()}`
  await page.locator('input.qnt-input').fill(titulo)
  await page.getByRole('button', { name: 'Crear tarea' }).click()
  await expect(page.locator(`text=${titulo}`)).toBeVisible({ timeout: 6000 })

  // Buscar botón eliminar de esa card específica
  const card = page.locator('.task-card').filter({ hasText: titulo })
  const deleteBtn = card.locator('.tc-btn--del')
  if (await deleteBtn.count() === 0) {
    test.skip() // Usuario no es admin
    return
  }
  await deleteBtn.click()

  // Confirmación
  await expect(page.locator('text=Eliminar tarea')).toBeVisible()
  await expect(page.locator(`text=${titulo}`).nth(1)).toBeVisible()
  await page.getByRole('button', { name: 'Eliminar' }).click()

  await expect(page.locator('text=Tarea eliminada')).toBeVisible({ timeout: 6000 })
  await expect(page.locator(`text=${titulo}`)).not.toBeVisible()
})

test('columna EN_PROGRESO acepta tarjetas (zona de drop visible)', async ({ page }) => {
  await expect(page.locator('.kanban-col').nth(1)).toBeVisible()
  await expect(page.locator('.kanban-drop-zone').nth(1)).toBeVisible()
})
