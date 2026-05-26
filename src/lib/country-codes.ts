// Country dialing codes for the phone field on registration.
// México es el default; el resto cubre los orígenes habituales de visitantes a Los Cabos.
// Si agregas un país, mantén "México" como primer elemento (ese es el default).

export interface Country {
    iso: string;       // ISO 3166-1 alpha-2
    name: string;      // Display name (es-MX)
    dialCode: string;  // E.164 prefix incl. '+'
    flag: string;      // Emoji
}

export const COUNTRIES: Country[] = [
    { iso: 'MX', name: 'México',           dialCode: '+52', flag: '🇲🇽' },
    { iso: 'US', name: 'Estados Unidos',   dialCode: '+1',  flag: '🇺🇸' },
    { iso: 'CA', name: 'Canadá',           dialCode: '+1',  flag: '🇨🇦' },
    { iso: 'ES', name: 'España',           dialCode: '+34', flag: '🇪🇸' },
    { iso: 'GB', name: 'Reino Unido',      dialCode: '+44', flag: '🇬🇧' },
    { iso: 'DE', name: 'Alemania',         dialCode: '+49', flag: '🇩🇪' },
    { iso: 'FR', name: 'Francia',          dialCode: '+33', flag: '🇫🇷' },
    { iso: 'IT', name: 'Italia',           dialCode: '+39', flag: '🇮🇹' },
    { iso: 'CH', name: 'Suiza',            dialCode: '+41', flag: '🇨🇭' },
    { iso: 'NL', name: 'Países Bajos',     dialCode: '+31', flag: '🇳🇱' },
    { iso: 'AR', name: 'Argentina',        dialCode: '+54', flag: '🇦🇷' },
    { iso: 'BR', name: 'Brasil',           dialCode: '+55', flag: '🇧🇷' },
    { iso: 'CL', name: 'Chile',            dialCode: '+56', flag: '🇨🇱' },
    { iso: 'CO', name: 'Colombia',         dialCode: '+57', flag: '🇨🇴' },
    { iso: 'PE', name: 'Perú',             dialCode: '+51', flag: '🇵🇪' },
    { iso: 'AU', name: 'Australia',        dialCode: '+61', flag: '🇦🇺' },
    { iso: 'JP', name: 'Japón',            dialCode: '+81', flag: '🇯🇵' },
];

export const DEFAULT_COUNTRY: Country = COUNTRIES[0]; // México

export function findCountryByISO(iso: string): Country | undefined {
    return COUNTRIES.find((c) => c.iso === iso);
}

export interface PhoneParts {
    country: Country;
    national: string;
}

/**
 * Splits a stored E.164 phone like "+529876543210" into { country, national }.
 * Falls back to MX + raw digits when the input lacks a '+' prefix or the dial
 * code isn't in our list. Sorts dial codes by length DESC so '+52' matches
 * before '+5'.
 */
export function parsePhoneToParts(fullPhone?: string | null): PhoneParts {
    const phone = (fullPhone || '').trim();
    if (!phone) return { country: DEFAULT_COUNTRY, national: '' };
    if (!phone.startsWith('+')) {
        return { country: DEFAULT_COUNTRY, national: phone.replace(/\D/g, '') };
    }
    const digitsOnly = phone.slice(1).replace(/\D/g, '');
    const byLengthDesc = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of byLengthDesc) {
        const code = c.dialCode.slice(1);
        if (digitsOnly.startsWith(code)) {
            return { country: c, national: digitsOnly.slice(code.length) };
        }
    }
    return { country: DEFAULT_COUNTRY, national: digitsOnly };
}
