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
| v0.1.1 | Registro de usuario (pantalla pública, flujo pendiente de aprobación) | Pendiente — prompt + diseño |
| v0.2.0 | CRUD Compras (listado, alta, edición, imagen factura) | Pendiente |
| v0.3.0 | CRUD Licencias | Pendiente |
| v0.4.0 | CRUD Seguros | Pendiente |
| v0.5.0 | Gestión de usuarios y aprobación (ADMIN: pendientes, listado, roles) | Pendiente — prompt + diseño |

## Cómo seguir

- **Ejecutar:** `cd QNT-Frontend && npm run dev` (y tener el backend en `localhost:8080`).
- **Próximo paso lógico:** v0.1.1 (registro) → v0.5.0 (gestión usuarios ADMIN) → v0.2.0 (compras).
