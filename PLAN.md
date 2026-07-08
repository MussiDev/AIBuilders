# PLAN — Construcción del core (MVP núcleo + panel)

> Fuente: `PRD-2.md` (v1.2, 2026-07-05). Priorización MVP núcleo vs Fase 2 tomada del §3.0 del PRD.
> Metodología: **TDD estricto** — para toda lógica con comportamiento verificable se escribe el test ANTES que la implementación (red → green → refactor). La cobertura de cálculo de balances debe quedar ≥ 70% (RNF-13).

## Qué es "el core"

El diferencial del producto (O3) no es "finanzas personales" ni "gastos compartidos" por separado, sino **la integración de ambos**: un gasto compartido genera automáticamente el egreso personal del usuario por la parte que le corresponde. Por eso las 3 features principales son:

- **F1 — Finanzas personales** (RF-08 a 15, RF-13): CRUD de movimientos + saldo.
- **F2 — Grupo + gasto compartido en partes iguales** (RF-21 a 25, 28, 29, 31 a 34): crear grupo, invitar, dividir en partes iguales, balance neto, settlement.
- **F3 — Integración automática** (RF-35 a 37): **EL diferencial**. El gasto compartido crea/edita/borra el egreso personal asociado, de forma atómica.

Auth (RF-01 a 07) es prerrequisito de F2 (sin usuarios no hay miembros ni control de acceso RNF-06), por eso va como paso previo, no como feature diferencial.

## Alcance de esta entrega

**Pasos 0 a 5 — MVP núcleo + panel.** Confirmado con el usuario.
Fuera de esta entrega (Fase 2, §6 del PRD): presupuestos (RF-18/19/20), filtros (RF-16/17), división por monto exacto y por porcentaje (RF-26/27), liquidación optimizada (RF-30), reporte por categoría y export CSV (RF-39/40).

## Reglas transversales (aplican a TODOS los pasos)

- **RNF-11 — Decimal exacto:** cero floats para montos. `Decimal` en Prisma + `decimal.js` en JS. Ni `number`, ni `float`, ni `Double`.
- **RNF-17 — Preparación multi-moneda:** todo monto persiste `currency_code` ISO 4217; cada grupo tiene una moneda única. Sin lógica de conversión en el MVP.
- **RNF-04 — Seguridad:** contraseñas con hashing fuerte (Argon2/bcrypt), nunca en texto plano.
- **RNF-06 — Control de acceso:** un usuario solo accede a datos de grupos de los que es miembro.
- **RNF-15 — Localización:** textos de UI en español (es-AR).
- **Validaciones transversales:** RF-41 (monto > 0), RF-42 (campos obligatorios), RF-43 (máx. 2 decimales), RF-45 (error legible), RF-46 (confirmar borrado), RF-47 (conservar datos ante error), RF-48 (invitación inválida/expirada).

## Pasos, en orden

Cada paso deja algo verificable end-to-end y se detiene para revisión antes de continuar.

### Paso 0 — Fundaciones  ⟵ EN CURSO
Objetivo: base sobre la que se construye todo. Sin lógica de negocio de features.
- Monorepo pnpm workspaces: `apps/api` (NestJS), `apps/web` (Next.js), `packages/shared`.
- Prisma + PostgreSQL: schema base con las entidades del dominio, usando `Decimal(14,2)` y `currency_code` (RNF-11, RNF-17).
- `packages/shared`: utilidades de dinero (decimal exacto) + validaciones de monto (RF-41, RF-43). **TDD: tests primero.**
- Vitest configurado y corriendo (prueba de que el harness de tests funciona).
- Bootstrap mínimo de NestJS (health check) y Next.js (página base).
- Scripts raíz: `pnpm dev`, `pnpm test`, `pnpm install`.
- **No incluye:** endpoints de negocio, auth, UI de features, lógica de split/balances (llegan en sus pasos).

### Paso 1 — Auth mínima (RF-01 a 07)  ⟵ EN CURSO
- Registro email/password con hash (RNF-04), login, logout, moneda por defecto (RF-07).
- RF-06 (recuperación por email) al final, depende de servicio de email externo (§8). **Diferido** (no entra en este slice).
- TDD: tests de validación de email (RF-02), email duplicado (RF-03), credenciales (RF-04/05).
- Sesión: **JWT en cookie httpOnly** (SameSite=lax; `secure` en producción). Logout borra la cookie server-side (RF-05/AC-06).
- Hashing con **bcryptjs** (JS puro, sin build nativo en Windows; RNF-04 admite bcrypt).
- Base para RNF-06: `JwtAuthGuard` que lee la cookie + endpoint `GET /auth/me` como prueba E2E de la sesión.
- Hecho: DTOs (`register`/`login`) validados con class-validator, `AuthService`, `AuthController`, `AuthModule`, `ValidationPipe` global + `cookie-parser`. **21 tests API en verde.**

### Paso 2 — F1: Finanzas personales  ⟵ EN CURSO
- CRUD de movimientos (ingreso/egreso: monto, fecha, categoría, nota) — RF-08 a 12.
- Categorías predefinidas + gestión (RF-14, 15).
- Cálculo de saldo (RF-13).
- Validaciones transversales aplicables (RF-41, 42, 43, 45, 46).
- TDD: tests de cálculo de saldo y validaciones antes de la implementación.
- Hecho: `MovementsModule` y `CategoriesModule` (service/controller/DTOs), validadores de monto reutilizando `@app/shared` (RF-41/43), decorador `@CurrentUserId` (RNF-06), saldo con decimal exacto (RF-13), paginación (RF-44), siembra de categorías predefinidas en el registro (RF-15). **49 tests API en verde; build tsc limpio.**
- Pendiente (igual que Paso 1): migración/prueba con DB real y UI web.

### Paso 3 — F2: Grupos + gasto compartido (partes iguales)  ⟵ EN CURSO
- Crear grupo con moneda (RF-21), invitación por enlace (RF-22/23/48).
- Gasto compartido en partes iguales (RF-24/25) con reparto determinístico del centavo residual (mitigación R1).
- Validación de que las partes suman el total (RF-28).
- Balance neto por miembro (RF-29). Settlement (RF-31). Editar/borrar/salir (RF-32/33/34).
- Control de acceso por grupo (RNF-06, AC-47). Bloqueo optimista por versión (R6).
- TDD: tests de split, de balance neto y de validación de partes antes de implementar (núcleo de RNF-13 ≥ 70%).
- **Decisiones tomadas:** categoría del gasto compartido como etiqueta de texto libre (campo `category` en `SharedExpense`); invitación de un solo uso con TTL 7 días (campo `acceptedAt` en `Invitation`).
- Hecho: `splitEqually` en `@app/shared` (reparto del centavo residual a los primeros miembros en orden estable, TDD primero); `GroupsModule` con `GroupsService` (grupos/invitaciones/salir con balance en cero), `SharedExpensesService` (CRUD de gastos + split + bloqueo optimista R6) y `BalanceService` (balance neto RF-29 + settlement RF-31); DTOs validados con class-validator; control de acceso por membresía (RNF-06) en toda operación. **97 tests en verde (17 shared + 80 API); build tsc limpio.**
- Pendiente (igual que pasos 1-2): migración/prueba con DB real y UI web. Nota: como MVP sólo divide en partes iguales, RF-28 se cubre como invariante (las partes calculadas suman exacto); la división por monto exacto/porcentaje (RF-26/27) es Fase 2.

### Paso 4 — F3: Integración automática (el diferencial)  ⟵ EN CURSO
- El gasto compartido genera el egreso personal del usuario por su parte (RF-35), dentro de una **transacción atómica** (mitigación R4).
- Actualiza el movimiento personal al editar la parte (RF-36) y lo elimina al borrar el gasto (RF-37).
- TDD: tests de integración RF-35/36/37 antes de implementar.
- **Decisión tomada:** el egreso autogenerado usa una categoría dedicada `Gastos compartidos` por usuario, creada on-demand (upsert). Se genera un egreso **por cada miembro** por su parte, con la moneda del grupo (RNF-17).
- Hecho: `syncPersonalMovements` en `SharedExpensesService` — crea el egreso personal de cada parte enlazado vía `sourceShareId` (RF-35), lo regenera al editar el gasto (RF-36), todo dentro de la misma transacción del gasto (R4). El borrado (RF-37) es automático por cascada del schema (`Movement.sourceShare onDelete: Cascade`). Sin cambios de schema (el Paso 0 ya lo preveía). **81 tests API en verde; build tsc limpio.**
- Pendiente (igual que pasos previos): prueba con DB real y UI web.

### Paso 5 — Panel inicial (RF-38)  ⟵ HECHO (verificado end-to-end)
- Saldo personal + total adeudado/por cobrar en grupos (AC-36).
- Cierra el loop visible del diferencial.
- **Alcance ampliado (decisión del usuario): slice vertical completo** — se cerró la deuda de DB real + UI web, no solo el endpoint.
- Backend: `DashboardService`/`DashboardController` (`GET /dashboard`) que compone el saldo personal (RF-13) con el total adeudado/por cobrar sumando el balance neto de cada grupo del usuario. TDD, 84 tests API en verde.
- Infra: **PostgreSQL real** vía Docker (`docker-compose.yml`, contenedor `finanzas-db` en el puerto host 5435 para no chocar con el Postgres local ni otros contenedores). Primera **migración Prisma** aplicada (`init`): base `currency-manager` + todas las tablas.
- Web (`apps/web`): **shadcn/ui + Tailwind** (pivote desde CSS Modules). Patrón **BFF**: el navegador solo habla con Next; los **Server Actions** (login/register/logout, validados con **Zod**, `useActionState`/`useTransition`) llaman a la API server-to-server y setean la cookie de sesión en el origin de la app; el panel es un server component que reenvía la cookie a la API. Páginas: `/login`, `/register`, `/` (panel).
- **Bug encontrado y corregido al bootstrapear:** `AuthModule` no exportaba `JwtModule`, así que `JwtService` no estaba disponible al instanciar `JwtAuthGuard` en los módulos que lo reusan (`Categories`/`Movements`/`Groups`/`Dashboard`). Latente desde el Paso 1 porque los tests unitarios nunca levantaron el grafo de módulos. Fix: exportar `JwtModule` desde `AuthModule`.
- **Verificación end-to-end:** registro → `/auth/me` → `/dashboard` (200 contra DB real); web: `/` sin sesión → 307 a `/login`, `/` con cookie válida → 200 renderizando el panel con datos reales.

## Trazabilidad

Cada paso implementa RF concretos con sus AC asociados (ver §5 del PRD). La verificación de cada paso se hace contra sus AC en formato Dado/Cuando/Entonces.

## Estado

Nota: la **DB real** (Postgres en Docker) y la **primera migración** ya están hechas — aplican a todos los pasos. La UI web construida hasta ahora es auth (`/login`, `/register`) + panel (`/`); las pantallas de las features (movimientos personales del Paso 2, grupos/gastos del Paso 3/4) siguen siendo backend-only.

- [x] Paso 0 — Fundaciones
- [x] Paso 1 — Auth (backend + tests + UI login/registro + DB real; verificado e2e)
- [~] Paso 2 — F1 Finanzas personales (backend + tests + DB real; **falta UI** de movimientos/categorías/saldo)
- [~] Paso 3 — F2 Grupos + gasto compartido (backend + tests + DB real; **falta UI** de grupos/gastos/balance)
- [~] Paso 4 — F3 Integración automática (backend + tests + DB real; se ejercita al usar la UI de gastos, aún pendiente)
- [x] Paso 5 — Panel inicial (backend + UI + DB real; verificado e2e)
