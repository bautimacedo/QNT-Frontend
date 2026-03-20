# /run-tests

Ejecuta la suite completa de tests de Playwright contra producción y reporta los resultados.

## Pasos

1. Corré la suite completa:
```
cd "/home/bauti/Proyectos GITHUB/QNT-Frontend/QNT-Frontend" && BASE_URL=https://qntdrones.com TEST_EMAIL=admin@admin.com TEST_PASSWORD=admin npx playwright test --reporter=list 2>&1
```

2. Mostrá un resumen claro con:
   - Total passed / failed / skipped / flaky
   - Lista de tests fallidos con el nombre exacto y archivo
   - Lista de tests flaky (pasan en retry)
   - Cualquier error de configuración o timeout

3. Si hay tests fallidos, indicá cuáles archivos de componentes Vue habría que revisar para corregirlos.
