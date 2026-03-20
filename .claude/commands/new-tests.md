# /new-tests

Lee todos los tests existentes y los componentes Vue para identificar flujos NO testeados, y crea nuevos tests exhaustivos para cubrir los casos faltantes.

## Pasos

1. **Leé todos los specs existentes** para entender qué ya está cubierto:
   - Listá todos los archivos en `tests/`
   - Leé cada spec y anotá: qué vista cubre, qué acciones testea, qué casos de error verifica

2. **Leé todos los componentes Vue en `src/views/`** para entender qué funcionalidades existen:
   - Mirá los formularios: campos, validaciones, mensajes de error
   - Mirá los modales: cómo se abren, qué datos muestran, botones de acción
   - Mirá los filtros y búsquedas
   - Mirá las tablas y grillas: qué datos muestran, qué acciones tienen por fila
   - Mirá los estados vacíos, loading, error
   - Mirá los KPI/stats que se muestran

3. **Identificá flujos NO cubiertos**, por ejemplo:
   - Crear entidad con campos inválidos (cada campo de validación)
   - Crear entidad con todos los campos opcionales vacíos
   - Crear entidad y verificar que aparece en la lista
   - Editar entidad y verificar que los cambios persisten
   - Eliminar entidad (confirmar el diálogo, verificar desaparece de la lista)
   - Filtros combinados
   - Búsqueda que no encuentra resultados
   - Navegación entre páginas (breadcrumb, botones Volver)
   - KPIs/contadores que se actualizan al crear/eliminar
   - Paginación (si existe)
   - Detalle de entidad muestra datos correctos
   - Modal de detalle tiene todos los campos esperados
   - Acciones desde modal de detalle (editar, eliminar, ver más)

4. **Escribí los nuevos tests** directamente en los archivos spec correspondientes:
   - Usá selectores robustos y específicos (clases CSS reales, placeholders exactos, roles)
   - Siempre `test.skip()` con guard cuando no hay datos en DB
   - Usá `{ timeout: 8000 }` o más para operaciones asíncronas
   - Para modales teleportados: scopeá selectores al contenedor del modal
   - Para inputs de modal vs página: usá placeholder exacto o clase del form del modal
   - Nombrá los tests descriptivamente: `'crear piloto con todos los campos completa el flujo'`

5. **Verificá que los nuevos tests corran** (aunque fallen por datos faltantes):
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && BASE_URL=https://qntdrones.com TEST_EMAIL=admin@admin.com TEST_PASSWORD=admin npx playwright test --reporter=list 2>&1
```

6. **Corregí cualquier selector roto** leyendo el componente Vue correspondiente.

7. **Commitea y pushea los nuevos tests:**
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && git add tests/ && git commit -m "test(e2e): agregar casos de prueba para flujos no cubiertos" && git push
```

8. Reportá cuántos tests nuevos se agregaron y qué flujos cubren.

## Reglas de calidad

- Cada vista debe tener al menos: carga sin error, crear con campos válidos, crear con campos inválidos (validaciones), editar, eliminar con confirmación, búsqueda/filtro, estado vacío
- Los tests deben ser independientes entre sí (no depender del orden de ejecución)
- Usá `Date.now()` para generar datos únicos en tests de creación
- Si un flujo requiere datos previos que pueden no existir, usá `if (await count === 0) { test.skip(); return }`
