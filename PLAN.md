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

### Paso 1 — Auth mínima (RF-01 a 07)
- Registro email/password con hash (RNF-04), login, logout, moneda por defecto (RF-07).
- RF-06 (recuperación por email) al final, depende de servicio de email externo (§8).
- TDD: tests de validación de email (RF-02), email duplicado (RF-03), credenciales (RF-04/05).

### Paso 2 — F1: Finanzas personales
- CRUD de movimientos (ingreso/egreso: monto, fecha, categoría, nota) — RF-08 a 12.
- Categorías predefinidas + gestión (RF-14, 15).
- Cálculo de saldo (RF-13).
- Validaciones transversales aplicables (RF-41, 42, 43, 45, 46).
- TDD: tests de cálculo de saldo y validaciones antes de la implementación.

### Paso 3 — F2: Grupos + gasto compartido (partes iguales)
- Crear grupo con moneda (RF-21), invitación por enlace (RF-22/23/48).
- Gasto compartido en partes iguales (RF-24/25) con reparto determinístico del centavo residual (mitigación R1).
- Validación de que las partes suman el total (RF-28).
- Balance neto por miembro (RF-29). Settlement (RF-31). Editar/borrar/salir (RF-32/33/34).
- Control de acceso por grupo (RNF-06, AC-47). Bloqueo optimista por versión (R6).
- TDD: tests de split, de balance neto y de validación de partes antes de implementar (núcleo de RNF-13 ≥ 70%).

### Paso 4 — F3: Integración automática (el diferencial)
- El gasto compartido genera el egreso personal del usuario por su parte (RF-35), dentro de una **transacción atómica** (mitigación R4).
- Actualiza el movimiento personal al editar la parte (RF-36) y lo elimina al borrar el gasto (RF-37).
- TDD: tests de integración RF-35/36/37 antes de implementar.

### Paso 5 — Panel inicial (RF-38)
- Saldo personal + total adeudado/por cobrar en grupos (AC-36).
- Cierra el loop visible del diferencial.

## Trazabilidad

Cada paso implementa RF concretos con sus AC asociados (ver §5 del PRD). La verificación de cada paso se hace contra sus AC en formato Dado/Cuando/Entonces.

## Estado

- [ ] Paso 0 — Fundaciones (en curso)
- [ ] Paso 1 — Auth
- [ ] Paso 2 — F1 Finanzas personales
- [ ] Paso 3 — F2 Grupos + gasto compartido
- [ ] Paso 4 — F3 Integración automática
- [ ] Paso 5 — Panel inicial
