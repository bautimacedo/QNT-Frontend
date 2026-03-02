# Flujo de agentes — PM → Designer → Programador

Este documento describe el **flujo estándar** para llevar una idea o pedido del cliente hasta código implementado, usando tres agentes en cadena: **PM**, **Designer** y **Programador**. El objetivo es un producto de calidad con requisitos claros, diseño detallado e implementación sin ambigüedades.

---

## Diagrama del flujo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ENTRADA: pedido del cliente / feature nueva / "qué sigue"                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  AGENTE PM (AGENTE_PM.md)                                                    │
│  • Conversa, prioriza, define versiones                                     │
│  • No escribe código                                                         │
│  • Output: prompts en prompts/pendientes/ + actualización ROADMAP            │
│  • Opcional: sección "## DISEÑO REQUERIDO" en el prompt si hay UI            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │ ¿La versión tiene UI/frontend?    │
                    └─────────────────┬─────────────────┘
                          Sí │                │ No
                             ▼                │
┌────────────────────────────────────────────┐│
│  AGENTE DESIGNER (AGENTE_DESIGNER.md)       ││
│  • Lee el prompt en pendientes/             ││
│  • No escribe código                        ││
│  • Output: design-specs/[VERSION]-[SLUG].md ││
│  • Spec: pantallas, componentes, estados,  ││
│    flujos, criterios de aceptación, backend ││
└────────────────────────────────────────────┘│
                             │                │
                             └────────┬───────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PROMPT LISTO PARA EJECUCIÓN                                                │
│  • En prompts/pendientes/ (o movido a en_proceso por el programador)         │
│  • PASO 0 del prompt incluye: design-specs/[VERSION]-[SLUG].md (si aplica)  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  AGENTE PROGRAMADOR (AGENTE_WORKFLOW.md)                                    │
│  • Toma el siguiente prompt de la cola (respetando dependencias)             │
│  • Lee PASO 0: contexto (incluye la spec de diseño si existe)               │
│  • Implementa siguiendo la spec y el prompt paso a paso                     │
│  • Output: código, tests, commit, tag                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  SALIDA: versión implementada, tag en repo, prompt en completados/          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Orden recomendado de ejecución

### Opción A — Flujo completo (con diseño)

1. **Sesión con el PM**  
   - Invocar: *"Lee AGENTE_PM.md y arrancá una sesión de planificación"* (o "quiero agregar [feature]").  
   - Resultado: uno o más prompts en `prompts/pendientes/` y ROADMAP actualizado. Para tareas con UI, el prompt puede incluir una sección **DISEÑO REQUERIDO**.

2. **Ejecutar el Designer** (para cada versión que tenga UI)  
   - Invocar: *"Lee AGENTE_DESIGNER.md y diseñá la versión vX.Y.Z"* (o "generá la spec para pendientes/vX.Y.Z-slug.md").  
   - Resultado: archivo `design-specs/vX.Y.Z-slug.md`.  
   - Asegurarse de que el prompt en `pendientes/` tenga en su **PASO 0** la línea:  
     `design-specs/vX.Y.Z-slug.md`

3. **Ejecutar el Programador**  
   - Invocar: *"Lee AGENTE_WORKFLOW.md y ejecutá el ciclo"*.  
   - El agente toma el siguiente prompt, lee la spec (y el resto del contexto) e implementa.

### Opción B — Sin paso de diseño

Para tareas sin UI (backend, refactors, config), se omite el Designer. El PM genera el prompt y el Programador lo ejecuta; el PASO 0 del prompt solo incluye archivos técnicos (código, tests, backend).

### Opción C — Auditoría de diseño

Para ver qué prompts en cola tienen spec y cuáles no:  
*"Lee AGENTE_DESIGNER.md y listá qué versiones tienen spec y cuáles faltan."*

---

## Responsabilidades por agente

| Agente      | No hace           | Sí hace                                                                 |
|------------|-------------------|-------------------------------------------------------------------------|
| **PM**     | Código, diseño UI | Conversación, priorización, versiones, prompts en pendientes/, ROADMAP |
| **Designer** | Código          | Specs en design-specs/: pantallas, componentes, estados, flujos, criterios |
| **Programador** | Definir requisitos o diseño | Leer spec + prompt, implementar, tests, commit, tag                 |

---

## Ubicación de archivos

| Qué                | Dónde |
|--------------------|--------|
| Prompts pendientes | `agent-bootstrap/prompts/pendientes/` (o equivalente del proyecto) |
| Prompts en curso   | `agent-bootstrap/prompts/en_proceso/` |
| Prompts completados| `agent-bootstrap/prompts/completados/` |
| Specs de diseño    | `design-specs/` (raíz o `Importante-main/`) |
| Plantilla de spec  | `Importante-main/AgenteDesigner/templates/DESIGN_SPEC.template.md` |
| Definición Designer| `Importante-main/AgenteDesigner/AGENTE_DESIGNER.md` |
| Definición PM      | `Importante-main/AgentePM/AGENTE_PM.md` |
| Workflow Programador | `Importante-main/AgenteProgramador/AGENTE_WORKFLOW.md` |

---

## Calidad del producto

- **PM:** versiones acotadas, dependencias claras, scope explícito (incluido y excluido).  
- **Designer:** specs implementables, estados y flujos definidos, criterios de aceptación verificables, alineación con el backend.  
- **Programador:** implementación fiel a la spec y al prompt, verificaciones técnicas (build, tests, lint) antes de commit.

Este flujo evita que el programador tenga que adivinar el diseño o el alcance; todo queda documentado y trazable desde el pedido hasta el código.

---

*Documento de referencia para el equipo y para los agentes. Mantener actualizado si se cambian rutas o nombres de agentes.*
