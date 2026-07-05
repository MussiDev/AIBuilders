# AGENTS — Finanzas Personales + Gastos Compartidos

## Propósito
Webapp que unifica finanzas personales (ingresos/egresos/saldo) con gastos compartidos en grupos. Un gasto compartido genera automáticamente el egreso personal del usuario por su parte, eliminando la doble carga.

## Stack
- **Frontend:** Next.js
- **Backend:** NestJS
- **BD:** PostgreSQL + Prisma
- **Monorepo:** pnpm workspaces
- **Tests:** Vitest

## Cómo correr
```bash
pnpm install     # instalar dependencias (todo el monorepo)
pnpm dev         # levantar frontend + backend concurrente
pnpm test        # correr tests con Vitest
```

## Qué NO hacer
- **Nada de floats para montos.** Usar siempre aritmética decimal exacta (RNF-11). Ni `number`, ni `float`, ni `Double`.
- **No implementar multi-moneda en el MVP.** El modelo puede preparar `currency_code` para futuro, pero no hay conversión ni lógica multi-moneda ahora.
- **No tocar features fuera de alcance del MVP:** nada de integración bancaria/open banking, apps nativas, pasarelas de pago, gastos recurrentes automáticos, modo offline, adjuntar imágenes, ni internacionalización.
