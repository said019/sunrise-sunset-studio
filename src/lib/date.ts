import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Fuente única del locale es. Los componentes que necesiten pasar el locale a
// terceros (p. ej. el prop `locale={es}` de react-day-picker) deben importarlo
// desde aquí, NUNCA directo de 'date-fns/locale' (rompía en el bundle minificado).
export { es };

/**
 * Studio timezone — Sunrise Sunset is in El Tezal, Cabo San Lucas (Baja
 * California Sur). MST year-round, no DST → fixed UTC-7. Use this whenever
 * we render a "what time is it at the studio right now" — never trust the
 * visitor's device clock, since they may be in CDMX (UTC-6), the US, Europe,
 * etc. and we want the studio's reality, not theirs.
 */
export const STUDIO_TZ = 'America/Mazatlan';

/**
 * Returns the current wall-clock components in studio TZ, regardless of
 * where the user's device is. Use these instead of `Date#getHours()` /
 * `Date#getMinutes()` / `Date#getDay()` for anything that should reflect
 * "what's happening at the studio right now".
 *
 * `dayOfWeekMon0`: Monday=0, Tuesday=1, … Sunday=6 (matches the schedule
 * arrays used throughout the app).
 */
export function nowInStudioTz(now: Date = new Date()): {
    hours: number;
    minutes: number;
    dayOfWeekMon0: number;
} {
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: STUDIO_TZ,
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'short',
        hour12: false,
    });
    const parts = fmt.formatToParts(now);
    const get = (k: string) => parts.find(p => p.type === k)?.value || '';
    const hour = parseInt(get('hour'), 10);
    const hours = Number.isFinite(hour) ? hour % 24 : 0;  // some locales emit '24' for midnight
    const minutes = parseInt(get('minute'), 10) || 0;
    const weekdayMap: Record<string, number> = {
        Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6,
    };
    return { hours, minutes, dayOfWeekMon0: weekdayMap[get('weekday')] ?? 0 };
}

/**
 * Formats a Date as `HH:MM` (or `HH:MM AM/PM`) in studio TZ. Convenience
 * wrapper over `toLocaleTimeString` that always forces the studio's clock.
 */
export function formatStudioTime(
    now: Date,
    locale: string = 'es-MX',
    options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false }
): string {
    return now.toLocaleTimeString(locale, { ...options, timeZone: STUDIO_TZ });
}

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
