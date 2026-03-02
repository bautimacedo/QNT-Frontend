# [VERSION] — [Nombre de la feature] — Especificación de diseño

**VERSIÓN:** [vX.Y.Z]  
**SLUG:** [slug]  
**PROMPT ORIGEN:** `agent-bootstrap/prompts/pendientes/[VERSION]-[SLUG].md` (o equivalente)  
**DEPENDENCIAS:** [versiones previas si aplica]  
**BACKEND:** Ver `INFORME_BACKEND_PARA_FRONTEND.md` — [recurso/endpoints relevantes]

---

## 1. Alcance y usuarios

**Qué se diseña:** [1-2 oraciones: pantallas, flujos y objetivos.]

**Usuario(s) objetivo:** [ej. Usuario con ROLE_ADMIN, usuario con ROLE_USER.]

**Problema que resuelve:** [Por qué existe esta pantalla/flujo.]

**Scope excluido (fuera de esta spec):** [Lo que no se implementa en esta versión.]

---

## 2. Pantallas y rutas

| Pantalla / Vista | Ruta (ej. en Vue Router) | Descripción breve |
|------------------|---------------------------|-------------------|
| [Nombre]         | `/ruta`                   | [Qué muestra y cuándo se usa.] |
| ...              | ...                       | ... |

**Tipo de navegación:** [SPA con rutas / modal sobre listado / wizard paso a paso.]

---

## 3. Componentes por pantalla

Para cada pantalla listada arriba, detallar:

### 3.1 [Nombre de la pantalla]

**Componente contenedor:** [ej. `Views/ComprasList.vue`]

**Estructura de componentes (jerarquía):**

```
[Contenedor]
├── [Componente A] — responsabilidad
│   ├── [Subcomponente A1]
│   └── [Subcomponente A2]
├── [Componente B] — responsabilidad
└── ...
```

**Props / eventos principales:** [Si aplica: qué recibe cada componente y qué emite.]

**Reutilización:** [Componentes existentes del proyecto que se usan; ej. DataTable, ButtonPrimary.]

---

## 4. Estados y datos

**Origen de datos:** [API REST — endpoints; store global; estado local.]

**Estados de UI a contemplar:**

| Estado    | Cuándo                       | Comportamiento / mensaje |
|-----------|------------------------------|---------------------------|
| Loading   | [ej. Mientras GET /compras]  | [Spinner / skeleton.]     |
| Vacío     | [ej. Lista sin resultados]   | [Mensaje y CTA si aplica.] |
| Error     | [ej. Fallo de red o 4xx/5xx] | [Mensaje y opción reintentar.] |
| Éxito     | [Datos cargados correctamente]| [Contenido normal.]       |

**Modelos de datos (tipos):** [Referir a INFORME_BACKEND sección X, o listar campos clave que el front debe mostrar/editar.]

---

## 5. Flujos de usuario

**Flujo principal:** [Ej. Listar compras → filtrar por tipo → abrir detalle → editar → guardar.]

1. [Paso 1]
2. [Paso 2]
3. ...

**Flujos secundarios:** [Ej. Crear nueva compra desde botón → formulario → validación → POST.]

**Eventos clave:** [Ej. Click en "Guardar" → validar formulario → PUT → mensaje éxito y cierre.]

**Validación:** [Qué se valida en cliente; qué puede devolver el backend (400) y cómo mostrarlo.]

---

## 6. Criterios de aceptación

Lista verificable para implementación y QA:

- [ ] [Criterio 1: ej. "En listado de compras se muestran columnas: proveedor, fecha, importe, tipo, moneda."]
- [ ] [Criterio 2: ej. "Filtro por tipo de compra actualiza la lista sin recargar la página."]
- [ ] [Criterio 3: ej. "Estado loading muestra skeleton o spinner hasta recibir respuesta."]
- [ ] [Criterio 4: ej. "Error de red muestra mensaje y botón Reintentar."]
- [ ] [Criterio 5: ej. "Formulario de edición valida campos obligatorios según backend."]
- [ ] [Criterio N: ...]

---

## 7. Convenciones y referencias

**Stack / design system:** [Ej. Vue 3, componentes en src/components/ui/, tokens en X.]

**Componentes existentes a usar:** [Lista si aplica.]

**Backend:** [Secciones de INFORME_BACKEND: autenticación, recursos, modelos, códigos de error.]

**Supuestos y abiertos:** [Supuestos tomados; decisiones que quedan para el equipo o el PM.]

---

*Spec generada por AgenteDesigner. El programador debe implementar siguiendo esta spec y el PASO 0 del prompt correspondiente.*
