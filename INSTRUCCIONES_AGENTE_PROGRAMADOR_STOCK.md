# Instrucciones para el agente programador — Módulo Stock

**Objetivo:** Implementar la sección **Stock** en el frontend QNT-Frontend: pantalla principal con tarjetas por tipo de equipo, listados filtrados por tipo y vista de detalle por ítem. El programador debe seguir **exactamente** estos pasos y la estructura del proyecto existente.

**Referencia obligatoria:** Contrato de API y modelos en `INFORME_BACKEND_PARA_FRONTEND.md` (base URL, auth JWT, roles, enums Estado y TipoEquipo, modelo Licencia en §6.16).

---

## Convenciones del proyecto a respetar

- **Vue 3** con `<script setup>`, **Vite**, **Vue Router**, **axios** (cliente en `src/api/api.js` con interceptor Bearer).
- Rutas protegidas bajo el layout `DashboardLayout`; sidebar en `src/components/AppSidebar.vue`; rutas en `src/router/index.js`.
- Llamadas API mediante funciones exportadas desde `src/api/*.js` y re-exportadas en `src/api/index.js`; usar `api` de `src/api/api.js` para peticiones (base URL ya configurada en `config.js` como `/api/qnt/v1`).
- Estilo visual: mantener coherencia con el sidebar actual (fondo oscuro, ítem activo con fondo claro y texto oscuro), tarjetas y espaciado similares a las vistas existentes (ej. ProveedoresView).

---

## PASO 0 — Entender la API de Stock (backend)

### Recursos documentados en el informe

- **Licencias (software):** ya documentadas. Base `/api/qnt/v1/licencias`.  
  - `GET /licencias` → lista; `GET /licencias/{id}` → uno.  
  - Modelo: ver §6.16 y §6.18 del informe (id, nombre, numLicencia, compra, fechaCompra, caducidad, version, activo).

### Recursos de equipos (no documentados en el informe; asumir REST estándar)

El informe menciona el **enum Estado** (§10) para equipos: `STOCK_ACTUAL`, `EN_PROCESO`, `STOCK_ACTIVO`, `EN_DESUSO`. No documenta controllers para Dron, Dock, Batería, Hélice, Antena RTK ni Antena Starlink. El agente debe **asumir** que el backend expone (o expondrá) REST bajo el mismo prefijo con la siguiente convención:

- Base: `https://localhost:8080/api/qnt/v1` (o la que use el front vía proxy/env).
- Rutas asumidas (todas requieren autenticación; roles según informe):
  - `GET /drones` — listar todos; `GET /drones/{id}` — uno.
  - `GET /docks` — listar todos; `GET /docks/{id}` — uno.
  - `GET /baterias` — listar todos; `GET /baterias/{id}` — uno.
  - `GET /helices` — listar todos; `GET /helices/{id}` — uno.
  - `GET /antenas-rtk` — listar todos; `GET /antenas-rtk/{id}` — uno.
  - `GET /antenas-starlink` — listar todos; `GET /antenas-starlink/{id}` — uno.

Forma mínima asumida por entidad (si el backend devuelve más campos, mostrarlos también en detalle):

| Recurso        | Campos mínimos asumidos (además de `id`) |
|----------------|------------------------------------------|
| Dron           | estado, marca, modelo, numeroSerie       |
| Dock           | estado, marca, modelo, numeroSerie       |
| Batería        | estado, marca, modelo, numeroSerie      |
| Hélice         | estado, marca, modelo, numeroSerie      |
| Antena RTK     | estado, marca, modelo, numeroSerie      |
| Antena Starlink| estado, marca, modelo, numeroSerie     |

`estado` debe ser uno de: `STOCK_ACTUAL`, `EN_PROCESO`, `STOCK_ACTIVO`, `EN_DESUSO` (según §10 del informe). Si el backend usa otros nombres, mapear en el front para mostrar y filtrar.

Para **Licencia** (software) no hay campo `estado` de equipo; usar solo los campos del informe (§6.16). En listado/detalle de licencias no aplicar filtro por “estado de equipo”; si se quiere un filtro, usar por ejemplo “activo” o “nombre”.

---

## PASO 1 — Cambiar la navegación: Stock como sección propia

### 1.1 Sidebar

- Abrir `src/components/AppSidebar.vue`.
- **Eliminar** el grupo completo "Inventario" que contiene: RPAS, Baterías, Ubicaciones (no mover esos ítems a otro grupo; se reemplazan por Stock).
- **Añadir** un **nuevo grupo** con `title: 'Stock'` y **un solo ítem**:
  - `label: 'Stock'`
  - `path: '/stock'`
  - `icon: 'stock'` (o el nombre de icono que use el proyecto para “inventario/stock”; si no existe, usar uno genérico como `'box'` o `'inventory'`).
- El orden de grupos queda a criterio del diseño; recomendación: poner "Stock" después de "Dashboard" y antes de "Operaciones" o "Administración", para que sea fácil de encontrar.
- No añadir en el sidebar los 7 tipos (Drones, Docks, etc.); esos se acceden solo desde la pantalla Stock (tarjetas).

### 1.2 Router

- Abrir `src/router/index.js`.
- Añadir la ruta para la pantalla principal de Stock (tarjetas):
  - `path: 'stock'`, `name: 'stock'`, `component: StockView` (crear la vista en PASO 2).
- Añadir rutas hijas (o rutas hermanas bajo el mismo layout) para listado por tipo y detalle:
  - `path: 'stock/drones'`, `name: 'stock-drones'`, `component: StockDronesView`
  - `path: 'stock/docks'`, `name: 'stock-docks'`, `component: StockDocksView`
  - `path: 'stock/baterias'`, `name: 'stock-baterias'`, `component: StockBateriasView`
  - `path: 'stock/helices'`, `name: 'stock-helices'`, `component: StockHelicesView`
  - `path: 'stock/antenas-rtk'`, `name: 'stock-antenas-rtk'`, `component: StockAntenasRtkView`
  - `path: 'stock/antenas-starlink'`, `name: 'stock-antenas-starlink'`, `component: StockAntenasStarlinkView`
  - `path: 'stock/licencias'`, `name: 'stock-licencias'`, `component: StockLicenciasView`
- Para el detalle de cada ítem (ej. un dron concreto):
  - `path: 'stock/drones/:id'`, `name: 'stock-dron-detalle'`, `component: StockDronDetalleView`
  - Y análogo para: docks, baterias, helices, antenas-rtk, antenas-starlink, licencias (por ejemplo `stock/docks/:id`, `stock/baterias/:id`, etc.).
- Todas estas rutas deben ser **children** del mismo layout que ya tiene `path: '/'` (DashboardLayout), para que el sidebar siga visible.
- Importar los componentes que se crearán en los siguientes pasos (StockView y las vistas de listado y detalle por tipo).

---

## PASO 2 — Pantalla principal Stock (tarjetas)

### 2.1 Crear la vista

- Crear `src/views/stock/StockView.vue`.
- La vista debe mostrar un **título de página** (ej. "Stock" o "Gestión de stock") y una **rejilla de 7 tarjetas**.

### 2.2 Definición de las 7 tarjetas

Cada tarjeta representa un **tipo** de ítem. Datos fijos (no vienen del backend):

| # | Tipo (slug interno) | Título en UI      | Descripción corta (ejemplo)                    | Imagen (ruta pública) |
|---|---------------------|-------------------|--------------------------------------------------|------------------------|
| 1 | drones              | Drones            | Equipos RPAS en stock                           | `/Images/Matrice 4td.jpg` |
| 2 | docks               | Docks             | Estaciones base y docks                         | `/Images/dock.png` |
| 3 | baterias            | Baterías          | Baterías de equipos                             | `/Images/baterias.jpg` |
| 4 | helices             | Hélices           | Hélices y repuestos                             | `/Images/helices.jpg` |
| 5 | antenas-rtk        | Antenas RTK       | Antenas de corrección RTK                       | `/Images/rtk.png` |
| 6 | antenas-starlink   | Antenas Starlink  | Antenas Starlink                                | `/Images/starlink.png` |
| 7 | licencias          | Licencias         | Licencias de software                           | `/Images/flighthub2.png` o `/Images/flytbase.png` (elegir una; si no existe, usar una imagen genérica bajo `public/Images/`) |

Las imágenes están en `public/Images/`. En el template usar rutas que empiecen por `/Images/...` para que resuelvan a `public/Images/...`.

### 2.3 Contenido de cada tarjeta

Cada tarjeta debe incluir:

1. **Imagen:** la indicada en la tabla, con `alt` descriptivo y estilo controlado (ej. altura fija, object-fit cover, bordes redondeados) para que la rejilla se vea uniforme.
2. **Título:** el "Título en UI" de la tabla (ej. "Drones", "Docks").
3. **Descripción breve:** el texto de la columna "Descripción corta" (o similar, una línea).
4. Opcional: un subtítulo o badge (ej. "Ver listado") para dejar claro que es un enlace.

Al hacer **click** en la tarjeta (o en un botón "Ver listado" dentro de ella), navegar a la ruta correspondiente:

- Drones → `/stock/drones`
- Docks → `/stock/docks`
- Baterías → `/stock/baterias`
- Hélices → `/stock/helices`
- Antenas RTK → `/stock/antenas-rtk`
- Antenas Starlink → `/stock/antenas-starlink`
- Licencias → `/stock/licencias`

Usar `<router-link>` o `router.push()` según la convención del proyecto.

### 2.4 Maquetación

- Rejilla responsive (por ejemplo CSS Grid o Flexbox): en desktop varias columnas (ej. 3 o 4), en móvil 1–2 columnas.
- Misma estructura para las 7 tarjetas; solo cambian título, descripción e imagen.
- Mantener el mismo estilo general que el resto del dashboard (tipografía, colores, bordes).

---

## PASO 3 — Capa API para Stock

### 3.1 Archivo de API por recurso (o uno unificado)

- Crear en `src/api/` un módulo para los recursos de stock. Opciones:
  - **Opción A:** Un solo archivo `src/api/stock.js` que exporte funciones para todos los tipos (drones, docks, baterias, helices, antenasRtk, antenasStarlink, licencias).
  - **Opción B:** Un archivo por recurso (ej. `drones.js`, `docks.js`, …). Si se usa esta opción, re-exportar desde `src/api/index.js` todas las funciones necesarias.

Recomendación: **Opción A** (`stock.js`) para centralizar y evitar muchos imports en las vistas.

### 3.2 Funciones a implementar

Usar el cliente `api` de `src/api/api.js` (ya lleva base URL y Bearer). No duplicar base URL.

Para **cada** tipo (drones, docks, baterias, helices, antenasRtk, antenasStarlink):

- `getList(tipo)` → `GET /api/qnt/v1/{tipo}` (ej. `GET /drones`) → devuelve la lista (array).
- `getById(tipo, id)` → `GET /api/qnt/v1/{tipo}/{id}` (ej. `GET /drones/1`) → devuelve un objeto.

Para **licencias** (recurso ya documentado):

- Usar los endpoints del informe: `GET /licencias` y `GET /licencias/{id}`. Si ya existe un módulo `licencias.js` o `compras.js` que exponga `getLicencias` y `getLicencia(id)`, reutilizarlo desde el módulo de stock; si no, implementar en `stock.js` (o en el módulo que corresponda) dos funciones que llamen a esos endpoints.

Manejo de errores: propagar el error (para que las vistas muestren mensaje o estado de error). No capturar silenciosamente; si el backend no existe aún, la petición fallará y la UI puede mostrar "Sin datos" o "Error al cargar".

---

## PASO 4 — Vistas de listado por tipo (ej. todos los drones)

### 4.1 Patrón común para las 7 listas

Crear **7 vistas** de listado, una por tipo:

- `src/views/stock/StockDronesView.vue`
- `src/views/stock/StockDocksView.vue`
- `src/views/stock/StockBateriasView.vue`
- `src/views/stock/StockHelicesView.vue`
- `src/views/stock/StockAntenasRtkView.vue`
- `src/views/stock/StockAntenasStarlinkView.vue`
- `src/views/stock/StockLicenciasView.vue`

Cada vista debe:

1. Mostrar **todos** los ítems de ese tipo que devuelva la API, **sin filtrar por estado en el backend** (es decir, traer la lista completa; el filtro por estado se hace en el front).
2. Mostrar los ítems en forma de **tarjetas** (cards). En cada tarjeta **no** es obligatorio usar una imagen por ítem; para tipos con imagen genérica (ej. todos los drones) usar **la misma imagen** para todas las tarjetas:
   - **Drones:** imagen genérica `/Images/Matrice 4td.jpg`.
   - **Docks, Baterías, Hélices, Antenas RTK, Antenas Starlink:** usar la misma imagen que en la pantalla principal de Stock para ese tipo (dock.png, baterias.jpg, helices.jpg, rtk.png, starlink.png).
   - **Licencias:** imagen genérica (ej. flighthub2.png o flytbase.png).
3. En cada tarjeta mostrar al menos: identificador (ej. número de serie o nombre), y si existe: marca, modelo, estado. Al hacer click en una tarjeta, navegar a la vista de **detalle** del ítem (ej. `/stock/drones/123`).

### 4.2 Filtros (listados de equipos: Dron, Dock, Batería, Hélice, Antena RTK, Antena Starlink)

En las vistas de **drones, docks, baterias, helices, antenas-rtk y antenas-starlink** (no en licencias), implementar **filtros** en la parte superior (o en una barra lateral) con:

- **Estado:** desplegable o botones con los valores del enum Estado: `STOCK_ACTUAL`, `EN_PROCESO`, `STOCK_ACTIVO`, `EN_DESUSO`. Etiquetas amigables (ej. "En stock actual", "En proceso", "Stock activo", "En desuso"). Opción "Todos" para no filtrar por estado.
- **Marca:** campo de texto; filtrar en cliente los ítems cuya propiedad `marca` contenga el texto (case-insensitive).
- **Modelo:** campo de texto; filtrar en cliente los ítems cuya propiedad `modelo` contenga el texto.
- **Número de serie:** campo de texto; filtrar en cliente los ítems cuya propiedad `numeroSerie` contenga el texto.

Los filtros se aplican **en el frontend** sobre la lista completa devuelta por `GET /{recurso}`, salvo que el informe (o el backend) documente en el futuro query params (ej. `?estado=...&marca=...`); en ese caso, usar esos params y ajustar la capa API.

Para **Licencias** (software): no hay "estado de equipo". Mostrar filtros que tengan sentido con el modelo del informe (ej. por nombre, activo sí/no si existe el campo). Si el informe solo tiene nombre y numLicencia, filtrar por nombre y/o número de licencia.

### 4.3 Breadcrumb / navegación contextual

En cada vista de listado, mostrar al menos un enlace tipo "Volver a Stock" que lleve a `/stock`, para que el usuario pueda volver a la pantalla de tarjetas sin usar solo el sidebar.

---

## PASO 5 — Vistas de detalle por ítem

### 5.1 Una vista de detalle por tipo

Crear **7 vistas de detalle** (una por tipo), por ejemplo:

- `src/views/stock/StockDronDetalleView.vue`
- `src/views/stock/StockDockDetalleView.vue`
- `src/views/stock/StockBateriaDetalleView.vue`
- `src/views/stock/StockHeliceDetalleView.vue`
- `src/views/stock/StockAntenaRtkDetalleView.vue`
- `src/views/stock/StockAntenaStarlinkDetalleView.vue`
- `src/views/stock/StockLicenciaDetalleView.vue`

Cada una recibe el **id** por la ruta (ej. `route.params.id`).

### 5.2 Comportamiento

1. Al montar, llamar a la API correspondiente (`getById(tipo, id)` o equivalente para licencias).
2. Si el id no existe o la API devuelve 404, mostrar mensaje claro ("No encontrado" o similar) y opción de volver al listado.
3. Si hay datos, mostrar **todos los campos** que devuelva el backend para ese ítem, organizados en secciones o en una lista de pares etiqueta–valor (expandir todos los datos). No ocultar campos; si el backend añade más en el futuro, mostrarlos.
4. Para equipos (dron, dock, batería, etc.): mostrar al menos id, estado, marca, modelo, numeroSerie y cualquier otro campo que venga en la respuesta.
5. Para **Licencia:** mostrar los campos del informe §6.16: id, nombre, numLicencia, compra (o compraId), fechaCompra, caducidad, version, activo.
6. Incluir un enlace o botón "Volver al listado" que navegue a la ruta del listado correspondiente (ej. `/stock/drones`).

### 5.3 Presentación

- Usar la misma imagen genérica del tipo (ej. Matrice 4td.jpg para drones) en la parte superior del detalle si se desea, o solo texto; detalle debe ser legible y accesible.
- Mantener coherencia con el resto del dashboard (tipografía, espaciado, colores).

---

## PASO 6 — Resumen de archivos a crear/modificar

### Crear

- `src/views/stock/StockView.vue` — pantalla de las 7 tarjetas.
- `src/views/stock/StockDronesView.vue`, `StockDocksView.vue`, `StockBateriasView.vue`, `StockHelicesView.vue`, `StockAntenasRtkView.vue`, `StockAntenasStarlinkView.vue`, `StockLicenciasView.vue` — listados.
- `src/views/stock/StockDronDetalleView.vue`, `StockDockDetalleView.vue`, `StockBateriaDetalleView.vue`, `StockHeliceDetalleView.vue`, `StockAntenaRtkDetalleView.vue`, `StockAntenaStarlinkDetalleView.vue`, `StockLicenciaDetalleView.vue` — detalles.
- `src/api/stock.js` — funciones de API para todos los tipos de stock (y licencias si no están en otro módulo).

### Modificar

- `src/components/AppSidebar.vue` — quitar grupo Inventario (RPAS, Baterías, Ubicaciones); añadir grupo Stock con ítem "Stock" → `/stock`.
- `src/router/index.js` — añadir rutas `/stock`, `/stock/drones`, `/stock/drones/:id`, y análogas para docks, baterias, helices, antenas-rtk, antenas-starlink, licencias; registrar todos los componentes anteriores.
- `src/api/index.js` — exportar las funciones de `stock.js` (o de los módulos que se usen para stock).

---

## PASO 7 — Verificación final

- [ ] Al hacer click en "Stock" en el sidebar se muestra la pantalla con las 7 tarjetas.
- [ ] Cada tarjeta lleva a su listado (drones, docks, baterias, helices, antenas-rtk, antenas-starlink, licencias).
- [ ] En cada listado se muestran todos los ítems devueltos por la API; imagen genérica única por tipo en las tarjetas.
- [ ] Filtros por estado, marca, modelo y número de serie funcionan en cliente para equipos; filtros coherentes para licencias.
- [ ] Al hacer click en un ítem del listado se navega al detalle; en el detalle se muestran todos los campos del ítem.
- [ ] "Volver a Stock" y "Volver al listado" funcionan correctamente.
- [ ] Las rutas están protegidas (requieren auth); el cliente envía el token en todas las peticiones (ya cubierto por el interceptor de `api.js`).
- [ ] Si algún endpoint no existe aún (ej. `/drones`), la UI muestra un estado de error o "Sin datos" sin romper la aplicación.

---

## Notas para el agente

- **Imágenes:** Todas en `public/Images/`. Referenciar en el código como `/Images/nombre.jpg` (o .png). Para Licencias se puede usar `flighthub2.png` o `flytbase.png`; si falta una, usar la otra o una genérica.
- **Estado (equipos):** Valores del informe §10: `STOCK_ACTUAL`, `EN_PROCESO`, `STOCK_ACTIVO`, `EN_DESUSO`. Traducir a etiquetas legibles en filtros y detalle.
- **Licencias:** Es el único recurso de stock ya documentado en el informe; el resto se asume con la convención REST indicada. Si el backend expone rutas o nombres distintos, ajustar solo las URLs y los nombres de propiedades en `stock.js` y en las vistas, manteniendo la misma estructura de pantallas y flujo descrito aquí.
