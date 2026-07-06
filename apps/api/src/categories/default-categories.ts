/**
 * RF-15: conjunto de categorías predefinidas que se crean al abrir la cuenta.
 * Se siembran como isDefault=true; el usuario puede sumar las suyas (RF-14).
 */
export const DEFAULT_CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Vivienda',
  'Servicios',
  'Salud',
  'Entretenimiento',
  'Educación',
  'Ingresos',
  'Otros',
] as const;
