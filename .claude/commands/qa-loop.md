# /qa-loop

Pipeline de QA continuo con múltiples pasadas. Itera hasta que:
- Todos los tests existentes pasan (o están skipped por falta de datos en DB)
- No quedan flujos sin cobertura en ninguna vista

## Algoritmo

Repetí este ciclo hasta que no haya más trabajo pendiente:

### FASE 1 — Arreglar tests existentes

1. Corré la suite completa:
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && BASE_URL=https://qntdrones.com TEST_EMAIL=admin@admin.com TEST_PASSWORD=admin npx playwright test --reporter=list 2>&1
```

2. Si hay tests **fallidos** (no skipped):
   - Para cada test fallido, leé el archivo `.spec.js`
   - Identificá el selector o locator que falla
   - Leé el componente Vue en `src/views/` o `src/components/` que corresponde a esa vista
   - Corregí el selector con lo que realmente existe en el HTML del componente
   - Repetí hasta que no queden fallos reales (los skipped están bien)

3. Corré de nuevo para confirmar que los fallos están resueltos.

4. Si se corrigió algo → commitear:
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && git add tests/ && git commit -m "fix(e2e): corregir tests fallidos - pasada automatica" && git push
```

### FASE 2 — Buscar flujos sin cobertura

5. Leé TODOS los archivos en `src/views/` (incluyendo subdirectorios como `stock/`).

6. Para cada vista, analizá qué funcionalidades tiene:
   - Formularios de creación: ¿qué campos? ¿qué validaciones? ¿qué toast de éxito?
   - Modales de detalle: ¿qué datos muestra? ¿qué botones tiene?
   - Modales de edición: ¿qué campos? ¿qué toast de éxito?
   - Confirmación de eliminación: ¿qué texto muestra? ¿qué pasa después?
   - Filtros y búsquedas: ¿qué opciones tienen? ¿qué pasa con búsqueda sin resultados?
   - KPIs y contadores: ¿se actualizan?
   - Estados vacíos: ¿qué texto muestra cuando no hay datos?
   - Navegación: breadcrumb, botones "Volver", links a detalle
   - Tabs: ¿hay tabs? ¿cada tab tiene su propio contenido?

7. Leé el spec correspondiente a esa vista y comparás qué cubre vs qué existe.

8. **Si encontrás flujos no cubiertos** → escribí los tests en el spec correspondiente:
   - Usá selectores robustos basados en lo que leíste del componente Vue
   - Para modales teleportados: scopeá al contenedor (`.qnt-modal`, `form.modal-body`, `.qnt-modal__body`)
   - Para inputs de modal vs página: usá el placeholder exacto del Vue template
   - Usá `Date.now()` para datos únicos en tests de creación
   - Guardá con `test.skip()` + guard cuando puede no haber datos en DB
   - Timeouts de `8000ms` o más para operaciones asíncronas

### FASE 3 — Verificar los tests nuevos

9. Corré solo los archivos donde escribiste tests nuevos:
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && BASE_URL=https://qntdrones.com TEST_EMAIL=admin@admin.com TEST_PASSWORD=admin npx playwright test [archivo] --reporter=list 2>&1
```

10. Si los nuevos tests fallan por selectores incorrectos → corregí leyendo el componente Vue de nuevo.

11. Una vez que pasan (o están correctamente skipped) → commitear:
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && git add tests/ && git commit -m "test(e2e): nuevos casos de prueba para flujos no cubiertos" && git push
```

### FASE 4 — Decidir si continuar

12. Volvé a revisar TODAS las vistas que todavía tengan flujos sin cubrir.

13. **Si quedan vistas con flujos sin cobertura** → volvé a FASE 2 con la próxima vista.

14. **Si todas las vistas tienen cobertura completa** → terminá y reportá.

## Criterio de "cobertura completa" para una vista

Una vista está completamente cubierta cuando tiene tests para:
- [ ] Carga sin errores (heading visible, no error message)
- [ ] Estado vacío (mensaje cuando no hay datos)
- [ ] Crear entidad válida (con campos mínimos)
- [ ] Crear entidad con todos los campos opcionales
- [ ] Validación: no se puede guardar sin campos requeridos
- [ ] Validación: cada campo con formato inválido muestra error
- [ ] Editar entidad existente y guardar cambios
- [ ] Eliminar con diálogo de confirmación (y cancelar)
- [ ] Búsqueda/filtro que encuentra resultados
- [ ] Búsqueda/filtro sin resultados muestra mensaje apropiado
- [ ] Click en card/fila abre modal o navega al detalle
- [ ] Modal de detalle muestra datos correctos
- [ ] Si hay tabs: cada tab carga sin errores

## Vistas a cubrir (en orden de prioridad)

1. `src/views/PilotosView.vue` → `tests/08-pilotos/pilotos.spec.js`
2. `src/views/PilotoPerfilDetalleView.vue` → `tests/08-pilotos/piloto-perfil.spec.js` (crear si no existe)
3. `src/views/MantenimientoView.vue` → `tests/07-mantenimiento/mantenimiento.spec.js`
4. `src/views/LibrosVueloView.vue` → `tests/15-libros-vuelo/libros-vuelo.spec.js`
5. `src/views/stock/StockDronesView.vue` → `tests/03-stock/stock-drones.spec.js` (crear si no existe)
6. `src/views/stock/StockDronDetalleView.vue` → `tests/03-stock/stock-dron-detalle.spec.js` (crear si no existe)
7. `src/views/stock/StockBateriasView.vue` → `tests/03-stock/stock-baterias.spec.js` (crear si no existe)
8. `src/views/stock/StockDocksView.vue` → `tests/03-stock/stock-docks.spec.js` (crear si no existe)
9. `src/views/stock/StockHelicesView.vue` → `tests/03-stock/stock-helices.spec.js` (crear si no existe)
10. `src/views/stock/StockAntenasRtkView.vue` → `tests/03-stock/stock-antenas-rtk.spec.js` (crear si no existe)
11. `src/views/stock/StockAntenasStarlinkView.vue` → `tests/03-stock/stock-antenas-starlink.spec.js` (crear si no existe)
12. `src/views/stock/StockAccesoriosView.vue` → `tests/03-stock/stock-accesorios.spec.js` (crear si no existe)
13. `src/views/ComprasView.vue` → `tests/04-compras/compras.spec.js`
14. `src/views/ProveedoresView.vue` → `tests/09-proveedores/proveedores.spec.js`
15. `src/views/SegurosView.vue` → `tests/10-seguros/seguros.spec.js`
16. `src/views/LicenciasView.vue` → `tests/11-licencias/licencias.spec.js`
17. `src/views/MisionesView.vue` → `tests/05-misiones/misiones.spec.js`
18. `src/views/UsuariosView.vue` → `tests/12-usuarios/usuarios.spec.js`

## Notas técnicas críticas

- **Teleport DOM order**: modales teleportados a `<body>` aparecen DESPUÉS de los elementos de la página. `.first()` va a matchear la página, no el modal. Solución: scopear al modal o usar `.last()` para botones de detalle
- **Input de modal vs búsqueda**: el input de búsqueda de la página tiene `placeholder` diferente al del modal. Usá el placeholder exacto del Vue template
- **Proveedores modal**: la forma tiene clase `form.modal-body`, usar `page.locator('form.modal-body input.qnt-input')` para scopear
- **HTML5 email validation**: bloquea submit antes de que Vue valide. Fix: `page.evaluate(() => { document.querySelector('form').noValidate = true })`
- **Sidebar navigation**: clase `.sidebar__item`. Para ver secciones de Operaciones/Administración, primero hacer click en `.header__tab` correspondiente
- **Misiones**: el botón "Crear misión" requiere tanto `nombre` como `pilotoId`. Siempre seleccionar piloto además del nombre
- **Toast messages**: después de crear/editar/eliminar esperar el toast con `{ timeout: 8000 }`

## Reporte final

Al terminar, mostrá:
- Total de tests: antes vs después
- Tests por estado: passed / failed / skipped / flaky
- Vistas cubiertas completamente
- Commits pusheados
