export interface StudioClassType {
  name: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  durationMinutes: number;
  maxCapacity: number;
  icon?: string;
}

export interface StudioPalette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  ring: string;
  heroGradient: string;
  cardGradient: string;
  overlayDark: string;
  glowSage: string;
  glowWarm: string;
}

export interface StudioInfo {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  mapUrl: string;
  classTypes: StudioClassType[];
  bank: {
    name: string;
    account: string;
    clabe: string;
    beneficiary: string;
  };
  businessHours: Array<{ label: string; hours: string }>;
  palette: StudioPalette;
}

const studioDirectory: Record<string, StudioInfo> = {
  balance: {
    slug: 'balance',
    name: 'Sunrise Sunset',
    tagline: 'Sculpt, Surf-Pilates y Yoga en un espacio sereno.',
    description:
      'Sesiones íntimas, ritmo consciente y membresías digitales con nuestra Membresía.',
    addressLine: 'Carretera Transpeninsular km 3.5',
    city: 'El Tezal, Cabo San Lucas',
    state: 'B.C.S.',
    postalCode: '23454',
    phone: '', // v1: phone not yet enabled
    whatsapp: '', // v1: WhatsApp not yet enabled
    email: 'hola@sunrisesunset.mx',
    instagram: '@sunrisesunsetloscabos',
    mapUrl: 'https://maps.google.com/?q=Carretera+Transpeninsular+km+3.5+El+Tezal+Cabo+San+Lucas+BCS',
    classTypes: [
      {
        name: 'Sculpt-Funcional',
        description:
          'Entrenamiento que combina movimientos funcionales con resistencia para tonificar, fortalecer y dar forma. Se trabaja con peso corporal, ligas y mancuernas ligeras en circuitos diseñados para activar todos los grupos musculares. Cardio bajo impacto, fuerza y movilidad en una sola sesión.',
        level: 'all',
        durationMinutes: 50,
        maxCapacity: 8,
        icon: '💪',
      },
      {
        name: 'Pilates Mat',
        description:
          'A diferencia del pilates reformer, la resistencia proviene principalmente del peso corporal, la gravedad y la contracción muscular. Es una práctica en el piso diseñada para fortalecer y tonificar tu cuerpo, especialmente los músculos más profundos del core (abdomen, espalda baja y pelvis). Combina elongación y contracción, buscando siempre la conexión mente-cuerpo.',
        level: 'all',
        durationMinutes: 50,
        maxCapacity: 8,
        icon: '🧘',
      },
      {
        name: 'Yoga Sculpt',
        description:
          'Es una versión más dinámica y energizante del yoga tradicional. Con secuencias rápidas y posturas retadoras, yoga sculpt te hará sudar mientras te diviertes. Es ideal para aumentar tu fuerza, flexibilidad y concentración, además de brindarte un desafío emocionante que te hará sentirte lleno de energía.',
        level: 'all',
        durationMinutes: 50,
        maxCapacity: 8,
        icon: '🌿',
      },
      {
        name: 'Sculpt',
        description:
          'Entrenamiento de cuerpo completo (full body) o enfocado en grupos musculares específicos con movimientos controlados, sentadillas, planchas y ejercicios con resistencia para tonificar. Fusiona elementos de fuerza, entrenamiento funcional, pilates y a veces yoga o HIIT. Mejora la fuerza, potencia, resistencia, flexibilidad y quema calorías.',
        level: 'all',
        durationMinutes: 50,
        maxCapacity: 8,
        icon: '🔥',
      },
    ],
    bank: {
      name: 'BBVA',
      account: '0123456789',
      clabe: '012345678901234567',
      beneficiary: 'Sunrise Sunset MX',
    },
    businessHours: [
      { label: 'Lunes, Miércoles y Viernes', hours: 'Barré' },
      { label: 'Martes y Jueves', hours: 'Pilates Mat' },
      { label: 'Sábado', hours: 'Yoga Sculpt' },
      { label: 'Domingo', hours: 'Sculpt' },
    ],
    palette: {
      background: '44 32% 94%',
      foreground: '38 12% 30%',
      card: '44 28% 96%',
      cardForeground: '38 12% 30%',
      popover: '44 32% 94%',
      popoverForeground: '38 12% 30%',
      primary: '38 14% 38%',
      primaryForeground: '44 32% 94%',
      secondary: '70 12% 46%',
      secondaryForeground: '44 32% 94%',
      muted: '44 20% 88%',
      mutedForeground: '38 10% 46%',
      accent: '40 22% 82%',
      accentForeground: '38 12% 30%',
      border: '42 16% 84%',
      input: '42 16% 84%',
      ring: '38 14% 38%',
      heroGradient:
        'linear-gradient(135deg, hsl(44 34% 95%) 0%, hsl(40 26% 91%) 50%, hsl(70 16% 84%) 100%)',
      cardGradient:
        'linear-gradient(180deg, hsl(44 30% 96%) 0%, hsl(44 22% 92%) 100%)',
      overlayDark:
        'linear-gradient(180deg, hsla(38, 12%, 25%, 0.2) 0%, hsla(38, 12%, 25%, 0.55) 100%)',
      glowSage: '0 12px 32px hsla(70, 12%, 46%, 0.2)',
      glowWarm: '0 12px 32px hsla(40, 22%, 60%, 0.18)',
    },
  },
};

const formatSlugName = (slug: string) =>
  slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const getStudioBySlug = (slug?: string): StudioInfo => {
  if (!slug) {
    return studioDirectory.balance;
  }

  const normalized = slug.toLowerCase();
  if (studioDirectory[normalized]) {
    return studioDirectory[normalized];
  }

  return {
    ...studioDirectory.balance,
    slug: normalized,
    name: formatSlugName(normalized),
  };
};
