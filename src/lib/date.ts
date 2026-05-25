import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Fuente única del locale es. Los componentes que necesiten pasar el locale a
// terceros (p. ej. el prop `locale={es}` de react-day-picker) deben importarlo
// desde aquí, NUNCA directo de 'date-fns/locale' (rompía en el bundle minificado).
export { es };

export function formatDbDate(value: string | Date | null | undefined): string {
  if (!value) return 'Sin fecha';
  const iso = value instanceof Date ? value.toISOString() : String(value);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return new Date(iso).toLocaleDateString();
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString();
}

/**
 * Formatea una fecha con date-fns (locale es) de forma segura: si el valor es
 * null/undefined o no es una fecha válida, devuelve `fallback` en vez de lanzar
 * `RangeError: Invalid time value` (que tiraba listas completas vía ErrorBoundary).
 */
export function safeFormat(
  value: string | Date | null | undefined,
  fmt: string,
  fallback = '—'
): string {
  if (!value) return fallback;
  try {
    const date = value instanceof Date ? value : parseISO(String(value));
    if (!isValid(date)) return fallback;
    return format(date, fmt, { locale: es });
  } catch {
    return fallback;
  }
}

/**
 * Versión segura de `formatDistanceToNow` (locale es, addSuffix). Devuelve
 * `fallback` para fechas null/inválidas en vez de lanzar RangeError.
 */
export function safeDistanceToNow(
  value: string | Date | null | undefined,
  fallback = '—'
): string {
  if (!value) return fallback;
  try {
    const date = value instanceof Date ? value : parseISO(String(value));
    if (!isValid(date)) return fallback;
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  } catch {
    return fallback;
  }
}
