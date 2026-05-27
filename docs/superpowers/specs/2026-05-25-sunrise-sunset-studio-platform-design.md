# Sunrise Sunset — Plataforma del Studio (Spec de Diseño)

- **Fecha:** 2026-05-25
- **Estado:** Diseño aprobado por el cliente. Algunos valores de configuración pendientes (los manda el studio).
- **Studio:** Sunrise Sunset — El Tezal, Carret. Trans. 3.5 Tezal, 23454 Cabo San Lucas, B.C.S.
- **Instagram:** @sunrisesunsetloscabos

---

## 1. Objetivo

Construir una plataforma boutique de reservas y gestión para el studio **Sunrise Sunset** (Sculpt-Funcional, Surf-Pilates, Yoga) en Los Cabos. Debe sentirse premium, cálida y relajante, y aligerar la operación: reservas, recordatorios, pagos, asistencias, ocupación y seguimiento de clientas.

Objetivos operativos (todos cubiertos):
1. Reservas + cancelar / reagendar.
2. Recordatorios automáticos por correo.
3. Pagos (en línea + comprobante por transferencia, con validación).
4. Control de asistencias por **check-in QR**.
5. Ocupación de clases en tiempo real.
6. Seguimiento de clientas.
7. Lealtad por puntos (asistencia).

## 2. Estructura del repo

```
Sunrise Sunset/
├── src/        ← frontend (Vite + React + TS + Tailwind + shadcn/ui)
├── server/     ← backend (Node + Express + TS + PostgreSQL)
├── database/   ← schema + migraciones + seeds
├── public/
├── docs/
└── configs (package.json, vite.config.ts, tailwind.config.ts,
            tsconfig*, index.html, railway.json, nixpacks.toml, etc.)
```

Un solo frontend, un solo backend, una sola DB. Deploy a Railway como tres servicios independientes (sunrise-web, sunrise-api, Postgres).

## 3. Arquitectura y stack

- **Frontend:** Vite + React + TypeScript + Tailwind + shadcn/ui (Radix) + TanStack Query.
- **Backend:** Node + Express + TypeScript (`tsx watch` en dev, `tsc` build, `node dist/index.js` en prod).
- **DB:** PostgreSQL (schema + migraciones SQL versionadas en `database/`).
- **Auth:** JWT (bcrypt).
- **Integraciones:** correo (Resend), pagos en línea (Clip), Apple/Google Wallet, Evolution API (WhatsApp, disponible pero desactivado para v1).
- **Deploy:** Railway (configs `railway.json` / `nixpacks.toml`), frontend y backend como servicios separados, DB Postgres propia.

## 4. Capacidades implementadas

| Capacidad | Módulo |
|---|---|
| Reservas, cancelar, reagendar | `bookings.ts` |
| Check-in por QR + asistencias | `checkin.ts` |
| Clases y horarios | `classes.ts`, `schedules.ts` |
| Tipos de clase | `class-types.ts` |
| Planes / paquetes | `plans.ts` |
| Membresías de clienta | `memberships.ts` |
| Pagos + comprobante + Clip | `payments.ts`, `orders.ts`, `clip-payments.ts` |
| Lealtad por puntos | `loyalty.ts` |
| Apple / Google Wallet | `wallet.ts` |
| Recordatorios / notificaciones | `notifications` (correo) |
| Reportes y estadísticas | `reports.ts`, `stats.ts` |
| Instructores / coaches | `instructors.ts` |
| Días cerrados / feriados | `closed-days.ts` |
| Códigos de descuento | `discount-codes.ts` |
| Eventos / workshops | `events.ts` |
| Clase muestra + prospectos (leads) | flujo "sesión muestra" / "prospecto" |
| Inscripción única | flujo de inscripción |

## 5. Identidad de marca

**Logo:** wordmark display serif "SUNRISE / SUNSET" en crema sobre coral.

**Tipografía:**
- Títulos / wordmark: display serif de alto contraste (Fraunces o equivalente).
- Texto: sans-serif limpia y legible (Inter).

**Paleta (tokens):**

| Token | Hex | Rol |
|---|---|---|
| `coral` (firma) | `#E36F4C` | Primario: botones, acentos, logo bg |
| `amber` (golden hour) | `#F8B069` | Secundario / highlights |
| `wine` | `#7B0000` | Contraste fuerte, estados activos |
| `chocolate` | `#6E4528` | Texto sobre claro, footer |
| `rose` | `#C67E6F` | Apoyo, badges suaves |
| `cream` / arena | `#EFE7D9` | Fondo claro, texto sobre coral |
| `blush` | `#FEF3F4` | Superficies suaves, cards |
| `white` | `#FFFFFF` | Base |

**Dirección visual:** fondo crema; coral como color de acción; degradado coral→ámbar para héroes (como las stories de IG); estética boutique cálida, sofisticada, relajante.

## 6. Tipos de clase

1. **Sculpt-Funcional**
2. **Surf-Pilates**
3. **Yoga**

(Se cargan en `class_types`; cada uno con su color/etiqueta para el calendario.)

## 7. Precios y paquetes (datos completos)

Moneda: MXN. Vigencia de paquetes: **30 días (1 mes)** desde activación.

**Individuales**

| Concepto | Detalle | Precio |
|---|---|---|
| Clase muestra (prueba) | 1 clase | $300 |
| Clase suelta · Sculpt-Funcional | drop-in | $380 |
| Clase suelta · Surf-Pilates | drop-in | $420 |
| Clase suelta · Yoga | drop-in | $350 |
| Inscripción | pago único | $500 |

**Regla de descuento:** si la clienta se inscribe **el mismo día** que tomó la clase muestra, los $300 de la muestra se descuentan de la inscripción (paga $200 de inscripción).

**Grupo A — Sculpt-Funcional + Yoga**

| Paquete | Clases | Precio |
|---|---|---|
| Sunrise Pack | 4 | $1,400 |
| Golden Hour | 8 | $2,600 |
| Sunset Flow | 12 | $3,600 |
| Full Day Experience | Ilimitadas | $4,500 |

**Grupo B — Surf-Pilates + Yoga**

| Paquete | Clases | Precio |
|---|---|---|
| Wave Starter | 4 | $1,560 |
| Ocean Flow | 8 | $2,960 |
| Deep Flow | 12 | $4,080 |
| Endless Waves | Ilimitadas | $5,200 |

**Grupo C — Mixto (Sculpt-Funcional + Surf-Pilates + Yoga)**

| Paquete | Clases | Composición exacta | Precio |
|---|---|---|---|
| Balanced Flow | 8 | 3 Sculpt-Funcional · 3 Surf-Pilates · 2 Yoga | $2,280 |
| Elevate Experience | 12 | 6 Sculpt-Funcional · 4 Surf-Pilates · 2 Yoga | $3,700 |
| Full Experience | 16 | 8 Sculpt-Funcional · 6 Surf-Pilates · 2 Yoga | $4,900 |
| Sunrise Sunset Combo | Ilimitadas | — (cualquiera de los 3) | $5,600 |

## 8. Modelo de créditos por tipo de clase

**Problema:** un único pozo de créditos (`memberships.classes_remaining`, `NULL` = ilimitado) que descuenta 1 crédito por reserva **sin importar el tipo de clase** es insuficiente. Los paquetes de Sunrise restringen por tipo y, en los mixtos, fijan la composición.

**Solución: "credit buckets" (cubetas de crédito) por plan, con seguimiento por cubeta en la membresía.**

Patrones a cubrir:
- **Grupos A/B** → 1 cubeta con varios tipos permitidos (pozo compartido). Ej.: Sunrise Pack = `{ tipos: [Sculpt-Funcional, Yoga], count: 4 }`.
- **Grupo C mixto** → varias cubetas, cada una de un solo tipo (composición exacta, obligatoria). Ej.: Balanced Flow = `[{[Sculpt-Funcional],3}, {[Surf-Pilates],3}, {[Yoga],2}]`.
- **Ilimitados** → cubeta con `count = NULL` + tipos permitidos. Ej.: Full Day Experience = `{[Sculpt-Funcional, Yoga], NULL}`; Sunrise Sunset Combo = `{[los 3], NULL}`.
- **Sueltas / muestra** → plan de 1 clase, 1 tipo, sin membresía recurrente (compra única).

**Esquema (DB):**
- Definición del plan: tabla `plan_credit_buckets (id, plan_id FK, allowed_class_type_ids, credit_count INTEGER NULL)`.
  - (Alternativa equivalente: columna JSONB `plans.credit_rules` con `[{ class_type_ids, count }]`. Se elige tabla relacional por integridad referencial con `class_types`.)
- Instancia de la membresía: tabla `membership_credits (id, membership_id FK, allowed_class_type_ids, remaining INTEGER NULL)`, una fila por cubeta, copiada del plan al activar la membresía.

**Lógica de reserva (`bookings.ts`):**
1. Para una clase de tipo `T`, buscar una cubeta elegible de la membresía: `T ∈ allowed_class_type_ids` y (`remaining > 0` o `remaining IS NULL`).
2. Prioridad: cubeta **más específica primero** (las de un solo tipo antes que las multi-tipo), para que los mixtos consuman la cubeta correcta.
3. Descontar 1 de la cubeta elegida (si no es ilimitada).
4. Si no hay cubeta elegible: rechazar con mensaje claro (ej. "Tu paquete no incluye Surf-Pilates" o "Sin créditos de Yoga disponibles").
5. Al cancelar dentro de la política: devolver el crédito a la cubeta de la que salió.

**Admin / editor de planes:** la creación/edición de plan permite definir cubetas (tipos permitidos + cantidad). Para v1 los 12 paquetes se cargan por seed; el editor visual de cubetas puede ser una mejora posterior si hace falta.

**Compatibilidad:** se conserva `classes_remaining` como total derivado (suma de cubetas) para no romper vistas/Wallet/reportes existentes que lo leen; las cubetas son la fuente de verdad para la deducción.

## 9. Políticas

- **Cancelación / reagendar:** con anticipación mínima (valor **pendiente**: 1 h / 12 h / 24 h — el brief tiene las tres; el studio confirma). Configurable en ajustes.
- **No-show:** clase tomada (se consume el crédito).
- Llegar 5–10 min antes; respetar horario de inicio.
- Uso de calcetines/equipo según la clase.
- Paquetes con vigencia de 30 días.

## 10. Datos de configuración pendientes (los entrega el studio)

Estos NO bloquean el desarrollo: se implementan como **ajustes configurables desde el panel admin** y se llenan cuando lleguen.

| Dato | Estado | Dónde se setea |
|---|---|---|
| Capacidad por clase | Pendiente | Ajuste por clase/horario |
| Horarios reales (días + horas) | Pendiente | Editor de horarios |
| Ventana de cancelación (1/12/24 h) | Pendiente | Ajustes del studio |
| Hex exactos de la paleta | Aprox. (de imagen) | Tokens de tema |
| Confirmar canales de contacto | Asumido: solo correo | Ajustes |
| Teléfono / WhatsApp | Asumido: no en v1 | Ajustes |

## 11. Fuera de alcance (YAGNI v1)

- Integración WhatsApp / Evolution (queda disponible en el código pero apagada).
- Videos / contenido on-demand (no es prioridad de Sunrise para v1).
- App móvil nativa (la web responsiva cubre móvil).
- Multi-sucursal.

## 12. Supuestos y preguntas abiertas

1. **"Duración de un mes"** aparece bajo "Clase Muestra" y "Clase Suelta" en los screenshots; se asume artefacto de copy y que muestra/suelta son de **un solo uso**. (Confirmar con el studio.)
2. Recordatorios **solo por correo** en v1 (sin teléfono/WhatsApp). (Confirmar.)
3. Composición de paquetes mixtos = **obligatoria** (decisión aprobada).
4. Sueltas disponibles para no-miembros y/o miembros sin créditos (no requieren inscripción). (Confirmar si la suelta exige inscripción.)
