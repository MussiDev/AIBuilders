import Decimal from 'decimal.js';
import { hasValidScale, MoneyInput, toMoney } from './money';

/**
 * Divide un monto en `memberCount` partes iguales, en centavos exactos.
 *
 * El centavo residual (cuando el total no es divisible) se reparte de forma
 * determinística entre los PRIMEROS miembros del arreglo, un centavo a cada uno
 * hasta agotarlo (mitigación del riesgo R1: reparto reproducible y sin pérdida).
 * La suma de las partes es siempre exactamente el total (RF-28).
 *
 * El orden del resultado es responsable del llamador: debe ordenar a los
 * miembros de forma estable (p. ej. por id) antes de asignar cada parte.
 */
export function splitEqually(total: MoneyInput, memberCount: number): Decimal[] {
  if (!Number.isInteger(memberCount) || memberCount < 1) {
    throw new Error(`Cantidad de miembros inválida: ${String(memberCount)}`);
  }
  if (!hasValidScale(total)) {
    throw new Error(`El monto no admite más de dos decimales: ${String(total)}`);
  }

  // Se trabaja en centavos enteros para evitar cualquier residuo fraccionario.
  const totalCents = toMoney(total).times(100);
  const baseCents = totalCents.dividedToIntegerBy(memberCount);
  const remainder = totalCents.minus(baseCents.times(memberCount)).toNumber();

  return Array.from({ length: memberCount }, (_, index) =>
    baseCents.plus(index < remainder ? 1 : 0).dividedBy(100),
  );
}
