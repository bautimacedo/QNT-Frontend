# v0.6.0 — Listado y formulario de Compras — Especificación de diseño

**VERSIÓN:** v0.6.0  
**SLUG:** compras-crud-ui  
**PROMPT ORIGEN:** `agent-bootstrap/prompts/pendientes/v0.6.0-compras-crud-ui.md`  
**DEPENDENCIAS:** v0.4.0 (auth, layout, rutas base)  
**BACKEND:** Ver `INFORME_BACKEND_PARA_FRONTEND.md` — Compras (sección 5.4), modelos 6.6–6.9, TipoCompra (sección 10)

---

## 1. Alcance y usuarios

**Qué se diseña:** Pantalla de listado de compras con filtros y acciones (ver, editar, eliminar según rol), y formulario de alta/edición de compra (modal o ruta dedicada), alineado al API REST de compras.

**Usuario(s) objetivo:** ROLE_ADMIN y ROLE_USER (ambos pueden listar y CRUD; solo ADMIN puede eliminar).

**Problema que resuelve:** Centralizar la gestión de compras en la aplicación web sin depender de herramientas externas; listar, filtrar, crear y editar compras con validación y feedback claro.

**Scope excluido (fuera de esta spec):** Subida/descarga de imagen de factura (PUT/GET .../imagen) se deja para una versión posterior; en esta solo se muestran los datos de la compra.

---

## 2. Pantallas y rutas

| Pantalla / Vista     | Ruta (Vue Router) | Descripción breve |
|----------------------|-------------------|-------------------|
| Listado de compras   | `/compras`        | Tabla con columnas clave, filtros por tipo y búsqueda, acciones por fila. |
| Formulario compra    | `/compras/nueva`, `/compras/:id/editar` | Formulario para crear o editar una compra; campos según CreateCompraRequest. |

**Tipo de navegación:** SPA; listado como vista principal; formulario como rutas hijas o modal (definir en convención del proyecto). Se asume rutas dedicadas para formulario.

---

## 3. Componentes por pantalla

### 3.1 Listado de compras

**Componente contenedor:** `Views/Compras/ComprasList.vue` (o equivalente según estructura del proyecto)

**Estructura de componentes (jerarquía):**

```
ComprasList
├── PageHeader — título "Compras", botón "Nueva compra"
├── ComprasFilters — filtro por tipo (TipoCompra), opcionalmente por rango de fechas
│   └── Select (tipo) + DateRange (opcional)
├── ComprasTable — tabla de datos
│   ├── TableHeader — columnas: Proveedor, Fecha compra, Fecha factura, Nº factura, Importe, Moneda, Tipo, Acciones
│   ├── TableBody — una fila por compra; acciones: Ver, Editar; Eliminar solo si ROLE_ADMIN
│   └── EmptyState — mensaje cuando no hay resultados
├── LoadingState — skeleton o spinner mientras GET /compras
└── ErrorState — mensaje de error y botón "Reintentar"
```

**Props / eventos principales:** ComprasTable recibe `compras: Compra[]` y `userRole: string`; emite `edit(id)`, `delete(id)`; Eliminar con confirmación antes de DELETE.

**Reutilización:** Usar componente de tabla existente (DataTable o similar) y botones primarios/secundarios del design system.

### 3.2 Formulario compra (alta / edición)

**Componente contenedor:** `Views/Compras/CompraForm.vue`

**Estructura de componentes (jerarquía):**

```
CompraForm
├── PageHeader — título "Nueva compra" o "Editar compra"
├── Form (campos según CreateCompraRequest)
│   ├── Proveedor — select por proveedorId o input proveedorNombre (según backend)
│   ├── Fecha compra (obligatorio), Fecha factura (opcional)
│   ├── Nº factura, Importe (obligatorio, > 0), Moneda (default ARS)
│   ├── Tipo compra (select con enum TipoCompra)
│   ├── Descripción, Site (select por siteId), Observaciones
│   └── FormActions — Botón "Guardar", "Cancelar" (vuelve al listado)
├── LoadingState — al enviar POST/PUT
└── ErrorMessage — validación cliente o mensaje 400/409 del backend
```

**Validación en cliente:** Obligatorios: fechaCompra, importe > 0, tipoCompra; al menos uno de proveedorId o proveedorNombre. Mostrar errores inline o resumen según convención del proyecto.

---

## 4. Estados y datos

**Origen de datos:** API REST — `GET /api/qnt/v1/compras`, `GET /api/qnt/v1/compras/{id}`, `POST/PUT /api/qnt/v1/compras`, `DELETE /api/qnt/v1/compras/{id}`. Token en header `Authorization: Bearer <token>`.

**Estados de UI a contemplar:**

| Estado  | Cuándo                         | Comportamiento / mensaje |
|---------|---------------------------------|---------------------------|
| Loading | Mientras GET /compras o GET /compras/:id | Spinner o skeleton en área de contenido. |
| Vacío   | GET /compras devuelve []        | Mensaje "No hay compras" y CTA "Nueva compra". |
| Error   | 4xx/5xx o fallo de red          | Mensaje claro y botón "Reintentar". En formulario, mostrar mensaje del cuerpo si 400. |
| Éxito   | Datos cargados o POST/PUT 200/201 | Mostrar tabla o redirigir al listado con mensaje de éxito. |

**Modelos de datos:** Compra, CreateCompraRequest, Proveedor, Site, enum TipoCompra — según INFORME_BACKEND secciones 6.6–6.9 y 10.

---

## 5. Flujos de usuario

**Flujo principal:** Usuario entra a `/compras` → ve listado (loading → éxito o vacío o error) → aplica filtro por tipo → hace clic en "Editar" en una fila → va a `/compras/:id/editar` → modifica campos → Guardar → validación → PUT → éxito → vuelve a listado o muestra mensaje.

**Flujos secundarios:** "Nueva compra" → `/compras/nueva` → completar formulario → Guardar → POST → 201 → redirigir a listado. Eliminar: clic en Eliminar → confirmación "¿Eliminar esta compra?" → DELETE → 204 → quitar fila o refrescar lista.

**Eventos clave:** Guardar → validar → si hay error 400, mostrar mensaje del backend; si 409 u otro, mensaje genérico. No dejar el botón "Guardar" habilitado sin validación básica (opcional: deshabilitar hasta que el formulario sea válido).

**Validación:** Cliente: obligatorios y formato (fechas ISO, importe numérico). Backend puede devolver 400 con mensaje; mostrarlo cerca del campo o en banner.

---

## 6. Criterios de aceptación

- [ ] Listado en `/compras` muestra columnas: proveedor (nombre), fecha compra, fecha factura, número factura, importe, moneda, tipo compra, acciones.
- [ ] Filtro por tipo de compra (TipoCompra) actualiza la lista (cliente o re-fetch según diseño).
- [ ] Estado loading muestra skeleton o spinner hasta recibir respuesta de GET /compras.
- [ ] Estado vacío muestra mensaje y opción "Nueva compra".
- [ ] Error de red o 4xx/5xx muestra mensaje y botón "Reintentar".
- [ ] Botón "Nueva compra" lleva a `/compras/nueva`; "Editar" lleva a `/compras/:id/editar`.
- [ ] Formulario de alta/edición tiene todos los campos de CreateCompraRequest; obligatorios validados en cliente.
- [ ] Guardar envía POST o PUT con body correcto; en éxito se redirige al listado o se muestra mensaje.
- [ ] Errores 400 del backend se muestran al usuario (mensaje en cuerpo).
- [ ] Botón "Eliminar" solo visible para ROLE_ADMIN; con confirmación antes de DELETE.
- [ ] Eliminar exitoso (204) actualiza el listado sin recargar toda la página si es posible.

---

## 7. Convenciones y referencias

**Stack / design system:** Vue 3; convenciones de rutas y componentes según estructura existente del proyecto (ej. views en `src/views/`, componentes reutilizables en `src/components/`).

**Componentes existentes a usar:** Tabla genérica, inputs de formulario, botones primarios/secundarios, PageHeader si existe.

**Backend:** INFORME_BACKEND_PARA_FRONTEND — §5.4 Compras, §6.6–6.9 modelos, §10 TipoCompra, §8 códigos HTTP.

**Supuestos y abiertos:** Proveedor y Site se asumen como listas obtenidas de algún endpoint o selector; si no hay CRUD de Proveedor/Site, usar IDs o nombres según lo que permita el backend (proveedorId o proveedorNombre). Imagen de factura queda fuera de esta versión.

---

*Spec generada por AgenteDesigner. El programador debe implementar siguiendo esta spec y el PASO 0 del prompt correspondiente.*
