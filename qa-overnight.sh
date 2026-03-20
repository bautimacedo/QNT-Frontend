#!/usr/bin/env bash
# ============================================================
# qa-overnight.sh — Loop de QA autónomo (5 horas)
# Demo cliente QNT: 20/03/2026 12:00 Argentina
#
# Uso:   bash qa-overnight.sh
# Logs:  qa-overnight.log
# Stop:  Ctrl+C en cualquier momento
# ============================================================

set -euo pipefail

WORKDIR="/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend"
LOG="$WORKDIR/qa-overnight.log"
DURATION_HOURS=5
DURATION_SECS=$((DURATION_HOURS * 3600))
START_TS=$(date +%s)
ITERATION=0

# ── Colores ──────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo -e "$msg" | tee -a "$LOG"
}

header() {
  echo -e "\n${CYAN}══════════════════════════════════════════${NC}" | tee -a "$LOG"
  echo -e "${CYAN}  $*${NC}" | tee -a "$LOG"
  echo -e "${CYAN}══════════════════════════════════════════${NC}\n" | tee -a "$LOG"
}

time_left() {
  local elapsed=$(( $(date +%s) - START_TS ))
  local left=$(( DURATION_SECS - elapsed ))
  local h=$(( left / 3600 ))
  local m=$(( (left % 3600) / 60 ))
  echo "${h}h ${m}m restantes"
}

# ── Prompt que se pasa a Claude en cada iteración ────────────
QA_PROMPT='Sos un QA Engineer automatizado trabajando en el proyecto QNT Drones Frontend.
Hay una demo al cliente el 20 de marzo de 2026 a las 12:00 PM Argentina. La app debe estar completamente testeada.

El proyecto está en: /home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend
Tests Playwright contra producción: BASE_URL=https://qntdrones.com TEST_EMAIL=admin@admin.com TEST_PASSWORD=admin

## TU TAREA EN ESTA ITERACIÓN:

### PASO 1 — Correr todos los tests y analizar fallos
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && BASE_URL=https://qntdrones.com TEST_EMAIL=admin@admin.com TEST_PASSWORD=admin npx playwright test --reporter=list 2>&1
```
Anotá: cuántos passed, failed, skipped, flaky.

### PASO 2 — Arreglar TODOS los tests fallidos
Para cada test fallido (no skipped):
- Leé el archivo .spec.js
- Leé el componente Vue correspondiente en src/views/ o src/components/
- Identificá el selector incorrecto (clases CSS, placeholder, role)
- Corregí el spec
- Volvé a correr ese archivo específico para verificar

Reglas críticas:
- Modales con <Teleport to="body"> aparecen AL FINAL del DOM. .first() matchea la página, no el modal. Usá placeholder exacto del Vue template o scopeá al contenedor del modal (.qnt-modal, form.modal-body, .qnt-modal__body)
- Para misiones: el botón requiere tanto nombre como pilotoId. Usar input[placeholder="Nombre de la misión"] (capital N)
- Para proveedores modal: form.modal-body input.qnt-input
- Para email HTML5 nativo: page.evaluate(() => { document.querySelector("form").noValidate = true })
- Sidebar: clase .sidebar__item. Para Stock/Compras: primero click en .header__tab

### PASO 3 — Verificar que los fixes funcionan
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && BASE_URL=https://qntdrones.com TEST_EMAIL=admin@admin.com TEST_PASSWORD=admin npx playwright test --reporter=list 2>&1
```
Si quedan fallos reales (no skipped), volvé al PASO 2.

### PASO 4 — Commitear fixes si hubo cambios
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && git diff --name-only tests/ | head -5
```
Si hay cambios: `git add tests/ && git commit -m "fix(e2e): corregir tests fallidos iteracion automatica" && git push`

### PASO 5 — Identificar flujos SIN COBERTURA
Leé los siguientes componentes Vue y compará con sus specs:
- src/views/PilotosView.vue → tests/08-pilotos/pilotos.spec.js
- src/views/PilotoPerfilDetalleView.vue → tests/08-pilotos/piloto-perfil.spec.js (crear si no existe)
- src/views/MantenimientoView.vue → tests/07-mantenimiento/mantenimiento.spec.js
- src/views/LibrosVueloView.vue → tests/15-libros-vuelo/libros-vuelo.spec.js
- src/views/stock/StockDronesView.vue → tests/03-stock/stock-drones.spec.js (crear si no existe)
- src/views/stock/StockDronDetalleView.vue → tests/03-stock/stock-dron-detalle.spec.js (crear si no existe)
- src/views/stock/StockBateriasView.vue → tests/03-stock/stock-baterias.spec.js (crear si no existe)
- src/views/stock/StockDocksView.vue → tests/03-stock/stock-docks.spec.js (crear si no existe)
- src/views/stock/StockHelicesView.vue → tests/03-stock/stock-helices.spec.js (crear si no existe)
- src/views/stock/StockAntenasRtkView.vue → tests/03-stock/stock-antenas-rtk.spec.js (crear si no existe)
- src/views/stock/StockAntenasStarlinkView.vue → tests/03-stock/stock-antenas-starlink.spec.js (crear si no existe)
- src/views/stock/StockAccesoriosView.vue → tests/03-stock/stock-accesorios.spec.js (crear si no existe)
- src/views/ComprasView.vue → tests/04-compras/compras.spec.js
- src/views/ProveedoresView.vue → tests/09-proveedores/proveedores.spec.js
- src/views/SegurosView.vue → tests/10-seguros/seguros.spec.js
- src/views/LicenciasView.vue → tests/11-licencias/licencias.spec.js
- src/views/MisionesView.vue → tests/05-misiones/misiones.spec.js
- src/views/UsuariosView.vue → tests/12-usuarios/usuarios.spec.js

Cobertura completa de una vista = tiene tests para:
- Carga sin errores
- Estado vacío (mensaje cuando no hay datos)
- Crear con datos válidos (toast de éxito, aparece en lista)
- Crear con datos inválidos (cada validación)
- Editar y guardar cambios
- Eliminar con confirmación (y cancelar)
- Búsqueda/filtro con resultados
- Búsqueda sin resultados
- Click en card/fila → modal o detalle
- Modal de detalle muestra datos correctos
- Si hay tabs: cada tab funciona

### PASO 6 — Escribir tests para los flujos faltantes
Elegí la vista con MENOS cobertura y escribí tests exhaustivos para ella.
Usá selectores basados en lo que leíste del Vue template.
Usá Date.now() para datos únicos en creates.
Timeout de 8000ms+ para operaciones async.

### PASO 7 — Correr los tests nuevos y arreglar si fallan
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && BASE_URL=https://qntdrones.com TEST_EMAIL=admin@admin.com TEST_PASSWORD=admin npx playwright test [archivo-especifico] --reporter=list 2>&1
```

### PASO 8 — Commitear y pushear los tests nuevos
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && git add tests/ && git commit -m "test(e2e): nuevos casos de prueba - [nombre de la vista]" && git push
```

### REPORTE FINAL
Al terminar esta iteración reportá:
- Tests: X passed, Y failed, Z skipped antes → A passed, B failed, C skipped después
- Tests nuevos agregados: [lista]
- Vistas con cobertura completa: [lista]
- Commits pusheados: [lista]
- Próxima vista a cubrir en la siguiente iteración: [nombre]
'

# ── Main loop ─────────────────────────────────────────────────
echo "" > "$LOG"
header "QA OVERNIGHT — Demo 20/03/2026 12:00 AR"
log "Inicio: $(date)"
log "Duracion: ${DURATION_HOURS}h (hasta $(date -d "+${DURATION_HOURS} hours" '+%H:%M:%S'))"
log "Logs en: $LOG"
echo ""

while true; do
  NOW_TS=$(date +%s)
  ELAPSED=$(( NOW_TS - START_TS ))

  # Chequear si se agotó el tiempo
  if [ $ELAPSED -ge $DURATION_SECS ]; then
    header "TIEMPO COMPLETADO — ${DURATION_HOURS}h de QA"
    log "Fin: $(date)"
    log "Total iteraciones completadas: $ITERATION"
    log "Chequeá el log completo en: $LOG"
    log ""
    log "REPORTE FINAL DE TESTS:"
    cd "$WORKDIR" && BASE_URL=https://qntdrones.com TEST_EMAIL=admin@admin.com TEST_PASSWORD=admin npx playwright test --reporter=list 2>&1 | tail -20 | tee -a "$LOG"
    break
  fi

  ITERATION=$(( ITERATION + 1 ))
  header "ITERACION #${ITERATION} — $(time_left)"
  log "Ejecutando Claude con qa-loop prompt..."

  # Correr Claude no-interactivo con el prompt completo
  cd "$WORKDIR" && claude --dangerously-skip-permissions -p "$QA_PROMPT" 2>&1 | tee -a "$LOG"

  log ""
  log "Iteracion #${ITERATION} completada."
  log "Elapsed: $(( ($(date +%s) - START_TS) / 60 ))min — $(time_left)"

  # Pausa breve entre iteraciones (30 segundos para no sobrecargar)
  log "Pausa 30s antes de la proxima iteracion..."
  sleep 30
done

echo -e "\n${GREEN}QA overnight completado. Revisá qa-overnight.log para el historial completo.${NC}"
