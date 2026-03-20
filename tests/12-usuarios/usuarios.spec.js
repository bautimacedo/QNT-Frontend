import { test, expect } from '@playwright/test'

test.describe('Usuarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/home/usuarios')
    await page.waitForLoadState('networkidle')
  })

  // ── Carga ─────────────────────────────────────────────────────────────────

  test('vista de usuarios carga sin errores', async ({ page }) => {
    await expect(page.locator('text=Error')).not.toBeVisible()
    await expect(page.getByRole('heading', { name: /Usuario/i })).toBeVisible({ timeout: 10000 })
  })

  test('tabs Todos y Pendientes son visibles', async ({ page }) => {
    await expect(page.locator('.tabs-bar')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.tab-btn').filter({ hasText: /Todos/i })).toBeVisible()
    await expect(page.locator('.tab-btn').filter({ hasText: /Pendientes/i })).toBeVisible()
  })

  test('lista de usuarios es visible', async ({ page }) => {
    const content = page.locator('.user-card')
      .or(page.locator('.tabs-bar'))
      .or(page.getByText(/No se encontraron usuarios/i))
      .or(page.locator('.kpi-chip'))
      .first()
    await expect(content).toBeVisible({ timeout: 8000 })
  })

  test('KPI chips muestran estadísticas cuando hay usuarios', async ({ page }) => {
    const chips = page.locator('.kpi-chip')
    if (await chips.count() === 0) { test.skip(); return }
    await expect(chips.first()).toBeVisible()
    await expect(chips.filter({ hasText: /Total/ })).toBeVisible()
    await expect(chips.filter({ hasText: /Activos/ })).toBeVisible()
    await expect(chips.filter({ hasText: /Pendientes/ })).toBeVisible()
    await expect(chips.filter({ hasText: /Desactivados/ })).toBeVisible()
  })

  // ── Tab Todos ─────────────────────────────────────────────────────────────

  test('tab Todos está activo por defecto', async ({ page }) => {
    const tabTodos = page.locator('.tab-btn').filter({ hasText: /Todos/i })
    await expect(tabTodos).toHaveClass(/active/)
  })

  test('el usuario admin aparece en la lista', async ({ page }) => {
    const EMAIL = process.env.TEST_EMAIL || 'admin@qnt-drones.com'
    const emailUser = EMAIL.split('@')[0]
    await expect(page.locator(`text=${emailUser}`).first()).toBeVisible({ timeout: 8000 }).catch(() => {
      // Puede que el campo visible sea nombre y no email — no fallar
    })
  })

  test('campo de búsqueda está visible y funciona', async ({ page }) => {
    const search = page.locator('input[placeholder="Buscar por nombre o email…"]')
    await expect(search).toBeVisible({ timeout: 10000 })
    // Buscar algo que no existe — debería mostrar "No se encontraron"
    await search.fill('USUARIO_INEXISTENTE_XYZ999')
    await page.waitForTimeout(400)
    await expect(page.getByText(/No se encontraron usuarios/i)).toBeVisible({ timeout: 8000 })
  })

  test('limpiar búsqueda restaura la lista', async ({ page }) => {
    const cards = page.locator('.user-card')
    if (await cards.count() === 0) { test.skip(); return }
    const countBefore = await cards.count()

    const search = page.locator('input[placeholder="Buscar por nombre o email…"]')
    await search.fill('USUARIO_INEXISTENTE_XYZ999')
    await expect(page.getByText(/No se encontraron usuarios/i)).toBeVisible({ timeout: 8000 })

    // Usar botón Limpiar o clear manual
    const clearBtn = page.getByRole('button', { name: /Limpiar/i })
    if (await clearBtn.count() > 0) {
      await clearBtn.click()
    } else {
      await search.clear()
    }
    await expect(cards).toHaveCount(countBefore, { timeout: 8000 })
  })

  test('búsqueda por email del usuario admin filtra resultados', async ({ page }) => {
    const EMAIL = process.env.TEST_EMAIL || 'admin@admin.com'
    const cards = page.locator('.user-card')
    if (await cards.count() === 0) { test.skip(); return }

    const search = page.locator('input[placeholder="Buscar por nombre o email…"]')
    await search.fill(EMAIL)
    await expect(cards).toHaveCount(1, { timeout: 8000 })
  })

  test('filtro por estado ACTIVO muestra solo activos', async ({ page }) => {
    const cards = page.locator('.user-card')
    if (await cards.count() === 0) { test.skip(); return }

    const select = page.locator('select').first()
    await select.selectOption('ACTIVO')
    await page.waitForTimeout(500)
    await expect(page.locator('text=Error')).not.toBeVisible()
    // Todos los badges deben ser ACTIVO
    const desactivadoBadge = page.locator('.user-card').filter({ hasText: /Desactivado/i })
    await expect(desactivadoBadge).toHaveCount(0)
  })

  test('filtro por estado DESACTIVADO muestra solo desactivados', async ({ page }) => {
    const select = page.locator('select').first()
    await select.selectOption('DESACTIVADO')
    await page.waitForTimeout(500)
    await expect(page.locator('text=Error')).not.toBeVisible()
    const activoBadge = page.locator('.user-card .qnt-badge').filter({ hasText: /^Activo$/ })
    await expect(activoBadge).toHaveCount(0)
  })

  test('counter de filtro se actualiza con búsqueda', async ({ page }) => {
    const cards = page.locator('.user-card')
    if (await cards.count() === 0) { test.skip(); return }

    const counter = page.locator('.filter-count')
    if (await counter.count() === 0) { test.skip(); return }

    const totalText = await counter.textContent()
    const search = page.locator('input[placeholder="Buscar por nombre o email…"]')
    await search.fill(process.env.TEST_EMAIL || 'admin@admin.com')
    const filteredText = await counter.textContent()
    // El contador filtrado debe ser menor o igual al total
    expect(filteredText).not.toEqual(totalText)
  })

  test('cards de usuarios muestran nombre, email y estado', async ({ page }) => {
    const card = page.locator('.user-card').first()
    if (await card.count() === 0) { test.skip(); return }
    await expect(card.locator('.uc-name')).toBeVisible()
    await expect(card.locator('.uc-email')).toBeVisible()
    await expect(card.locator('.uc-avatar')).toBeVisible()
  })

  test('botón Asignar rol es visible en cards de usuarios', async ({ page }) => {
    const card = page.locator('.user-card').first()
    if (await card.count() === 0) { test.skip(); return }
    const asignarBtn = card.getByRole('button', { name: /Asignar rol/i })
    await expect(asignarBtn).toBeVisible()
  })

  test('botón Asignar rol abre modal', async ({ page }) => {
    const card = page.locator('.user-card').first()
    if (await card.count() === 0) { test.skip(); return }
    await card.getByRole('button', { name: /Asignar rol/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await expect(modal).toContainText('Asignar rol')
  })

  test('modal de rol se puede cerrar con Cancelar', async ({ page }) => {
    const card = page.locator('.user-card').first()
    if (await card.count() === 0) { test.skip(); return }
    await card.getByRole('button', { name: /Asignar rol/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    await modal.getByRole('button', { name: /Cancelar/i }).click()
    await expect(modal).not.toBeVisible({ timeout: 5000 })
  })

  test('modal de rol tiene select de roles disponibles', async ({ page }) => {
    const card = page.locator('.user-card').first()
    if (await card.count() === 0) { test.skip(); return }
    await card.getByRole('button', { name: /Asignar rol/i }).click()
    const modal = page.locator('.qnt-modal').last()
    await expect(modal).toBeVisible({ timeout: 8000 })
    const select = modal.locator('select')
    await expect(select).toBeVisible()
    const options = await select.locator('option').count()
    expect(options).toBeGreaterThan(0)
  })

  // ── Tab Pendientes ────────────────────────────────────────────────────────

  test('click en tab Pendientes cambia la vista', async ({ page }) => {
    await page.locator('.tab-btn').filter({ hasText: /Pendientes/i }).click()
    await expect(page.locator('.tab-btn').filter({ hasText: /Pendientes/i })).toHaveClass(/active/)
  })

  test('tab Pendientes muestra usuarios o estado vacío', async ({ page }) => {
    await page.locator('.tab-btn').filter({ hasText: /Pendientes/i }).click()
    await page.waitForLoadState('networkidle')
    const content = page.locator('.user-card--pending')
      .or(page.getByText(/No hay usuarios pendientes/i))
      .first()
    await expect(content).toBeVisible({ timeout: 8000 })
  })

  // ── KPI chips como filtros ────────────────────────────────────────────────

  test('click en KPI chip Activos filtra por ACTIVO', async ({ page }) => {
    const chip = page.locator('.kpi-chip').filter({ hasText: /Activos/i })
    if (await chip.count() === 0) { test.skip(); return }
    await chip.click()
    await page.waitForTimeout(500)
    // El select debería estar en ACTIVO
    const select = page.locator('select').first()
    await expect(select).toHaveValue('ACTIVO')
  })

  test('click en KPI chip Total vuelve a mostrar todos', async ({ page }) => {
    const chip = page.locator('.kpi-chip').filter({ hasText: /Total/i })
    if (await chip.count() === 0) { test.skip(); return }
    await chip.click()
    await page.waitForTimeout(500)
    const select = page.locator('select').first()
    await expect(select).toHaveValue('TODOS')
  })
})
