# Agente Designer — Especificaciones de diseño para el programador

Este directorio contiene el **Agente Designer**: un agente que no escribe código sino **especificaciones de diseño** detalladas para que el programador las implemente con calidad y sin ambigüedades.

---

## ¿Qué hace el Agente Designer?

- **Entrada:** Un requerimiento o prompt de tarea (por ejemplo el que generó el PM en `prompts/pendientes/`).
- **Salida:** Archivos en `design-specs/` con la especificación de diseño: pantallas, componentes, estados, flujos, criterios de aceptación y referencias al backend.

El programador lee esos archivos en el **PASO 0 — Contexto** del prompt y codifica siguiendo la spec.

---

## Contenido de este directorio

| Archivo / Carpeta | Propósito |
|-------------------|-----------|
| `AGENTE_DESIGNER.md` | Definición del agente: rol, pasos, modos (spec única, auditoría, batch). |
| `templates/DESIGN_SPEC.template.md` | Plantilla estándar para generar specs (alcance, pantallas, componentes, estados, flujos, criterios de aceptación). |
| `DESIGN_SPEC.example.md` | Ejemplo completo: listado y formulario de Compras (alineado a INFORME_BACKEND). |
| `README.md` | Este archivo. |

---

## Cómo usar el Agente Designer

### Generar la spec para una versión concreta

```
Lee Importante-main/AgenteDesigner/AGENTE_DESIGNER.md y diseñá la versión v0.6.0.
```

o

```
Lee AGENTE_DESIGNER.md y generá la spec de diseño para el prompt en pendientes/v0.6.0-compras-crud-ui.md.
```

El agente leerá el prompt, aplicará la plantilla y guardará `design-specs/v0.6.0-compras-crud-ui.md`.

### Ver qué falta diseñar

```
Lee AGENTE_DESIGNER.md y listá qué versiones tienen spec y cuáles faltan.
```

### Generar specs para todos los pendientes que requieran diseño

```
Lee AGENTE_DESIGNER.md y generá specs para todos los pendientes que requieran diseño.
```

---

## Dónde se guardan las specs

Por defecto el agente escribe en **`design-specs/`** en la raíz del proyecto (o bajo `Importante-main/` si así se define en el proyecto). Cada archivo se nombra:

`design-specs/[VERSION]-[SLUG].md`

Ejemplo: `design-specs/v0.6.0-compras-crud-ui.md`

---

## Flujo con el PM y el Programador

1. **PM** define una versión y genera el prompt en `prompts/pendientes/`. Si la tarea tiene UI/frontend, puede incluir una sección **"## DISEÑO REQUERIDO"** para el Designer.
2. **Designer** (este agente) lee ese prompt y genera la spec en `design-specs/[VERSION]-[SLUG].md`.
3. El **prompt del programador** debe incluir en su **PASO 0 — Contexto** la lectura de esa spec:
   - `design-specs/[VERSION]-[SLUG].md`
4. **Programador** (Agente Workflow) ejecuta el prompt leyendo la spec y el código existente, e implementa según la spec.

Ver también: `Importante-main/FLUJO_AGENTES.md` para el diagrama completo PM → Designer → Programador.

---

## Reglas de oro

- El Designer **no ejecuta código** ni modifica el repo más allá de crear/actualizar archivos en `design-specs/`.
- Las specs deben ser **implementables**: el programador no debe adivinar; estados (loading, error, vacío), flujos y criterios de aceptación deben estar explícitos.
- Siempre **alinear al backend**: referir `INFORME_BACKEND_PARA_FRONTEND.md` (o equivalente) para modelos, endpoints y códigos de error.

---

*Parte del kit de agentes del proyecto. El Designer amplifica la calidad del producto al estandarizar el paso de diseño antes de implementar.*
