import Decimal from 'decimal.js';

// Redondeo bancario-neutral consistente en toda la app. Los montos NUNCA se
// manejan con coma flotante (RNF-11): siempre a través de estas utilidades.
Decimal.set({ rounding: Decimal.ROUND_HALF_UP });

export type MoneyInput = string | number | Decimal;

/**
 * Construye un Decimal exacto a partir de un valor.
 * Preferir siempre strings como fuente para evitar la imprecisión de floats.
 */
export function toMoney(value: MoneyInput): Decimal {
  const amount = new Decimal(value);
  if (!amount.isFinite()) {
    throw new Error(`Monto inválido: ${String(value)}`);
  }
  return amount;
}

/** RF-41: el monto debe ser mayor a cero. */
export function isPositiveAmount(value: MoneyInput): boolean {
  return toMoney(value).greaterThan(0);
}

/** RF-43: no se admiten montos con más de dos decimales. */
export function hasValidScale(value: MoneyInput): boolean {
  return toMoney(value).decimalPlaces() <= 2;
}

export function addMoney(a: MoneyInput, b: MoneyInput): Decimal {
  return toMoney(a).plus(toMoney(b));
}

export function subtractMoney(a: MoneyInput, b: MoneyInput): Decimal {
  return toMoney(a).minus(toMoney(b));
}
