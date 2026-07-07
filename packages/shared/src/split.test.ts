import { describe, it, expect } from 'vitest';
import { splitEqually } from './split';

/**
 * Reparto en partes iguales con distribución determinística del centavo residual
 * (mitigación del riesgo R1). Núcleo de RF-25 / RF-28 y de la cobertura RNF-13.
 */
describe('splitEqually', () => {
  // AC-23: $1.000 entre 4 → $250 cada uno (divisible exacto, sin residuo).
  it('divide un monto exacto en partes iguales', () => {
    const parts = splitEqually('1000.00', 4);
    expect(parts.map((p) => p.toFixed(2))).toEqual([
      '250.00',
      '250.00',
      '250.00',
      '250.00',
    ]);
  });

  // R1: $1.000 / 3 = 333.33 con 1 centavo residual → va a los primeros miembros.
  it('asigna el centavo residual a los primeros miembros en orden estable', () => {
    const parts = splitEqually('1000.00', 3);
    expect(parts.map((p) => p.toFixed(2))).toEqual([
      '333.34',
      '333.33',
      '333.33',
    ]);
  });

  // RF-28: la suma de las partes SIEMPRE es igual al total, sin pérdida de centavos.
  it('la suma de las partes es exactamente el total (RF-28)', () => {
    for (const [total, n] of [
      ['1000.00', 3],
      ['0.01', 3],
      ['99.99', 7],
      ['10.00', 6],
      ['1234.57', 11],
    ] as const) {
      const parts = splitEqually(total, n);
      const sum = parts.reduce((acc, p) => acc.plus(p), parts[0].minus(parts[0]));
      expect(sum.toFixed(2)).toBe(total);
      expect(parts).toHaveLength(n);
    }
  });

  // Caso límite: monto menor que la cantidad de miembros (1 centavo entre 3).
  it('reparte 1 centavo entre 3 miembros (solo el primero recibe)', () => {
    const parts = splitEqually('0.01', 3);
    expect(parts.map((p) => p.toFixed(2))).toEqual(['0.01', '0.00', '0.00']);
  });

  it('un único miembro recibe el total', () => {
    const parts = splitEqually('750.25', 1);
    expect(parts.map((p) => p.toFixed(2))).toEqual(['750.25']);
  });

  it('rechaza una cantidad de miembros menor a 1', () => {
    expect(() => splitEqually('100.00', 0)).toThrow();
  });

  it('rechaza montos con más de dos decimales (RF-43)', () => {
    expect(() => splitEqually('100.001', 2)).toThrow();
  });
});
