# AGENTS — Proyecto Finanzas + Gastos Compartidos

## Stack (por definir)
- Webapp responsive mobile-first
- Un solo idioma (es-AR), moneda única por usuario (MVP)

## MVP núcleo (38 RF) — Entregable inicial
**Autenticación:** RF-01 a RF-07 (registro, login, logout, recovery, moneda por defecto)

**Finanzas personales:** RF-08 a RF-15 (CRUD movimientos ingreso/egreso, saldo, categorías predefinidas y custom)

**Grupos y gastos compartidos:** RF-21 a RF-25, RF-28, RF-29, RF-31 a RF-34 (crear grupos, invitar por link, unirse, gasto compartido, split igualitario, balance neto por miembro, settlements, CRUD gastos)

**Integración personal ↔ compartido:** RF-35 a RF-37 (auto-generación de egreso personal al crear gasto compartido, update/delete en cascada)

**Dashboard:** RF-38 (panel con saldo personal + total adeudado/por cobrar)

**Validaciones transversales:** RF-41 a RF-48 (montos >0, campos obligatorios, 2 decimales, paginación 50, confirmación delete, manejo errores red, enlaces expirados)

## Fase 2 (post-MVP)
RF-16/17 (filtros), RF-18/19/20 (presupuestos), RF-26/27 (split por monto exacto y %), RF-30 (liquidación optimizada), RF-39/40 (reportes y CSV)

## Pautas de implementación
- **Aritmética decimal exacta** — nada de floats para montos (RNF-11)
- **`currency_code` ISO 4217** en cada monto y por grupo (RNF-17 — preparación multi-moneda, aunque MVP use moneda única)
- **WCAG 2.1 AA** y responsive desde 320px (RNF-08, RNF-09)
- **Tests ≥ 70% coverage** en lógica de balances (RNF-13)
- transacciones atómicas en RF-35/36/37 (consistencia gasto compartido ↔ movimiento personal)
- Confirmación explícita antes de cualquier delete (RF-46)

## Documentos PDR
- `PDR-2.md` — versión 1.2 (actualizada, contiene trazabilidad RF-AC, riesgos, fuera de alcance)
- `PDR.md` — versión 1.1 (deprecada)
