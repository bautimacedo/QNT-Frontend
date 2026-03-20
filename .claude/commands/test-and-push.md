# /test-and-push

Pipeline completo: corre los tests, arregla los que fallan, agrega nuevos tests para flujos no cubiertos, y pushea todo a git.

## Pasos

1. **Corré los tests actuales y analizá el estado:**
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && BASE_URL=https://qntdrones.com TEST_EMAIL=admin@admin.com TEST_PASSWORD=admin npx playwright test --reporter=list 2>&1
```

2. **Corregí todos los tests fallidos:**
   - Para cada fallo, leé el spec y el componente Vue correspondiente
   - Identificá el selector roto (clases CSS incorrectas, placeholder erróneo, teleport DOM ordering)
   - Corregí y re-testeá ese archivo específico antes de continuar

3. **Verificá que todos los tests existentes pasan:**
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && BASE_URL=https://qntdrones.com TEST_EMAIL=admin@admin.com TEST_PASSWORD=admin npx playwright test --reporter=list 2>&1
```
   - Si siguen fallando, volvé al paso 2
   - Si pasan (o son skipped por datos), continuá

4. **Identificá flujos no cubiertos** leyendo los componentes Vue en `src/views/` que no tienen tests completos, o tienen tests muy básicos (solo carga sin errores).

5. **Escribí tests nuevos** para los flujos identificados, agregándolos a los specs existentes o creando nuevos archivos en el directorio correcto.

6. **Verificá que los nuevos tests corran correctamente:**
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && BASE_URL=https://qntdrones.com TEST_EMAIL=admin@admin.com TEST_PASSWORD=admin npx playwright test --reporter=list 2>&1
```

7. **Commitea y pushea todo:**
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && git add tests/ && git commit -m "test(e2e): fixes y nuevos casos de prueba" && git push
```

8. **Reportá el resultado final:**
   - Tests passed / failed / skipped antes y después
   - Qué tests se corrigieron
   - Qué tests nuevos se agregaron
   - Commit pusheado

## Notas técnicas importantes

- Los modales con `<Teleport to="body">` aparecen AL FINAL del DOM → siempre puede haber conflicto con selectores genéricos de la página principal
- `input[placeholder="Nombre de la misión"]` (capital N) → modal. `input[placeholder*="buscar"]` (minúscula) → barra de búsqueda de la página
- Para el formulario de proveedores: `form.modal-body input.qnt-input` scopea al modal
- Botones de acción en el modal de detalle: usar `.last()` porque los de las cards vienen antes en DOM
- Para validación de email con `type="email"` nativo: agregar `page.evaluate(() => { document.querySelector('form').noValidate = true })` antes del submit
- Sidebar: `.sidebar__item` (no `.nav-item`). Para ver Stock → primero click en tab `Operaciones` en `.header__tab`
