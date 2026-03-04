# Instrucciones para el agente programador — Módulo Stock

**Objetivo:** Revisar y corregir la integración con la API de Stock del backend y, si aplica, completar la sección **Stock** en el frontend QNT-Frontend (pantalla de tarjetas, listados por tipo, detalle por ítem). El programador debe seguir **exactamente** estos pasos y la estructura del proyecto existente.

**Referencia obligatoria:** Contrato de API y modelos en `INFORME_BACKEND_PARA_FRONTEND.md`. Todos los endpoints de stock están **documentados** en el informe; el frontend debe usarlos tal cual allí se indica.

---

## PASO 0 — Revisar y corregir endpoints de Stock (OBLIGATORIO)

Este paso es **prioritario**. El backend ya expone todos los recursos de stock; el frontend debe llamarlos con las rutas exactas del informe y enviando siempre el token JWT. Un **403 Forbidden** suele indicar ruta incorrecta, token no enviado o backend rechazando la petición.

### 0.1 Fuente de verdad: INFORME_BACKEND_PARA_FRONTEND.md

Abrir `INFORME_BACKEND_PARA_FRONTEND.md` y usar como referencia:

- **Base URL:** La misma que usa el resto de la app. En `src/api/config.js` está definida como `apiBaseUrl` (en desarrollo suele ser `/api/qnt/v1`, en producción puede ser por ejemplo `https://qnt.dronefieldoperation.cloud/api/qnt/v1` vía `VITE_API_BASE_URL`). **No** hardcodear otra base en el módulo de stock; el cliente `api` de `src/api/api.js` ya tiene configurada la base URL.
- **Endpoints de equipos (secciones 5.4.3 a 5.4.8 del informe):**

  | Recurso          | Ruta base (sin prefijo)   | GET lista        | GET por ID           |
  |------------------|---------------------------|------------------|----------------------|
  | Drones           | `/drones`                 | `GET /drones`    | `GET /drones/{id}`    |
  | Docks            | `/docks`                  | `GET /docks`     | `GET /docks/{id}`     |
  | Baterías         | `/baterias`               | `GET /baterias`  | `GET /baterias/{id}`  |
  | Hélices          | `/helices`                | `GET /helices`   | `GET /helices/{id}`   |
  | Antenas RTK      | `/antenas-rtk`            | `GET /antenas-rtk` | `GET /antenas-rtk/{id}` |
  | Antenas Starlink | `/antenas-starlink`       | `GET /antenas-starlink` | `GET /antenas-starlink/{id}` |

- **Licencias (software), sección 5.5:**  
  `GET /licencias` y `GET /licencias/{id}`.

Las rutas son **relativas al prefijo de la API** (ej. `/api/qnt/v1`). Por tanto, con el cliente `api` (baseURL = `/api/qnt/v1`), las peticiones deben ser exactamente:

- `api.get('/drones')`, `api.get('/drones/' + id)`
- `api.get('/docks')`, `api.get('/docks/' + id)`
- `api.get('/baterias')`, `api.get('/baterias/' + id)`
- `api.get('/helices')`, `api.get('/helices/' + id)`
- `api.get('/antenas-rtk')`, `api.get('/antenas-rtk/' + id)`
- `api.get('/antenas-starlink')`, `api.get('/antenas-starlink/' + id)`
- `api.get('/licencias')`, `api.get('/licencias/' + id)`

**Importante:** Escribir las rutas tal cual: `helices` (con 's'), `antenas-rtk` y `antenas-starlink` con guión. No usar `helice`, `antenas_rtk` ni rutas distintas a las del informe.

### 0.2 Revisar src/api/stock.js

1. Abrir `src/api/stock.js`.
2. Comprobar que **todas** las peticiones usan el cliente **`api`** importado desde `./api.js` (el mismo que tiene el interceptor que añade `Authorization: Bearer <token>`). No usar `fetch`, `axios.create` ni otro cliente para estas rutas.
3. Comprobar que las rutas usadas coinciden **exactamente** con la tabla anterior:
   - Lista de equipos: `api.get(\`/${tipo}\`)` donde `tipo` sea uno de: `drones`, `docks`, `baterias`, `helices`, `antenas-rtk`, `antenas-starlink`. No añadir barra final (evitar `/helices/`).
   - Detalle: `api.get(\`/${tipo}/${id}\`)` con el mismo `tipo`.
   - Licencias: `api.get('/licencias')` y `api.get(\`/licencias/${id}\`)`.
4. Si existe un array o constante con los tipos de equipo (ej. `TIPOS_EQUIPO`), verificar que los valores sean exactamente: `'drones'`, `'docks'`, `'baterias'`, `'helices'`, `'antenas-rtk'`, `'antenas-starlink'` (sin otro formato).
5. No duplicar el prefijo de la API en la ruta: el cliente `api` ya tiene `baseURL`; la ruta debe ser solo `/drones`, `/helices`, etc.

### 0.3 Revisar que el token se envía (evitar 403)

1. En `src/api/api.js` debe existir un interceptor de request que añada el header `Authorization: Bearer <token>` usando el token obtenido de `getToken()` (o equivalente). No debe haber excepciones para las rutas de stock.
2. Comprobar que las vistas de Stock (listados y detalle) **no** hacen peticiones con `fetch` o con otra instancia de axios que no use ese interceptor. Todas deben usar las funciones de `src/api/stock.js` (que a su vez usan `api`).
3. Si en producción la base URL es distinta (ej. `https://qnt.dronefieldoperation.cloud/api/qnt/v1`), verificar que `src/api/config.js` use esa URL en producción (por ejemplo mediante `import.meta.env.VITE_API_BASE_URL`) para que las peticiones vayan al servidor correcto.

### 0.4 Corregir y verificar

- Aplicar las correcciones necesarias en `src/api/stock.js` (y, si aplica, en `config.js`) para que las rutas y el cliente coincidan con lo anterior.
- Probar en navegador que al entrar a un listado de Stock (ej. Hélices) la petición se hace a la URL correcta (ej. `.../api/qnt/v1/helices`) y que en la pestaña Red del devtools el request lleve el header `Authorization: Bearer ...`. Si el backend ya está desplegado con estos endpoints y el usuario está autenticado, la respuesta debe ser 200 (o 404 si el recurso no existe), no 403.

---

## Convenciones del proyecto a respetar

- **Vue 3** con `<script setup>`, **Vite**, **Vue Router**, **axios** (cliente en `src/api/api.js` con interceptor Bearer).
- Rutas protegidas bajo el layout `DashboardLayout`; sidebar en `src/components/AppSidebar.vue`; rutas en `src/router/index.js`.
- Llamadas API mediante funciones exportadas desde `src/api/*.js` y re-exportadas en `src/api/index.js`; usar `api` de `src/api/api.js` para peticiones (base URL ya configurada en `config.js` como `/api/qnt/v1`).
- Estilo visual: mantener coherencia con el sidebar actual (fondo oscuro, ítem activo con fondo claro y texto oscuro), tarjetas y espaciado similares a las vistas existentes (ej. ProveedoresView).

---

## PASO 1 — Entender la API de Stock (referencia al informe)

Todos los recursos de stock están documentados en `INFORME_BACKEND_PARA_FRONTEND.md`. **No asumir rutas ni modelos;** usar únicamente el informe.

- **Equipos (Drones, Docks, Baterías, Hélices, Antenas RTK, Antenas Starlink):** Secciones **5.4.3 a 5.4.8** (endpoints) y **6.21 a 6.26** (modelos). Rutas base: `/drones`, `/docks`, `/baterias`, `/helices`, `/antenas-rtk`, `/antenas-starlink`. Campos típicos: id, estado (enum Estado §10), marca, modelo, numeroSerie; si el backend devuelve más, mostrarlos.
- **Licencias (software):** Secciones **5.5** (endpoints) y **6.16 / 6.18** (modelo). Rutas: `/licencias`, `/licencias/{id}`. Campos: id, nombre, numLicencia, compra, fechaCompra, caducidad, version, activo.

El **enum Estado** (equipos) está en la sección 10 del informe: `STOCK_ACTUAL`, `EN_PROCESO`, `STOCK_ACTIVO`, `EN_DESUSO`. Usar exactamente estos valores para filtros y visualización.



---

## PASO 2 — Cambiar la navegación: Stock como sección propia

### 2.1 Sidebar

- Abrir `src/components/AppSidebar.vue`.
- **Eliminar** el grupo completo "Inventario" que contiene: RPAS, Baterías, Ubicaciones (no mover esos ítems a otro grupo; se reemplazan por Stock).
- **Añadir** un **nuevo grupo** con `title: 'Stock'` y **un solo ítem**:
  - `label: 'Stock'`
  - `path: '/stock'`
  - `icon: 'stock'` (o el nombre de icono que use el proyecto para “inventario/stock”; si no existe, usar uno genérico como `'box'` o `'inventory'`).
- El orden de grupos queda a criterio del diseño; recomendación: poner "Stock" después de "Dashboard" y antes de "Operaciones" o "Administración", para que sea fácil de encontrar.
- No añadir en el sidebar los 7 tipos (Drones, Docks, etc.); esos se acceden solo desde la pantalla Stock (tarjetas).

### 2.2 Router

- Abrir `src/router/index.js`.
- Añadir la ruta para la pantalla principal de Stock (tarjetas):
  - `path: 'stock'`, `name: 'stock'`, `component: StockView` (crear la vista en PASO 3).
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

## PASO 3 — Pantalla principal Stock (tarjetas)

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

## PASO 4 — Capa API para Stock

### 3.1 Archivo de API por recurso (o uno unificado)

- Crear en `src/api/` un módulo para los recursos de stock. Opciones:
  - **Opción A:** Un solo archivo `src/api/stock.js` que exporte funciones para todos los tipos (drones, docks, baterias, helices, antenasRtk, antenasStarlink, licencias).
  - **Opción B:** Un archivo por recurso (ej. `drones.js`, `docks.js`, …). Si se usa esta opción, re-exportar desde `src/api/index.js` todas las funciones necesarias.

Recomendación: **Opción A** (`stock.js`) para centralizar y evitar muchos imports en las vistas.

### 3.2 Funciones a implementar

Las rutas y métodos deben coincidir **exactamente** con las secciones 5.4.3 a 5.4.8 y 5.5 del `INFORME_BACKEND_PARA_FRONTEND.md`. Usar el cliente `api` de `src/api/api.js` (base URL y Bearer ya configurados). No duplicar base URL.

Para **cada** tipo (drones, docks, baterias, helices, antenas-rtk, antenas-starlink):

- `getList(tipo)` → `GET /{tipo}` (ej. `GET /helices`) → devuelve la lista (array). El valor de `tipo` debe ser exactamente uno de: `drones`, `docks`, `baterias`, `helices`, `antenas-rtk`, `antenas-starlink`.
- `getById(tipo, id)` → `GET /{tipo}/{id}` (ej. `GET /helices/1`) → devuelve un objeto.

Para **licencias** (recurso ya documentado):

- Usar los endpoints del informe: `GET /licencias` y `GET /licencias/{id}`. Si ya existe un módulo `licencias.js` o `compras.js` que exponga `getLicencias` y `getLicencia(id)`, reutilizarlo desde el módulo de stock; si no, implementar en `stock.js` (o en el módulo que corresponda) dos funciones que llamen a esos endpoints.

Manejo de errores: propagar el error (para que las vistas muestren mensaje o estado de error). No capturar silenciosamente; si el backend no existe aún, la petición fallará y la UI puede mostrar "Sin datos" o "Error al cargar".

---

## PASO 5 — Vistas de listado por tipo (ej. todos los drones)

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

## PASO 6 — Vistas de detalle por ítem

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

## PASO 7 — Resumen de archivos a crear/modificar

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

## PASO 8 — Verificación final

- [ ] Al hacer click en "Stock" en el sidebar se muestra la pantalla con las 7 tarjetas.
- [ ] Cada tarjeta lleva a su listado (drones, docks, baterias, helices, antenas-rtk, antenas-starlink, licencias).
- [ ] En cada listado se muestran todos los ítems devueltos por la API; imagen genérica única por tipo en las tarjetas.
- [ ] Filtros por estado, marca, modelo y número de serie funcionan en cliente para equipos; filtros coherentes para licencias.
- [ ] Al hacer click en un ítem del listado se navega al detalle; en el detalle se muestran todos los campos del ítem.
- [ ] "Volver a Stock" y "Volver al listado" funcionan correctamente.
- [ ] Las rutas están protegidas (requieren auth); el cliente envía el token en todas las peticiones (interceptor de `api.js`). No debe aparecer **403 Forbidden** en las rutas de stock si el usuario está autenticado y el backend tiene los endpoints desplegados (secciones 5.4.3–5.4.8 y 5.5 del informe).
- [ ] Si un endpoint devuelve 404 o 500, la UI muestra un estado de error o "Sin datos" sin romper la aplicación.

---

## Notas para el agente

- **Imágenes:** Todas en `public/Images/`. Referenciar en el código como `/Images/nombre.jpg` (o .png). Para Licencias se puede usar `flighthub2.png` o `flytbase.png`; si falta una, usar la otra o una genérica.
- **Estado (equipos):** Valores del informe §10: `STOCK_ACTUAL`, `EN_PROCESO`, `STOCK_ACTIVO`, `EN_DESUSO`. Traducir a etiquetas legibles en filtros y detalle.
- **Endpoints:** Todos los recursos de stock (drones, docks, baterias, helices, antenas-rtk, antenas-starlink, licencias) están documentados en `INFORME_BACKEND_PARA_FRONTEND.md` (secciones 5.4.3 a 5.4.8 y 5.5). Usar **exactamente** esas rutas y el cliente `api` que envía el Bearer token. Ante 403, revisar PASO 0.
