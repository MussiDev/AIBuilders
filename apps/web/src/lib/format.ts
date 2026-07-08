/** Formatea un monto (string decimal exacto) como moneda es-AR para mostrar. */
export function formatMoney(amount: string, currency: string | null): string {
  const value = Number(amount);
  const code = currency ?? 'ARS';
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: code,
    }).format(value);
  } catch {
    // Código de moneda no reconocido por Intl: fallback legible.
    return `${code} ${amount}`;
  }
}
