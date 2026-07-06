import { describe, it, expect } from 'vitest';
import {
  toMoney,
  isPositiveAmount,
  hasValidScale,
  addMoney,
  subtractMoney,
} from './money';

describe('toMoney', () => {
  it('construye un decimal exacto desde string', () => {
    expect(toMoney('10.50').toFixed(2)).toBe('10.50');
  });

  it('rechaza valores no numéricos', () => {
    expect(() => toMoney('abc')).toThrow();
  });
});

describe('aritmética decimal exacta (RNF-11)', () => {
  it('0.1 + 0.2 === 0.3 (sin error de coma flotante)', () => {
    expect(addMoney('0.1', '0.2').toString()).toBe('0.3');
  });

  it('resta sin pérdida de precisión', () => {
    expect(subtractMoney('1000.00', '999.99').toString()).toBe('0.01');
  });
});

describe('isPositiveAmount (RF-41)', () => {
  it('acepta montos mayores a cero', () => {
    expect(isPositiveAmount('0.01')).toBe(true);
  });

  it('rechaza cero', () => {
    expect(isPositiveAmount('0')).toBe(false);
  });

  it('rechaza negativos', () => {
    expect(isPositiveAmount('-5')).toBe(false);
  });
});

describe('hasValidScale (RF-43)', () => {
  it('acepta hasta dos decimales', () => {
    expect(hasValidScale('10.99')).toBe(true);
  });

  it('acepta enteros', () => {
    expect(hasValidScale('10')).toBe(true);
  });

  it('rechaza más de dos decimales', () => {
    expect(hasValidScale('10.999')).toBe(false);
  });
});
