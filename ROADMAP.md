# ROADMAP — QNT Frontend

Frontend de **QNT Gestión**, alineado con el backend (contrato en `INFORME_BACKEND_PARA_FRONTEND.md`).

## Stack

- **Vue 3** + **Vite**
- **Vue Router** (rutas protegidas por auth)
- API REST con JWT (login, `/auth/me`, interceptor 401)

## Versiones / Estado

| Versión | Descripción | Estado |
|---------|-------------|--------|
| v0.1.0 | Fundación: API client, auth (login/me), router, login y home | ✅ Hecho |
| v0.1.1 | Registro de usuario (pantalla pública, flujo pendiente de aprobación) | ✅ Hecho |
| v0.5.0 | Gestión de usuarios y aprobación (ADMIN: pendientes, listado, roles) | ✅ Hecho |
| v0.5.1 | Roles dinámicos y mi perfil | ✅ Hecho |
| v0.6.0 | Perfil piloto completo | ✅ Hecho |
| v0.6.1 | Fix permisos perfil piloto | ✅ Hecho |
| v0.7.0 | Licencias ANAC refactor | ✅ Hecho |
| v0.8.0 | CRUD Compras (listado, alta, edición, imagen factura, tipos equipo) | ✅ Hecho |
| v0.9.0 | Gestión de Proveedores | ✅ Hecho |
| v0.9.1 | Fix: Content-Type en upload de imagen de factura (multipart) | ⏳ Pendiente — prompt listo |
| v0.10.0 | Vista de Pilotos (listado, badges CMA/estado, detalle con licencias ANAC) | ✅ Hecho |
| v0.10.1 | Fix: badge CMA usa licencias como fallback + página de perfil `/pilotos/:id` | ⏳ Pendiente — prompt listo |
| v0.11.0 | Stock post-compra: badges NO_LLEGO, edición de ítems, redirect desde compras | ⏳ Pendiente — prompt listo |
| v0.12.0 | Rediseño vistas de detalle de stock (drones, baterías, hélices, etc.) | ⏳ Pendiente — prompt Designer listo, esperando spec |
| v0.13.0 | CRUD Licencias (software) | Pendiente |
| v0.14.0 | CRUD Seguros | Pendiente |

## Cola de prompts listos para ejecutar

1. `v0.9.1-PROMPT-PROGRAMADOR-fix-imagen-compra.md` — bug fix, sin UI, ~15 min
2. `v0.10.1-PROMPT-PROGRAMADOR-fix-pilotos-cma-perfil.md` — fix CMA badge + página perfil, ~1.5h
3. `v0.11.0-PROMPT-PROGRAMADOR-stock-post-compra.md` — stock + compras, ~2-3h
4. `v0.12.0-PROMPT-DESIGNER-stock-detalle-redesign.md` → **ejecutar Designer primero** → luego programador

## Cómo seguir

- **Ejecutar:** `cd QNT-Frontend && npm run dev` (y tener el backend en `localhost:8080`).
- **Próximo paso lógico:** v0.9.1 → v0.10.1 → v0.11.0 → v0.12.0 (Designer + Programador) → v0.13.0.
- **Programador:** leer `Importante-main/FLUJO_AGENTES.md` y ejecutar con `AGENTE_WORKFLOW.md`.
