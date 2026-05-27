import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowUpRight,
  Instagram,
  MapPin,
  Phone,
  Sunrise,
  Sunset,
  Waves,
  Wind,
} from "lucide-react";
import heroImage from "@/assets/hero.jpeg";
import pilatesImage from "@/assets/hero-pilates.jpg";

type Lang = "es" | "en";

const easeOut = [0.23, 1, 0.32, 1] as const;
const easeBreath = [0.65, 0, 0.35, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const navTargets = ["#ritual", "#practica", "#manifiesto", "#coaches", "#paquetes", "#visita"];

const content = {
  es: {
    nav: ["Ritual", "Práctica", "Manifiesto", "Coaches", "Paquetes", "Visita"],
    login: "Entrar",
    reserve: "Reservar",
    sunMeta: ["Amanecer", "Atardecer", "Studio abierto"],
    heroEyebrow: "Studio boutique · El Tezal, Los Cabos",
    heroLineA: "Muévete",
    heroLineB: "con el sol,",
    heroLineC: "quédate",
    heroLineD: "con la calma.",
    heroSub:
      "Sculpt-Funcional, Surf-Pilates y Yoga en un espacio cuidado para sentirte fuerte, viva y con algo bonito que esperar durante el día.",
    primary: "Crear cuenta",
    secondary: "Reservar primera clase",
    heroCardLabel: "Próxima clase de hoy",
    heroCardClass: "Surf-Pilates · Ocean Flow",
    heroCardTime: "07:00",
    heroCardCoach: "Coach Adri",
    heroCardSpots: "4 espacios disponibles",

    ritualLabel: "Hoy en el studio",
    ritualNote:
      "El día corre como una pausa cuidada. Llega, respira y elige el momento que te sienta mejor.",
    ritualSlots: [
      { time: "06:30", title: "Sunrise Yoga", coach: "Ceci", tone: "soft" },
      { time: "07:00", title: "Surf-Pilates · Ocean Flow", coach: "Adri", tone: "hot" },
      { time: "08:30", title: "Sculpt-Funcional", coach: "Adri", tone: "warm" },
      { time: "10:00", title: "Barre & Sculpt", coach: "Amber", tone: "warm" },
      { time: "17:30", title: "Surf-Pilates · Wave Starter", coach: "Khalia", tone: "hot" },
      { time: "19:00", title: "Sunset Vinyasa", coach: "Ceci", tone: "soft" },
    ],

    practiceLabel: "Lo que practicamos",
    practiceTitle: "Tres formas de moverte con intención.",
    practiceCopy:
      "Cada práctica está pensada para sentirse boutique desde la primera respiración: técnica, atención y una energía que te acompaña el resto del día.",
    practices: [
      {
        no: "01",
        title: "Sculpt-Funcional",
        italic: "fuerza con ritmo.",
        body: "Cuerpo completo, control y carga progresiva en grupos reducidos.",
        chip: "55 min · Hasta 8 personas",
      },
      {
        no: "02",
        title: "Surf-Pilates",
        italic: "core sobre la ola.",
        body: "Equilibrio, conexión y presencia sobre tabla. Una práctica que se siente diferente.",
        chip: "50 min · Hasta 6 tablas",
      },
      {
        no: "03",
        title: "Yoga",
        italic: "respira el día.",
        body: "Vinyasa, Hatha y Ashtanga para recuperar espacio, bajar el ruido y volver a ti.",
        chip: "60 min · Hasta 10 personas",
      },
    ],

    manifestoLabel: "Manifiesto",
    manifestoQuote:
      "Una pausa bonita dentro del día. Movimiento consciente, energía y una sensación tipo wellness retreat con estética cuidada.",
    manifestoAuthor: "— La idea detrás de Sunrise Sunset",

    moodLabel: "La vibra del studio",
    moodTitle: "Naranja, cálido, boutique. Una experiencia con energía de comunidad.",
    moodCopy:
      "La experiencia mezcla entrenamiento efectivo con una estética cuidada: luz, música, movimiento y un ambiente que se siente cercano sin perder lo premium.",
    moodChips: [
      ["Atención personalizada", "Coaches que te miran en cada repetición."],
      ["Wellness retreat mood", "Una pausa pensada como un retiro corto."],
      ["Diseño costero", "Texturas, luz y materiales inspirados en Cabo."],
      ["Comunidad con intención", "Grupos reducidos y energía cálida."],
    ],

    coachesLabel: "Conoce a las coaches",
    coachesTitle: "Técnica, energía y atención cercana en cada clase.",
    coachesIntro:
      "Cuatro formas de moverte con intención: fuerza, yoga, sculpt, barre y surf-pilates. Una comunidad que se siente boutique desde la primera visita.",
    foundersTag: "Fundadora",
    coachReadMore: "Leer más",
    coaches: [
      {
        name: "Adri",
        role: "Fundadora · Sculpt-Funcional & Surf-Pilates",
        image: "/Coach%20Adri.jpeg",
        position: "object-center",
        quote:
          "Quiero darte un espacio para conectar contigo, moverte con intención y sentirte más fuerte cada día.",
        bio:
          "Después de inspirar a muchas chicas en sus clases, Adri decidió cumplir su sueño y abrir su propio studio. En Sunrise Sunset busca transmitirte una experiencia inolvidable en cada clase.",
        tags: ["Fuerza", "Control", "Surf-Pilates"],
      },
      {
        name: "Amber",
        role: "Pilates · Sculpt · Barre",
        image: "/Coach%20Amber.jpeg",
        position: "object-top",
        quote: "",
        bio:
          "Originaria de Australia y con más de 26 años de experiencia profesional en danza, Amber se certificó como instructora en Pilates, Sculpt y Barre. Ama crear clases con enfoque en técnica, alineación y movimiento consciente.",
        tags: ["26+ años", "Técnica", "Alineación"],
      },
      {
        name: "Khalia",
        role: "Pilates · Nutrición funcional",
        image: "/Coach%20Kalhia.jpeg",
        position: "object-top",
        quote: "",
        bio:
          "Apasionada del fitness, nutrióloga funcional e instructora de pilates certificada. En sus clases vas a encontrar un enfoque retador y consciente que combina movimiento, fuerza y conexión mente-cuerpo.",
        tags: ["Mind-body", "Pilates", "Energía"],
      },
      {
        name: "Ceci",
        role: "Yoga · Vinyasa · Ashtanga",
        image: "/Coach%20ceci.jpeg",
        position: "object-top",
        quote: "",
        bio:
          "Con una década de experiencia en danza, Ceci entró al yoga en 1999. Se formó en Hatha, Vinyasa y Ashtanga, y desde 2018 vive en Los Cabos compartiendo su práctica en Sunrise Sunset.",
        tags: ["Yoga desde 1999", "Vinyasa", "Ashtanga"],
      },
    ],

    packageLabel: "Paquetes",
    packageTitle: "Elige cómo quieres moverte este mes.",
    packageNote: "Precios en MXN · Vigencia 30 días · Sin permanencia.",
    packageCta: "Reservar paquete",
    packagesData: [
      {
        no: "01",
        name: "Sculpt + Yoga",
        price: "1,400",
        copy: "Para construir fuerza con una rutina estable.",
        items: ["4, 8 o 12 clases", "Opción ilimitada", "Vigencia 30 días"],
        highlight: false,
      },
      {
        no: "02",
        name: "Surf-Pilates + Yoga",
        price: "1,560",
        copy: "Para trabajar balance, core y flow sobre tabla.",
        items: ["Wave Starter", "Ocean Flow", "Deep Flow"],
        highlight: true,
        tag: "El favorito de la casa",
      },
      {
        no: "03",
        name: "Experiencia mixta",
        price: "2,280",
        copy: "Mezcla curada de Sculpt, Surf-Pilates y Yoga.",
        items: ["8, 12 o 16 clases", "Créditos por tipo", "Combo ilimitado"],
        highlight: false,
      },
    ],

    visitLabel: "Visítanos",
    visitTitle: "Abrimos con el sol.",
    visitCopy:
      "Nos vas a encontrar en El Tezal, Cabo San Lucas. Si es tu primera visita, llega 10 minutos antes para acomodarte sin prisa.",
    visitHours: [
      ["Lun — Vie", "06:00 — 20:00"],
      ["Sábado", "07:00 — 13:00"],
      ["Domingo", "Cerrado"],
    ],
    visitAddress: "El Tezal · Cabo San Lucas, BCS",
    visitPhone: "Reservas desde tu cuenta",

    finalLabel: "Tu primera visita",
    finalTitle: "Reserva algo que sí vas a esperar durante tu día.",
    finalCopy:
      "Crea tu cuenta, agenda tu clase muestra y déjate llevar por la rutina más bonita de Cabo.",
    finalPrimary: "Crear cuenta",
    finalSecondary: "Reservar primera clase",

    footerTagline:
      "Sculpt-Funcional, Surf-Pilates y Yoga en El Tezal, Cabo San Lucas. Una experiencia boutique para moverte con intención.",
    footerColA: "Studio",
    footerColB: "Visita",
    footerColC: "Síguenos",
    rights: "Sunrise Sunset · Movimiento consciente en Los Cabos",
  },
  en: {
    nav: ["Ritual", "Practice", "Manifesto", "Coaches", "Packages", "Visit"],
    login: "Login",
    reserve: "Book",
    sunMeta: ["Sunrise", "Sunset", "Studio open"],
    heroEyebrow: "Boutique studio · El Tezal, Los Cabos",
    heroLineA: "Move",
    heroLineB: "with the sun,",
    heroLineC: "stay",
    heroLineD: "for the calm.",
    heroSub:
      "Sculpt-Functional, Surf-Pilates and Yoga in a curated space made for strength, presence and a beautiful pause in your day.",
    primary: "Create account",
    secondary: "Book your first class",
    heroCardLabel: "Next class today",
    heroCardClass: "Surf-Pilates · Ocean Flow",
    heroCardTime: "07:00",
    heroCardCoach: "Coach Adri",
    heroCardSpots: "4 spots available",

    ritualLabel: "Today at the studio",
    ritualNote:
      "The day moves like a curated pause. Arrive, breathe, and choose the moment that suits you best.",
    ritualSlots: [
      { time: "06:30", title: "Sunrise Yoga", coach: "Ceci", tone: "soft" },
      { time: "07:00", title: "Surf-Pilates · Ocean Flow", coach: "Adri", tone: "hot" },
      { time: "08:30", title: "Sculpt-Functional", coach: "Adri", tone: "warm" },
      { time: "10:00", title: "Barre & Sculpt", coach: "Amber", tone: "warm" },
      { time: "17:30", title: "Surf-Pilates · Wave Starter", coach: "Khalia", tone: "hot" },
      { time: "19:00", title: "Sunset Vinyasa", coach: "Ceci", tone: "soft" },
    ],

    practiceLabel: "What we practice",
    practiceTitle: "Three ways to move with intention.",
    practiceCopy:
      "Every practice is designed to feel boutique from the first breath: technique, attention and an energy that follows you the rest of the day.",
    practices: [
      {
        no: "01",
        title: "Sculpt-Functional",
        italic: "strength with rhythm.",
        body: "Full body, control and progressive load in small groups.",
        chip: "55 min · Up to 8 people",
      },
      {
        no: "02",
        title: "Surf-Pilates",
        italic: "core on the wave.",
        body: "Balance, connection and presence on the board. A practice that feels different.",
        chip: "50 min · Up to 6 boards",
      },
      {
        no: "03",
        title: "Yoga",
        italic: "breathe the day.",
        body: "Vinyasa, Hatha and Ashtanga to recover space, soften the noise and come back to yourself.",
        chip: "60 min · Up to 10 people",
      },
    ],

    manifestoLabel: "Manifesto",
    manifestoQuote:
      "A beautiful pause inside the day. Conscious movement, energy and a wellness-retreat feeling with a careful aesthetic.",
    manifestoAuthor: "— The idea behind Sunrise Sunset",

    moodLabel: "Studio mood",
    moodTitle: "Orange, warm, boutique. An experience with community energy.",
    moodCopy:
      "We blend effective training with a curated aesthetic: light, music, movement and a space that feels close without losing its premium edge.",
    moodChips: [
      ["Personal attention", "Coaches who see you in every rep."],
      ["Wellness retreat mood", "A pause designed like a short retreat."],
      ["Coastal design", "Textures, light and materials inspired by Cabo."],
      ["Intentional community", "Small groups, warm energy."],
    ],

    coachesLabel: "Meet the coaches",
    coachesTitle: "Technique, energy and personal attention in every class.",
    coachesIntro:
      "Four ways to move with intention: strength, yoga, sculpt, barre and surf-pilates. A boutique community from the first visit.",
    foundersTag: "Founder",
    coachReadMore: "Read more",
    coaches: [
      {
        name: "Adri",
        role: "Founder · Sculpt-Functional & Surf-Pilates",
        image: "/Coach%20Adri.jpeg",
        position: "object-center",
        quote:
          "I want to give you a space to connect with yourself, move with intention and feel stronger every day.",
        bio:
          "After inspiring many girls in her classes, Adri decided to bring her dream to life and open her own studio. At Sunrise Sunset she looks forward to giving you an unforgettable experience in every class.",
        tags: ["Strength", "Control", "Surf-Pilates"],
      },
      {
        name: "Amber",
        role: "Pilates · Sculpt · Barre",
        image: "/Coach%20Amber.jpeg",
        position: "object-top",
        quote: "",
        bio:
          "Originally from Australia, with over 26 years of professional dance experience, Amber is certified in Pilates, Sculpt and Barre. She loves crafting classes focused on technique, alignment and conscious movement.",
        tags: ["26+ years", "Technique", "Alignment"],
      },
      {
        name: "Khalia",
        role: "Pilates · Functional nutrition",
        image: "/Coach%20Kalhia.jpeg",
        position: "object-top",
        quote: "",
        bio:
          "Fitness enthusiast, functional nutritionist and certified Pilates instructor. Her classes combine movement, strength and mind-body connection with a challenging, mindful approach.",
        tags: ["Mind-body", "Pilates", "Energy"],
      },
      {
        name: "Ceci",
        role: "Yoga · Vinyasa · Ashtanga",
        image: "/Coach%20ceci.jpeg",
        position: "object-top",
        quote: "",
        bio:
          "With a decade of professional dance experience, Ceci entered yoga in 1999. Trained in Hatha, Vinyasa and Ashtanga, she has lived in Los Cabos since 2018 and shares her practice at Sunrise Sunset.",
        tags: ["Yoga since 1999", "Vinyasa", "Ashtanga"],
      },
    ],

    packageLabel: "Packages",
    packageTitle: "Choose how you want to move this month.",
    packageNote: "Prices in MXN · 30 day validity · No long term commitment.",
    packageCta: "Book package",
    packagesData: [
      {
        no: "01",
        name: "Sculpt + Yoga",
        price: "1,400",
        copy: "For building strength with a steady routine.",
        items: ["4, 8 or 12 classes", "Unlimited option", "30 day validity"],
        highlight: false,
      },
      {
        no: "02",
        name: "Surf-Pilates + Yoga",
        price: "1,560",
        copy: "For balance, core and board flow.",
        items: ["Wave Starter", "Ocean Flow", "Deep Flow"],
        highlight: true,
        tag: "House favorite",
      },
      {
        no: "03",
        name: "Mixed experience",
        price: "2,280",
        copy: "A curated mix of Sculpt, Surf-Pilates and Yoga.",
        items: ["8, 12 or 16 classes", "Credits by type", "Unlimited combo"],
        highlight: false,
      },
    ],

    visitLabel: "Visit us",
    visitTitle: "We open with the sun.",
    visitCopy:
      "Find us in El Tezal, Cabo San Lucas. If it's your first visit, arrive 10 minutes early so you can settle in without rushing.",
    visitHours: [
      ["Mon — Fri", "06:00 — 20:00"],
      ["Saturday", "07:00 — 13:00"],
      ["Sunday", "Closed"],
    ],
    visitAddress: "El Tezal · Cabo San Lucas, BCS",
    visitPhone: "Book from your account",

    finalLabel: "Your first visit",
    finalTitle: "Book something you will actually look forward to today.",
    finalCopy:
      "Create your account, schedule your trial class and ease into the most beautiful routine in Cabo.",
    finalPrimary: "Create account",
    finalSecondary: "Book your first class",

    footerTagline:
      "Sculpt-Functional, Surf-Pilates and Yoga in El Tezal, Cabo San Lucas. A boutique experience for intentional movement.",
    footerColA: "Studio",
    footerColB: "Visit",
    footerColC: "Follow",
    rights: "Sunrise Sunset · Conscious movement in Los Cabos",
  },
};

const formatDate = (d: Date, lang: Lang) =>
  d
    .toLocaleDateString(lang === "es" ? "es-MX" : "en-US", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    })
    .replace(/\./g, "");

const SunArc = ({ progress = 0 }: { progress?: number }) => {
  const angle = -90 + progress * 180;
  return (
    <svg
      viewBox="0 0 400 220"
      className="h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="arc-gradient" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#F8B069" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#EF704E" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#7B0000" stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE7C2" stopOpacity="1" />
          <stop offset="60%" stopColor="#F8B069" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#F8B069" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M 20 200 A 180 180 0 0 1 380 200"
        fill="none"
        stroke="url(#arc-gradient)"
        strokeWidth="1.5"
        strokeDasharray="2 6"
      />
      <g
        transform={`rotate(${angle} 200 200)`}
        style={{ transition: "transform 1.4s cubic-bezier(0.65, 0, 0.35, 1)" }}
      >
        <circle cx="200" cy="20" r="42" fill="url(#sun-glow)" />
        <circle cx="200" cy="20" r="14" fill="#EF704E" />
      </g>
    </svg>
  );
};

const SunGlyph = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <circle cx="24" cy="24" r="7" fill="currentColor" />
    {Array.from({ length: 12 }).map((_, i) => {
      const a = (i * Math.PI * 2) / 12;
      const x1 = 24 + Math.cos(a) * 12;
      const y1 = 24 + Math.sin(a) * 12;
      const x2 = 24 + Math.cos(a) * 18;
      const y2 = 24 + Math.sin(a) * 18;
      return (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      );
    })}
  </svg>
);

const Index = () => {
  const [lang, setLang] = useState<Lang>("es");
  const [now, setNow] = useState(() => new Date());
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const t = content[lang];

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const sunY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const sunRotate = useTransform(scrollYProgress, [0, 1], [0, 90]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const sunProgress = useMemo(() => {
    const minutes = now.getHours() * 60 + now.getMinutes();
    const start = 6 * 60;
    const end = 20 * 60;
    if (minutes < start) return 0;
    if (minutes > end) return 1;
    return (minutes - start) / (end - start);
  }, [now]);

  const skyColors = useMemo(() => {
    if (sunProgress < 0.25) return ["#FFD8B2", "#F5A26C", "#7B0000"];
    if (sunProgress < 0.55) return ["#FFE6BD", "#EF704E", "#B33A1F"];
    if (sunProgress < 0.85) return ["#F8B069", "#E36F4C", "#7B0000"];
    return ["#C26E55", "#7B0000", "#3A0E0E"];
  }, [sunProgress]);

  const dateString = formatDate(now, lang);
  const timeString = now.toLocaleTimeString(lang === "es" ? "es-MX" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const sunriseStr = lang === "es" ? "06:42" : "06:42";
  const sunsetStr = lang === "es" ? "19:48" : "19:48";

  return (
    <main className="min-h-screen overflow-hidden bg-[#FAF1E6] text-chocolate font-body">
      <div className="sunset-grain" />

      {/* SKY STRIP — dynamic time-of-day gradient */}
      <div
        className="fixed inset-x-0 top-0 z-50 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${skyColors[0]} 0%, ${skyColors[1]} ${
            Math.round(sunProgress * 100)
          }%, ${skyColors[2]} 100%)`,
        }}
      />

      {/* TOP META BAR */}
      <div className="relative z-40 hidden border-b border-chocolate/10 bg-[#FAF1E6]/80 text-[11px] uppercase tracking-[0.22em] text-chocolate/70 backdrop-blur md:block">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-2.5">
          <div className="flex items-center gap-5">
            <span className="font-medium text-chocolate/85">{dateString}</span>
            <span className="text-chocolate/40">·</span>
            <span>{timeString} Cabo</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-2">
              <Sunrise className="h-3.5 w-3.5" strokeWidth={1.6} /> {t.sunMeta[0]} {sunriseStr}
            </span>
            <span className="inline-flex items-center gap-2">
              <Sunset className="h-3.5 w-3.5" strokeWidth={1.6} /> {t.sunMeta[1]} {sunsetStr}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-coral/60" />
                <span className="relative h-2 w-2 rounded-full bg-coral" />
              </span>
              {t.sunMeta[2]}
            </span>
          </div>
        </div>
      </div>

      {/* NAV */}
      <nav
        className={`sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500 ease-sunrise ${
          scrolled
            ? "border-b border-chocolate/10 bg-[#FAF1E6]/90 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3" aria-label="Sunrise Sunset inicio">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-coral text-cream">
              <SunGlyph className="h-6 w-6" />
            </span>
            <span className="font-heading text-lg leading-none text-chocolate">
              Sunrise <span className="italic font-light text-coral">Sunset</span>
            </span>
          </Link>

          <div className="hidden items-center gap-7 text-[13px] uppercase tracking-[0.18em] text-chocolate/70 md:flex">
            {t.nav.map((item, index) => (
              <a
                key={item}
                href={navTargets[index]}
                className="group relative inline-flex items-center transition-colors hover:text-chocolate"
              >
                {item}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-coral transition-[width] duration-300 ease-sunrise group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === "es" ? "en" : "es")}
              className="rounded-full border border-chocolate/15 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-chocolate/75 transition-[background-color,color,border-color] duration-200 ease-sunrise hover:border-coral/40 hover:bg-coral/10 hover:text-coral"
              aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}
            >
              {lang === "es" ? "EN" : "ES"}
            </button>
            <Link
              to="/login"
              className="hidden rounded-full px-3 py-2 text-sm text-chocolate/70 transition-colors hover:text-chocolate sm:inline-flex"
            >
              {t.login}
            </Link>
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-chocolate px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-cream transition-[transform,background-color] duration-200 ease-sunrise hover:-translate-y-0.5 hover:bg-coral active:scale-[0.97]"
            >
              {t.reserve}
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} className="relative px-4 pb-24 pt-14 md:pb-32 md:pt-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_-10%,hsla(33,100%,75%,0.55),transparent_42%),radial-gradient(circle_at_-10%_60%,hsla(16,72%,62%,0.18),transparent_45%)]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-chocolate/20 to-transparent" />
        </div>

        <motion.div
          style={{ y: sunY, rotate: sunRotate }}
          className="pointer-events-none absolute right-[3%] top-[8%] -z-10 hidden h-[420px] w-[420px] text-coral/70 lg:block"
        >
          <SunArc progress={sunProgress} />
        </motion.div>

        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.95, ease: easeBreath }}
            className="relative"
          >
            <div className="mb-7 flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-chocolate/70">
              <span className="h-px w-10 bg-coral" />
              {t.heroEyebrow}
            </div>

            <h1 className="font-heading text-[clamp(3.8rem,9vw,9.6rem)] font-light leading-[0.86] tracking-[-0.02em] text-chocolate">
              <span className="block">{t.heroLineA}</span>
              <span className="block italic font-light text-coral" style={{ fontVariationSettings: '"opsz" 144' }}>
                {t.heroLineB}
              </span>
              <span className="block">{t.heroLineC}</span>
              <span className="block italic font-light text-wine" style={{ fontVariationSettings: '"opsz" 144' }}>
                {t.heroLineD}
              </span>
            </h1>

            <p className="mt-9 max-w-xl text-lg leading-[1.7] text-chocolate/75 md:text-xl">
              {t.heroSub}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="group inline-flex min-h-[3.5rem] items-center justify-center gap-3 rounded-full bg-coral px-7 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-cream shadow-[0_22px_44px_-18px_hsla(14,72%,40%,0.55)] transition-[transform,box-shadow,background-color] duration-300 ease-sunrise hover:-translate-y-0.5 hover:bg-wine active:scale-[0.98]"
              >
                {t.primary}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                to="/register"
                className="group inline-flex min-h-[3.5rem] items-center justify-center gap-2 rounded-full border border-chocolate/25 bg-transparent px-7 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-chocolate transition-[transform,border-color,background-color] duration-300 ease-sunrise hover:-translate-y-0.5 hover:border-chocolate hover:bg-chocolate hover:text-cream active:scale-[0.98]"
              >
                {t.secondary}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, filter: "blur(14px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.05, delay: 0.18, ease: easeBreath }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-[2rem] bg-cream p-3 shadow-[0_45px_120px_-40px_hsla(13,66%,28%,0.45)]">
              <img
                src={heroImage}
                alt="Studio Sunrise Sunset con luz natural"
                className="aspect-[4/5] w-full rounded-[1.5rem] object-cover lg:aspect-[5/6]"
              />
              <div className="pointer-events-none absolute inset-3 rounded-[1.5rem] ring-1 ring-cream/40" />
            </div>

            {/* Floating booking card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.55, ease: easeOut }}
              className="absolute -bottom-10 left-4 right-12 rounded-[1.4rem] bg-chocolate p-5 text-cream shadow-[0_30px_80px_-30px_hsla(14,72%,40%,0.55)] md:left-auto md:right-[-2.5rem] md:w-[320px]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber">
                    {t.heroCardLabel}
                  </p>
                  <p className="mt-3 font-heading text-2xl italic leading-tight text-cream">
                    {t.heroCardClass}
                  </p>
                </div>
                <span className="rounded-full bg-coral px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cream">
                  {t.heroCardTime}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-cream/15 pt-4 text-[12px] uppercase tracking-[0.16em] text-cream/70">
                <span>{t.heroCardCoach}</span>
                <span className="text-amber">{t.heroCardSpots}</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* RITUAL DAY RAIL */}
      <section id="ritual" className="relative scroll-mt-24 border-y border-chocolate/10 bg-[#F4E7D4] px-4 py-16 md:py-20">
        <div className="mx-auto max-w-[1400px]">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: easeBreath }}
            className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
          >
            <div className="flex items-end gap-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-coral">
                {t.ritualLabel}
              </p>
              <p className="hidden font-heading text-sm italic text-chocolate/55 md:block">{dateString}</p>
            </div>
            <p className="max-w-md text-sm leading-[1.7] text-chocolate/70">{t.ritualNote}</p>
          </motion.div>

          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-none md:mx-0 md:px-0">
            {t.ritualSlots.map((slot, index) => {
              const isHot = slot.tone === "hot";
              const isSoft = slot.tone === "soft";
              return (
                <motion.article
                  key={slot.time + slot.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: index * 0.05, ease: easeOut }}
                  className={`group relative flex min-w-[230px] flex-1 flex-col justify-between gap-6 rounded-[1.4rem] border p-5 transition-[transform,background-color,border-color] duration-300 ease-sunrise hover:-translate-y-1 ${
                    isHot
                      ? "border-transparent bg-coral text-cream hover:bg-wine"
                      : isSoft
                      ? "border-chocolate/12 bg-cream text-chocolate hover:border-coral/30"
                      : "border-chocolate/15 bg-[#FAF1E6] text-chocolate hover:border-coral/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-heading text-2xl tabular-nums ${
                        isHot ? "text-cream" : "text-chocolate"
                      }`}
                    >
                      {slot.time}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
                        isHot ? "text-amber" : "text-coral"
                      }`}
                    >
                      {slot.coach}
                    </span>
                  </div>
                  <div>
                    <p
                      className={`font-heading text-lg leading-snug ${
                        isHot ? "text-cream" : "text-chocolate"
                      }`}
                    >
                      {slot.title}
                    </p>
                  </div>
                  <ArrowUpRight
                    className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                      isHot ? "text-cream/80" : "text-chocolate/55"
                    }`}
                  />
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRACTICES */}
      <section id="practica" className="scroll-mt-24 bg-[#FAF1E6] px-4 py-24 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.85, ease: easeBreath }}
            className="grid items-end gap-10 md:grid-cols-[0.9fr_1.1fr]"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-coral">
                {t.practiceLabel}
              </p>
              <h2 className="mt-5 font-heading text-4xl font-light leading-[1.05] tracking-[-0.01em] text-chocolate md:text-6xl">
                {t.practiceTitle}
              </h2>
            </div>
            <p className="max-w-xl text-base leading-[1.8] text-chocolate/70 md:text-lg md:justify-self-end">
              {t.practiceCopy}
            </p>
          </motion.div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-[2rem] bg-chocolate/12 lg:grid-cols-3">
            {t.practices.map((p, index) => (
              <motion.article
                key={p.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: index * 0.1, ease: easeBreath }}
                className="group relative flex min-h-[460px] flex-col justify-between bg-[#FAF1E6] p-7 transition-colors duration-500 ease-sunrise hover:bg-cream md:p-9"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm tabular-nums text-coral">{p.no}</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-chocolate/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-chocolate/70">
                    {p.chip}
                  </span>
                </div>

                <div className="mt-12">
                  <h3 className="font-heading text-4xl font-light leading-[1] text-chocolate md:text-5xl">
                    {p.title}
                  </h3>
                  <p
                    className="mt-2 font-heading text-3xl italic font-light leading-[1] text-coral md:text-4xl"
                    style={{ fontVariationSettings: '"opsz" 144' }}
                  >
                    {p.italic}
                  </p>
                  <p className="mt-6 max-w-sm text-sm leading-[1.75] text-chocolate/70">{p.body}</p>
                </div>

                <div className="mt-10 flex items-center justify-between border-t border-chocolate/10 pt-5">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-chocolate transition-colors hover:text-coral"
                  >
                    {t.reserve}
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                  <span className="text-chocolate/30">
                    {index === 0 ? <Sunrise className="h-5 w-5" strokeWidth={1.5} /> : null}
                    {index === 1 ? <Waves className="h-5 w-5" strokeWidth={1.5} /> : null}
                    {index === 2 ? <Wind className="h-5 w-5" strokeWidth={1.5} /> : null}
                  </span>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section id="manifiesto" className="relative scroll-mt-24 overflow-hidden bg-[#FAF1E6] px-4 py-24 md:py-36">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background:radial-gradient(circle_at_50%_80%,hsla(33,100%,72%,0.35),transparent_55%)]" />
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.05, ease: easeBreath }}
          className="mx-auto max-w-5xl text-center"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-coral">{t.manifestoLabel}</p>
          <blockquote
            className="mt-9 font-heading text-[clamp(2.2rem,5vw,4.5rem)] font-light leading-[1.05] tracking-[-0.015em] text-chocolate"
            style={{ fontVariationSettings: '"opsz" 144' }}
          >
            <span className="block italic text-coral">"</span>
            {t.manifestoQuote}
            <span className="block italic text-coral">"</span>
          </blockquote>
          <p className="mt-8 text-sm uppercase tracking-[0.22em] text-chocolate/55">
            {t.manifestoAuthor}
          </p>
        </motion.div>
      </section>

      {/* STUDIO MOOD */}
      <section className="relative scroll-mt-24 overflow-hidden bg-coral px-4 py-24 text-cream md:py-32">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] text-cream/15">
          <SunGlyph className="h-full w-full" />
        </div>
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -28, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, ease: easeBreath }}
            className="relative"
          >
            <div className="overflow-hidden rounded-[2rem] bg-cream p-3 shadow-[0_45px_120px_-40px_hsla(0,0%,0%,0.45)]">
              <img
                src={pilatesImage}
                alt="Surf-Pilates en Sunrise Sunset"
                className="aspect-[4/5] w-full rounded-[1.5rem] object-cover md:aspect-[5/6]"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 hidden rounded-2xl bg-chocolate px-5 py-4 text-cream shadow-[0_24px_60px_-20px_hsla(0,0%,0%,0.55)] md:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber">Cabo</p>
              <p className="mt-1 font-heading text-xl italic leading-none">El Tezal · BCS</p>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.95, ease: easeBreath }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber">{t.moodLabel}</p>
            <h2 className="mt-5 font-heading text-4xl font-light leading-[1.05] tracking-[-0.01em] text-cream md:text-6xl">
              {t.moodTitle}
            </h2>
            <p className="mt-7 max-w-xl text-base leading-[1.8] text-cream/80 md:text-lg">{t.moodCopy}</p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-[1.5rem] bg-cream/12 sm:grid-cols-2">
              {t.moodChips.map(([title, copy]) => (
                <div key={title} className="bg-coral p-5 transition-colors duration-300 hover:bg-wine">
                  <p className="font-heading text-xl italic text-cream">{title}</p>
                  <p className="mt-2 text-sm leading-[1.65] text-cream/75">{copy}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* COACHES */}
      <section id="coaches" className="scroll-mt-24 bg-[#FAF1E6] px-4 py-24 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.85, ease: easeBreath }}
            className="grid items-end gap-10 md:grid-cols-[0.9fr_1.1fr]"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-coral">
                {t.coachesLabel}
              </p>
              <h2 className="mt-5 font-heading text-4xl font-light leading-[1.05] tracking-[-0.01em] text-chocolate md:text-6xl">
                {t.coachesTitle}
              </h2>
            </div>
            <div className="md:justify-self-end">
              <p className="max-w-xl text-base leading-[1.8] text-chocolate/70 md:text-lg">
                {t.coachesIntro}
              </p>
              <Link
                to="/register"
                className="mt-7 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-coral transition-colors hover:text-wine"
              >
                {t.secondary}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>

          {/* Founder feature */}
          <motion.article
            initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, ease: easeBreath }}
            className="mt-14 grid overflow-hidden rounded-[2rem] bg-chocolate text-cream shadow-[0_50px_140px_-50px_hsla(13,66%,28%,0.55)] lg:grid-cols-[0.85fr_1.15fr]"
          >
            <div className="relative min-h-[480px] overflow-hidden bg-chocolate">
              <img
                src={t.coaches[0].image}
                alt={`Coach ${t.coaches[0].name}`}
                className={`h-full w-full ${t.coaches[0].position} object-cover transition-transform [transition-duration:1500ms] ease-sunrise hover:scale-[1.04]`}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-chocolate via-chocolate/40 to-transparent p-7">
                <span className="inline-flex items-center gap-2 rounded-full bg-coral px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cream">
                  {t.foundersTag}
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-10 p-8 md:p-12">
              <div>
                <p className="font-heading text-5xl font-light leading-none text-cream md:text-7xl">
                  Adri
                </p>
                <p className="mt-3 text-[12px] font-bold uppercase tracking-[0.22em] text-amber">
                  {t.coaches[0].role}
                </p>
                <blockquote
                  className="mt-8 font-heading text-2xl font-light italic leading-[1.25] text-cream md:text-3xl"
                  style={{ fontVariationSettings: '"opsz" 144' }}
                >
                  "{t.coaches[0].quote}"
                </blockquote>
                <p className="mt-6 max-w-xl text-sm leading-[1.75] text-cream/75 md:text-base md:leading-[1.8]">
                  {t.coaches[0].bio}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {t.coaches[0].tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-cream/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/85"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.article>

          {/* Other coaches */}
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {t.coaches.slice(1).map((coach, index) => (
              <motion.article
                key={coach.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: index * 0.08, ease: easeBreath }}
                className="group overflow-hidden rounded-[1.6rem] bg-cream shadow-[0_30px_80px_-40px_hsla(13,66%,28%,0.4)]"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-chocolate">
                  <img
                    src={coach.image}
                    alt={`Coach ${coach.name}`}
                    className={`h-full w-full ${coach.position} object-cover transition-transform [transition-duration:1200ms] ease-sunrise group-hover:scale-[1.05]`}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-chocolate/85 via-chocolate/20 to-transparent p-5">
                    <p className="font-heading text-3xl font-light leading-none text-cream">
                      {coach.name}
                    </p>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
                      {coach.role}
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm leading-[1.75] text-chocolate/75">{coach.bio}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {coach.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#F4E7D4] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-coral"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* PACKAGES */}
      <section id="paquetes" className="scroll-mt-24 bg-[#F4E7D4] px-4 py-24 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.85, ease: easeBreath }}
            className="grid items-end gap-8 md:grid-cols-[1fr_auto]"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-coral">
                {t.packageLabel}
              </p>
              <h2 className="mt-5 max-w-3xl font-heading text-4xl font-light leading-[1.05] tracking-[-0.01em] text-chocolate md:text-6xl">
                {t.packageTitle}
              </h2>
              <p className="mt-5 text-sm uppercase tracking-[0.18em] text-chocolate/55">
                {t.packageNote}
              </p>
            </div>
          </motion.div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {t.packagesData.map((pkg, index) => (
              <motion.article
                key={pkg.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: index * 0.08, ease: easeBreath }}
                className={`group relative flex flex-col justify-between rounded-[1.8rem] p-7 md:p-9 ${
                  pkg.highlight
                    ? "bg-chocolate text-cream shadow-[0_45px_120px_-40px_hsla(0,0%,0%,0.5)] lg:-translate-y-4"
                    : "bg-cream text-chocolate shadow-[0_24px_70px_-40px_hsla(13,66%,28%,0.35)]"
                }`}
              >
                {pkg.highlight && "tag" in pkg ? (
                  <span className="absolute right-7 top-7 inline-flex items-center gap-2 rounded-full bg-coral px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cream">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber" />
                    {pkg.tag}
                  </span>
                ) : null}

                <div>
                  <div className="flex items-center gap-3 text-sm">
                    <span
                      className={`font-heading tabular-nums ${
                        pkg.highlight ? "text-amber" : "text-coral"
                      }`}
                    >
                      {pkg.no}
                    </span>
                    <span className="h-px flex-1 bg-current opacity-15" />
                  </div>

                  <h3 className="mt-7 font-heading text-3xl font-light leading-tight md:text-4xl">
                    {pkg.name}
                  </h3>
                  <p
                    className={`mt-3 text-sm leading-[1.7] ${
                      pkg.highlight ? "text-cream/75" : "text-chocolate/70"
                    }`}
                  >
                    {pkg.copy}
                  </p>

                  <div className="mt-8 flex items-baseline gap-3">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                        pkg.highlight ? "text-amber" : "text-coral"
                      }`}
                    >
                      desde
                    </span>
                    <span className="font-heading text-5xl font-light leading-none md:text-6xl">
                      ${pkg.price}
                    </span>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                        pkg.highlight ? "text-cream/60" : "text-chocolate/45"
                      }`}
                    >
                      MXN
                    </span>
                  </div>

                  <ul className="mt-8 space-y-3 text-sm">
                    {pkg.items.map((item) => (
                      <li
                        key={item}
                        className={`flex items-center gap-3 ${
                          pkg.highlight ? "text-cream/85" : "text-chocolate/75"
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full ${
                            pkg.highlight ? "bg-coral text-cream" : "bg-[#F4E7D4] text-coral"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to="/register"
                  className={`mt-10 inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-full px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] transition-[transform,background-color] duration-300 ease-sunrise hover:-translate-y-0.5 active:scale-[0.98] ${
                    pkg.highlight
                      ? "bg-coral text-cream hover:bg-wine"
                      : "bg-chocolate text-cream hover:bg-coral"
                  }`}
                >
                  {t.packageCta}
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* VISIT */}
      <section id="visita" className="scroll-mt-24 bg-[#FAF1E6] px-4 py-24 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <motion.div
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.95, ease: easeBreath }}
            className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-coral">{t.visitLabel}</p>
              <h2
                className="mt-5 font-heading text-4xl font-light italic leading-[1.05] tracking-[-0.01em] text-chocolate md:text-6xl"
                style={{ fontVariationSettings: '"opsz" 144' }}
              >
                {t.visitTitle}
              </h2>
              <p className="mt-7 max-w-xl text-base leading-[1.8] text-chocolate/70 md:text-lg">
                {t.visitCopy}
              </p>

              <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-chocolate/15 bg-cream px-4 py-2.5 text-sm text-chocolate/80">
                <MapPin className="h-4 w-4 text-coral" strokeWidth={1.7} />
                {t.visitAddress}
              </div>
            </div>

            <div className="rounded-[2rem] border border-chocolate/10 bg-cream p-7 md:p-9">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-coral">
                {lang === "es" ? "Horario" : "Hours"}
              </p>
              <ul className="mt-6 divide-y divide-chocolate/10">
                {t.visitHours.map(([day, hours]) => (
                  <li key={day} className="flex items-center justify-between py-4 text-sm">
                    <span className="font-medium uppercase tracking-[0.16em] text-chocolate/85">
                      {day}
                    </span>
                    <span className="font-heading text-lg tabular-nums text-chocolate">
                      {hours}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-chocolate/10 pt-6 text-sm text-chocolate/70">
                <Phone className="h-4 w-4 text-coral" strokeWidth={1.7} />
                {t.visitPhone}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#FAF1E6] px-4 pb-24 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: easeBreath }}
          className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[2.5rem] bg-wine text-cream shadow-[0_60px_150px_-50px_hsla(0,100%,18%,0.55)]"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-[420px] w-[420px] text-cream/10">
            <SunGlyph className="h-full w-full" />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_120%,hsla(33,100%,72%,0.32),transparent_55%)]" />

          <div className="relative grid gap-12 px-7 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-end md:px-12 md:py-20 lg:px-16 lg:py-24">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber">
                {t.finalLabel}
              </p>
              <h2 className="mt-6 font-heading text-4xl font-light leading-[1.04] tracking-[-0.01em] text-cream md:text-7xl">
                {t.finalTitle.split(".")[0]}
                <span
                  className="block italic text-amber"
                  style={{ fontVariationSettings: '"opsz" 144' }}
                >
                  {t.finalTitle.split(".")[1] || "."}
                </span>
              </h2>
              <p className="mt-8 max-w-xl text-base leading-[1.85] text-cream/75 md:text-lg">
                {t.finalCopy}
              </p>
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              <Link
                to="/register"
                className="group inline-flex min-h-[3.5rem] w-full items-center justify-center gap-3 rounded-full bg-cream px-7 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-wine transition-[transform,background-color] duration-300 ease-sunrise hover:-translate-y-0.5 hover:bg-amber active:scale-[0.98] md:w-auto"
              >
                {t.finalPrimary}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                to="/register"
                className="inline-flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-full border border-cream/30 px-7 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-cream transition-[transform,background-color,border-color] duration-300 ease-sunrise hover:-translate-y-0.5 hover:border-cream hover:bg-cream/10 active:scale-[0.98] md:w-auto"
              >
                {t.finalSecondary}
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="bg-chocolate px-4 pb-10 pt-16 text-cream">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-12 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
            <div>
              <Link to="/" className="flex items-center gap-3" aria-label="Sunrise Sunset">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-coral">
                  <SunGlyph className="h-7 w-7" />
                </span>
                <span className="font-heading text-2xl leading-none">
                  Sunrise{" "}
                  <span className="italic font-light text-amber">Sunset</span>
                </span>
              </Link>
              <p className="mt-6 max-w-md text-sm leading-[1.8] text-cream/65">
                {t.footerTagline}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber">
                {t.footerColA}
              </p>
              <ul className="mt-5 space-y-3 text-sm text-cream/75">
                {t.nav.map((item, index) => (
                  <li key={item}>
                    <a
                      href={navTargets[index]}
                      className="inline-flex items-center gap-2 transition-colors hover:text-amber"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber">
                {t.footerColB}
              </p>
              <ul className="mt-5 space-y-3 text-sm text-cream/75">
                <li className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {t.visitAddress}
                </li>
                {t.visitHours.map(([day, hours]) => (
                  <li key={day} className="flex items-center justify-between gap-3">
                    <span>{day}</span>
                    <span className="tabular-nums text-cream/55">{hours}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber">
                {t.footerColC}
              </p>
              <ul className="mt-5 space-y-3 text-sm text-cream/75">
                <li>
                  <a
                    className="inline-flex items-center gap-2 transition-colors hover:text-amber"
                    href="https://www.instagram.com/sunrisesunsetloscabos"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Instagram className="h-4 w-4" /> @sunrisesunsetloscabos
                  </a>
                </li>
                <li className="inline-flex items-center gap-2">
                  <Sunrise className="h-4 w-4" /> {t.sunMeta[0]} {sunriseStr}
                </li>
                <li className="inline-flex items-center gap-2">
                  <Sunset className="h-4 w-4" /> {t.sunMeta[1]} {sunsetStr}
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-cream/15 pt-7 text-[11px] uppercase tracking-[0.22em] text-cream/55 md:flex-row md:items-center">
            <p>{t.rights}</p>
            <p>© {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Index;
