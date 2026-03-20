# /fix-tests

Analiza los tests fallidos de Playwright, lee los componentes Vue correspondientes para entender los selectores correctos, corrige los tests, verifica que pasen, y commitea los cambios.

## Pasos

1. **Corré los tests y capturá los fallos:**
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && BASE_URL=https://qntdrones.com TEST_EMAIL=admin@admin.com TEST_PASSWORD=admin npx playwright test --reporter=list 2>&1
```

2. **Para cada test fallido:**
   - Leé el archivo `.spec.js` correspondiente
   - Identificá el selector o locator que falla
   - Buscá el componente Vue relevante en `src/views/` o `src/components/`
   - Leé el componente para entender las clases CSS, IDs, placeholders, roles, y textos reales
   - Corregí el selector en el spec

3. **Consideraciones importantes al corregir:**
   - Los modales usan `<Teleport to="body">` — aparecen AL FINAL del DOM, entonces `.first()` puede matchear elementos de la página principal. Usá selectores específicos del modal o `.last()`
   - Los `input[placeholder="..."]` de los modales tienen placeholders exactos distintos a la barra de búsqueda de la página
   - Los selects del modal: scopear con el contenedor del modal (ej: `.qnt-modal select`, `form.modal-body select`)
   - La barra de búsqueda y filtros de la página principal siempre están ANTES en el DOM que los del modal teleportado
   - Botones de acción en cards vs modal: los del modal suelen ser `.last()`

4. **Verificá las correcciones:**
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && BASE_URL=https://qntdrones.com TEST_EMAIL=admin@admin.com TEST_PASSWORD=admin npx playwright test --reporter=list 2>&1
```

5. **Si los tests pasan, commitea y pushea:**
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && git add tests/ && git commit -m "fix(e2e): corregir selectores en tests fallidos" && git push
```

6. Reportá qué se corrigió y el estado final (passed/failed/skipped).
