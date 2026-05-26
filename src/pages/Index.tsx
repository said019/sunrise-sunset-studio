import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Instagram,
  MapPin,
  Sparkles,
  SunMedium,
  Users,
  Waves,
} from "lucide-react";
import heroImage from "@/assets/hero.jpeg";
import pilatesImage from "@/assets/hero-pilates.jpg";

type Lang = "es" | "en";

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const instructors = ["/Coach%20Adri.jpeg", "/Coach%20Amber.jpeg", "/Coach%20Kalhia.jpeg"];
const navTargets = ["#clases", "#experiencia", "#coaches", "#paquetes", "#contacto"];

const content = {
  es: {
    nav: ["Clases", "Experiencia", "Coaches", "Paquetes", "Contacto"],
    login: "Entrar",
    reserve: "Reservar ahora",
    badge: "Studio boutique en Los Cabos",
    titleTop: "Muévete",
    titleMid: "con el sol.",
    titleAccent: "Quédate con la energía.",
    subtitle:
      "Sculpt-Funcional, Surf-Pilates y Yoga en un espacio boutique para sentirte fuerte, segura y con algo bonito que esperar durante tu día.",
    primary: "Crear cuenta",
    secondary: "Reservar ahora",
    visualLabel: "Ritual en Cabo",
    visualNumberCopy: "paquetes para moverte a tu ritmo, desde clase muestra hasta ilimitadas.",
    visualNote: "Grupos reducidos, energía cálida y atención cercana.",
    classesLabel: "Movimiento consciente",
    classesTitle: "Entrena fuerte, respira suave, vuelve a ti.",
    services: [
      ["Sculpt-Funcional", "Fuerza, control y ritmo en grupos reducidos."],
      ["Surf-Pilates", "Equilibrio, core y presencia sobre tabla."],
      ["Yoga", "Respira, recupera espacio y baja el ruido del día."],
    ],
    experienceLabel: "La vibra del studio",
    experienceTitle: "Naranja, cálido, boutique y con energía de comunidad.",
    experienceCopy:
      "La experiencia mezcla entrenamiento efectivo con una estética cuidada: luz, música, movimiento y un ambiente que se siente cercano sin perder lo premium.",
    chips: ["Atención personalizada", "Wellness retreat mood", "Diseño costero", "Comunidad con intención"],
    coachesLabel: "Conoce a las coaches",
    coachesTitle: "Técnica, energía y atención cercana en cada clase.",
    coachesIntro:
      "Cuatro formas de moverte con intención: fuerza, yoga, sculpt, barre, surf-pilates y una comunidad que se siente boutique desde la primera visita.",
    coaches: [
      {
        name: "Adri",
        role: "Fundadora · Sculpt-Funcional & Surf-Pilates",
        image: "/Coach%20Adri.jpeg",
        position: "object-center",
        quote:
          "Me gusta que las clases sean retadoras, enfocadas en cuerpo completo, trabajando fuerza y control. Quiero darte un espacio para conectar contigo, moverte con intención y sentirte más fuerte cada día.",
        bio:
          "Después de inspirar a muchas chicas en sus clases, Adri decidió cumplir su sueño y abrir su propio estudio. En Sunrise Sunset busca transmitirte una experiencia inolvidable en cada clase.",
        tags: ["Fuerza", "Control", "Surf-Pilates"],
      },
      {
        name: "Amber",
        role: "Pilates · Sculpt · Barre",
        image: "/Coach%20Amber.jpeg",
        position: "object-top",
        quote: "",
        bio:
          "Originaria de Australia y con más de 26 años de experiencia profesional en danza, Amber se certificó como instructora en Pilates, Sculpt y Barre. Ama crear clases con enfoque en técnica, alineación y movimiento consciente para ayudarte a ganar fuerza, confianza y conciencia corporal en un ambiente estimulante y de bienvenida.",
        tags: ["26+ años", "Técnica", "Alineación"],
      },
      {
        name: "Khalia",
        role: "Pilates · Nutrición funcional",
        image: "/Coach%20Kalhia.jpeg",
        position: "object-top",
        quote: "",
        bio:
          "Apasionada del fitness, nutrióloga funcional e instructora de pilates certificada. En sus clases encontrarás un enfoque retador y consciente que combina movimiento, fuerza y conexión mente-cuerpo para descubrir todo lo que tu cuerpo puede hacer cuando lo escuchas.",
        tags: ["Mind-body", "Pilates", "Energía"],
      },
      {
        name: "Ceci",
        role: "Yoga",
        image: "/Coach%20ceci.jpeg",
        position: "object-top",
        quote: "",
        bio:
          "Con una década de experiencia profesional en danza, Ceci se adentró en el mundo del yoga en 1999. Inició con Hatha yoga bajo la guía de Dhruva Lance y Bindu de la Parra, obtuvo certificación en Vinyasa yoga con Anna Alurita y profundizó en Ashtanga con Weyne Krassner. Desde 2018 radica en Los Cabos y comparte su pasión por esta disciplina en Sunrise Sunset.",
        tags: ["Yoga desde 1999", "Vinyasa", "Ashtanga"],
      },
    ],
    packageLabel: "Paquetes",
    packageTitle: "Elige cómo quieres moverte este mes.",
    packageCta: "Reservar ahora",
    packages: [
      {
        name: "Sculpt + Yoga",
        price: "desde $1,400",
        copy: "Para construir fuerza con una rutina estable.",
        items: ["4, 8 o 12 clases", "Opción ilimitada", "Vigencia de 30 días"],
      },
      {
        name: "Surf-Pilates + Yoga",
        price: "desde $1,560",
        copy: "Para trabajar balance, core y flow.",
        items: ["Wave Starter", "Ocean Flow", "Deep Flow"],
      },
      {
        name: "Experiencia mixta",
        price: "desde $2,280",
        copy: "Una mezcla curada de Sculpt, Surf-Pilates y Yoga.",
        items: ["8, 12 o 16 clases", "Créditos por tipo", "Combo ilimitado"],
      },
    ],
    finalLabel: "Primera visita",
    finalTitle: "Reserva algo que sí vas a esperar durante tu día.",
    finalPrimary: "Crear cuenta",
    finalSecondary: "Reservar ahora",
    footerCopy:
      "Sculpt-Funcional, Surf-Pilates y Yoga en El Tezal, Cabo San Lucas. Una experiencia boutique para moverte con intención.",
    smallGroup: "Grupos reducidos",
    bookFromAccount: "Reservas desde tu cuenta",
  },
  en: {
    nav: ["Classes", "Experience", "Coaches", "Packages", "Contact"],
    login: "Login",
    reserve: "Book now",
    badge: "Boutique studio in Los Cabos",
    titleTop: "Move",
    titleMid: "with the sun.",
    titleAccent: "Stay for the energy.",
    subtitle:
      "Sculpt-Functional, Surf-Pilates and Yoga in a boutique studio made for strength, confidence and a beautiful pause in your day.",
    primary: "Create account",
    secondary: "Book now",
    visualLabel: "Cabo ritual",
    visualNumberCopy: "packages for your rhythm, from trial class to unlimited plans.",
    visualNote: "Small groups, warm energy and personal attention.",
    classesLabel: "Conscious movement",
    classesTitle: "Train strong, breathe softly, come back to yourself.",
    services: [
      ["Sculpt-Functional", "Strength, control and rhythm in small groups."],
      ["Surf-Pilates", "Balance, core and presence on the board."],
      ["Yoga", "Breathe, recover space and soften the noise of the day."],
    ],
    experienceLabel: "Studio mood",
    experienceTitle: "Orange, warm, boutique and community-driven.",
    experienceCopy:
      "The experience blends effective training with a curated aesthetic: light, music, movement and a space that feels close without losing its premium edge.",
    chips: ["Personal attention", "Wellness retreat mood", "Coastal design", "Intentional community"],
    coachesLabel: "Meet the coaches",
    coachesTitle: "Technique, energy and personal attention in every class.",
    coachesIntro:
      "Four ways to move with intention: strength, yoga, sculpt, barre, surf-pilates and a boutique community from the first visit.",
    coaches: [
      {
        name: "Adri",
        role: "Founder · Sculpt-Functional & Surf-Pilates",
        image: "/Coach%20Adri.jpeg",
        position: "object-center",
        quote:
          "I love it when classes are challenging, focused on full body work, strength and control. I want to give you a space where you can connect with yourself, move with intention and feel stronger every day.",
        bio:
          "After inspiring many girls in her classes, Adri decided to bring her dream to life and open her own studio. At Sunrise Sunset, she looks forward to giving you an unforgettable experience in every class.",
        tags: ["Strength", "Control", "Surf-Pilates"],
      },
      {
        name: "Amber",
        role: "Pilates · Sculpt · Barre",
        image: "/Coach%20Amber.jpeg",
        position: "object-top",
        quote: "",
        bio:
          "Originally from Australia, with over 26 years of professional dance experience, Amber became certified in Pilates, Sculpt and Barre. She loves creating classes with a strong focus on technique, alignment and safe movement, helping clients build strength, confidence and body awareness in a welcoming environment.",
        tags: ["26+ years", "Technique", "Alignment"],
      },
      {
        name: "Khalia",
        role: "Pilates · Functional nutrition",
        image: "/Coach%20Kalhia.jpeg",
        position: "object-top",
        quote: "",
        bio:
          "Passionate about fitness, a functional nutritionist and certified Pilates instructor. In Khalia's classes, you will find a challenging and mindful approach that combines movement, strength and mind-body connection so you can discover everything your body is capable of when you listen to it.",
        tags: ["Mind-body", "Pilates", "Energy"],
      },
      {
        name: "Ceci",
        role: "Yoga",
        image: "/Coach%20ceci.jpeg",
        position: "object-top",
        quote: "",
        bio:
          "With a decade of professional dance experience, Ceci entered the world of Yoga in 1999. She started with Hatha yoga under the guidance of Dhruva Lance and Bindu de la Parra, became certified in Vinyasa yoga with Anna Alurita and deepened her Ashtanga practice with Weyne Krassner. She has lived in Los Cabos since 2018 and shares her passion for this discipline at Sunrise Sunset.",
        tags: ["Yoga since 1999", "Vinyasa", "Ashtanga"],
      },
    ],
    packageLabel: "Packages",
    packageTitle: "Choose how you want to move this month.",
    packageCta: "Book now",
    packages: [
      {
        name: "Sculpt + Yoga",
        price: "from $1,400",
        copy: "For building strength with a steady routine.",
        items: ["4, 8 or 12 classes", "Unlimited option", "30 day validity"],
      },
      {
        name: "Surf-Pilates + Yoga",
        price: "from $1,560",
        copy: "For balance, core and flow.",
        items: ["Wave Starter", "Ocean Flow", "Deep Flow"],
      },
      {
        name: "Mixed experience",
        price: "from $2,280",
        copy: "A curated mix of Sculpt, Surf-Pilates and Yoga.",
        items: ["8, 12 or 16 classes", "Credits by type", "Unlimited combo"],
      },
    ],
    finalLabel: "First visit",
    finalTitle: "Book something you will actually look forward to today.",
    finalPrimary: "Create account",
    finalSecondary: "Book now",
    footerCopy:
      "Sculpt-Functional, Surf-Pilates and Yoga in El Tezal, Cabo San Lucas. A boutique experience for intentional movement.",
    smallGroup: "Small groups",
    bookFromAccount: "Book from your account",
  },
};

const serviceIcons = [Sparkles, Waves, SunMedium];

const Index = () => {
  const [lang, setLang] = useState<Lang>("es");
  const t = content[lang];

  return (
    <main className="min-h-screen overflow-hidden bg-[#EF704E] text-foreground">
      <div className="sunset-grain" />

      <nav className="fixed left-0 right-0 top-4 z-40 px-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-cream/30 bg-cream/[0.9] px-4 py-3 shadow-[0_18px_60px_hsla(13,66%,32%,0.22)] backdrop-blur-xl md:px-5">
          <Link to="/" className="flex items-center" aria-label="Sunrise Sunset inicio">
            <img
              src="/logo-wordmark.svg"
              alt="Sunrise Sunset"
              className="h-12 w-auto rounded-[0.9rem] shadow-[0_10px_26px_hsla(14,72%,45%,0.2)] md:h-14"
            />
          </Link>

          <div className="hidden items-center gap-6 text-sm text-chocolate/70 md:flex">
            {t.nav.map((item, index) => (
              <a
                key={item}
                className="transition-colors hover:text-chocolate"
                href={navTargets[index]}
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === "es" ? "en" : "es")}
              className="rounded-full border border-coral/30 bg-coral/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-coral transition-[transform,background-color] duration-200 ease-sunrise hover:-translate-y-0.5 hover:bg-coral hover:text-cream active:scale-[0.97]"
              aria-label={lang === "es" ? "Cambiar a ingles" : "Switch to Spanish"}
            >
              {lang === "es" ? "EN" : "ES"}
            </button>
            <Link
              to="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-chocolate transition-colors hover:bg-chocolate/10 sm:inline-flex"
            >
              {t.login}
            </Link>
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm font-semibold text-cream shadow-[0_14px_34px_hsla(14,72%,45%,0.3)] transition-[transform,box-shadow,background-color] duration-200 ease-sunrise hover:-translate-y-0.5 hover:bg-wine active:scale-[0.97]"
            >
              {t.reserve}
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cream/20 transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-[92dvh] px-4 pb-16 pt-32 text-cream md:pb-20 md:pt-36">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_20%,hsla(33,100%,68%,0.55),transparent_28%),radial-gradient(circle_at_85%_12%,hsla(0,100%,24%,0.28),transparent_28%),linear-gradient(135deg,#EF704E_0%,#EA6846_42%,#D95E3E_100%)]" />
        <div className="mx-auto grid max-w-6xl items-end gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.75, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-3xl"
          >
            <p className="mb-5 inline-flex rounded-full border border-cream/35 bg-cream/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cream">
              {t.badge}
            </p>
            <h1 className="font-heading text-[clamp(3.5rem,8.4vw,8.4rem)] font-medium leading-[0.88] text-cream">
              {t.titleTop}
              <span className="block">{t.titleMid}</span>
              <span className="block italic text-[#FFD49C]">{t.titleAccent}</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-cream/82 md:text-xl">{t.subtitle}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-cream px-6 py-3 text-base font-semibold text-chocolate shadow-[0_18px_50px_hsla(11,80%,30%,0.26)] transition-[transform,box-shadow,background-color] duration-200 ease-sunrise hover:-translate-y-0.5 hover:bg-[#FFE7D2] active:scale-[0.97]"
              >
                {t.primary}
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-coral text-cream transition-transform group-hover:translate-x-1">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <Link
                to="/register"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-cream/42 bg-cream/10 px-6 py-3 text-base font-semibold text-cream transition-[transform,background-color] duration-200 ease-sunrise hover:-translate-y-0.5 hover:bg-cream/18 active:scale-[0.97]"
              >
                {t.secondary}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-[2.2rem] bg-cream p-2 text-chocolate shadow-[0_35px_90px_hsla(13,66%,30%,0.26)]"
          >
            <div className="grid overflow-hidden rounded-[1.7rem] bg-[#FFF2EC] lg:grid-cols-[1fr_200px]">
              <img
                src={heroImage}
                alt="Studio Sunrise Sunset con luz natural"
                className="aspect-[4/5] h-full w-full object-cover lg:aspect-auto"
              />
              <aside className="grid content-between gap-6 bg-[#FFF2EC] p-6 text-chocolate">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-coral">{t.visualLabel}</p>
                  <p className="mt-4 font-heading text-5xl leading-none">12</p>
                  <p className="mt-3 text-sm leading-6 text-chocolate/[0.68]">{t.visualNumberCopy}</p>
                </div>
                <div className="rounded-2xl bg-coral px-4 py-5 text-sm font-semibold leading-6 text-cream">
                  {t.visualNote}
                </div>
              </aside>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="clases" className="scroll-mt-32 bg-cream px-4 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
            className="grid gap-10 md:grid-cols-[0.85fr_1.15fr]"
          >
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">{t.classesLabel}</p>
              <h2 className="mt-4 font-heading text-4xl leading-tight text-chocolate md:text-6xl">
                {t.classesTitle}
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {t.services.map(([title, detail], index) => {
                const Icon = serviceIcons[index];
                return (
                  <motion.article
                    key={title}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.55, delay: index * 0.08, ease: [0.23, 1, 0.32, 1] }}
                    className="group rounded-[1.4rem] bg-[#FFEDE4] p-5 shadow-[inset_0_1px_0_hsla(0,0%,100%,0.55)] transition-transform duration-200 ease-sunrise hover:-translate-y-1"
                  >
                    <div className="mb-10 flex h-11 w-11 items-center justify-center rounded-full bg-coral text-cream">
                      <Icon className="h-5 w-5" strokeWidth={1.7} />
                    </div>
                    <h3 className="font-heading text-2xl text-chocolate">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-chocolate/[0.66]">{detail}</p>
                  </motion.article>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="experiencia" className="scroll-mt-32 bg-[#EF704E] px-4 py-20 text-cream md:py-32">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden rounded-[2rem] bg-cream p-2 shadow-[0_28px_80px_hsla(11,80%,30%,0.22)]"
          >
            <img
              src={pilatesImage}
              alt="Surf-Pilates como experiencia principal del studio"
              className="aspect-[4/5] w-full rounded-[1.55rem] object-cover md:aspect-[5/4]"
            />
          </motion.div>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="self-center rounded-[2rem] border border-cream/30 bg-cream/12 p-6 shadow-[0_24px_80px_hsla(11,80%,28%,0.18)] md:p-10"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#FFD49C]">{t.experienceLabel}</p>
            <h2 className="mt-4 font-heading text-4xl leading-tight text-cream md:text-6xl">
              {t.experienceTitle}
            </h2>
            <p className="mt-6 text-base leading-8 text-cream/78">{t.experienceCopy}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {t.chips.map((item) => (
                <div key={item} className="rounded-2xl bg-cream px-4 py-3 text-sm font-semibold text-coral">
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="coaches" className="scroll-mt-32 bg-cream px-4 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="mb-10 grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-end"
          >
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">
                {t.coachesLabel}
              </p>
              <h2 className="mt-4 font-heading text-4xl leading-tight text-chocolate md:text-6xl">
                {t.coachesTitle}
              </h2>
            </div>
            <div className="md:justify-self-end">
              <p className="max-w-xl text-base leading-8 text-chocolate/[0.68]">{t.coachesIntro}</p>
              <Link
                to="/register"
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-cream transition-[transform,background-color] duration-200 ease-sunrise hover:-translate-y-0.5 hover:bg-wine active:scale-[0.97]"
              >
                {t.secondary}
              </Link>
            </div>
          </motion.div>

          <div className="grid gap-4 lg:grid-cols-2">
            {t.coaches.map((coach, index) => (
              <motion.article
                key={coach.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: index * 0.06, ease: [0.23, 1, 0.32, 1] }}
                className={`group overflow-hidden rounded-[2rem] shadow-[0_24px_70px_hsla(14,72%,35%,0.16)] ${
                  index === 0
                    ? "bg-[#EF704E] text-cream lg:col-span-2 lg:grid lg:grid-cols-[0.8fr_1.2fr]"
                    : "bg-[#FFEDE4] text-chocolate"
                }`}
              >
                <div
                  className={`relative ${
                    index === 0 ? "min-h-[480px]" : "min-h-[420px]"
                  } overflow-hidden bg-chocolate`}
                >
                  <img
                    src={coach.image}
                    alt={`Coach ${coach.name} Sunrise Sunset`}
                    className={`h-full min-h-[inherit] w-full ${coach.position} object-cover transition-transform duration-700 ease-sunrise group-hover:scale-[1.025]`}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-chocolate/78 via-chocolate/18 to-transparent p-6">
                    <p className="font-heading text-5xl leading-none text-cream md:text-6xl">
                      Coach {coach.name}
                    </p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#FFD49C]">
                      {coach.role}
                    </p>
                  </div>
                </div>

                <div className={`grid content-between gap-6 p-6 md:p-8 ${index === 0 ? "md:p-10" : ""}`}>
                  <div>
                    {coach.quote ? (
                      <blockquote
                        className={`mb-6 font-heading text-3xl leading-tight ${
                          index === 0 ? "text-cream" : "text-coral"
                        }`}
                      >
                        "{coach.quote}"
                      </blockquote>
                    ) : null}
                    <p
                      className={`text-sm leading-7 ${
                        index === 0 ? "text-cream/82 md:text-base md:leading-8" : "text-chocolate/[0.68]"
                      }`}
                    >
                      {coach.bio}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {coach.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] ${
                          index === 0 ? "bg-cream/14 text-cream" : "bg-cream text-coral"
                        }`}
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

      <section id="paquetes" className="scroll-mt-32 bg-cream px-4 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
            className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end"
          >
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">{t.packageLabel}</p>
              <h2 className="mt-4 max-w-3xl font-heading text-4xl leading-tight text-chocolate md:text-6xl">
                {t.packageTitle}
              </h2>
            </div>
            <Link
              to="/register"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-cream transition-[transform,background-color] duration-200 ease-sunrise hover:-translate-y-0.5 hover:bg-wine active:scale-[0.97]"
            >
              {t.packageCta}
            </Link>
          </motion.div>

          <div className="grid gap-4 lg:grid-cols-3">
            {t.packages.map((group, index) => (
              <motion.article
                key={group.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: index * 0.08, ease: [0.23, 1, 0.32, 1] }}
                className={`rounded-[1.7rem] p-6 ${
                  index === 1
                    ? "bg-coral text-cream shadow-[0_24px_80px_hsla(14,72%,35%,0.22)]"
                    : "bg-[#FFEDE4] text-chocolate"
                }`}
              >
                <p className={`text-sm ${index === 1 ? "text-cream/70" : "text-coral"}`}>0{index + 1}</p>
                <h3 className="mt-8 font-heading text-3xl">{group.name}</h3>
                <p className={`mt-3 text-sm leading-6 ${index === 1 ? "text-cream/78" : "text-chocolate/[0.66]"}`}>
                  {group.copy}
                </p>
                <p className="mt-8 flex items-baseline gap-2 font-heading text-4xl">
                  {group.price}
                  <span className={`font-body text-xs font-bold uppercase tracking-[0.16em] ${index === 1 ? "text-cream/70" : "text-coral"}`}>
                    MXN
                  </span>
                </p>
                <ul className={`mt-8 space-y-3 text-sm ${index === 1 ? "text-cream/80" : "text-chocolate/[0.68]"}`}>
                  {group.items.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className={`h-1.5 w-1.5 rounded-full ${index === 1 ? "bg-cream" : "bg-coral"}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#EF704E] px-4 py-20 text-cream md:py-28">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-chocolate text-cream shadow-[0_35px_95px_hsla(14,72%,35%,0.28)] lg:grid-cols-[0.9fr_1.1fr]"
        >
          <div className="p-7 md:p-12">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#FFD49C]">{t.finalLabel}</p>
            <h2 className="mt-4 font-heading text-4xl leading-tight md:text-6xl">{t.finalTitle}</h2>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex min-h-[3.25rem] items-center justify-center rounded-full bg-cream px-6 py-3 text-sm font-semibold text-chocolate transition-transform duration-200 ease-sunrise hover:-translate-y-0.5 active:scale-[0.97]"
              >
                {t.finalPrimary}
              </Link>
              <Link
                to="/register"
                className="inline-flex min-h-[3.25rem] items-center justify-center rounded-full border border-cream/[0.32] px-6 py-3 text-sm font-semibold text-cream transition-[transform,background-color] duration-200 ease-sunrise hover:-translate-y-0.5 hover:bg-cream/10 active:scale-[0.97]"
              >
                {t.finalSecondary}
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 p-2">
            {instructors.map((image, index) => (
              <img
                key={image}
                src={image}
                alt={`Instructor Sunrise Sunset ${index + 1}`}
                className="h-full min-h-[280px] w-full rounded-[1.45rem] object-cover"
              />
            ))}
          </div>
        </motion.div>
      </section>

      <footer id="contacto" className="bg-cream px-4 pb-8 pt-12">
        <div className="mx-auto grid max-w-6xl gap-8 rounded-[2rem] bg-chocolate p-7 text-cream md:grid-cols-[1.2fr_0.8fr] md:p-10">
          <div>
            <img src="/logo-wordmark.svg" alt="Sunrise Sunset" className="h-24 w-auto rounded-[1.2rem]" />
            <p className="mt-6 max-w-xl text-sm leading-7 text-cream/[0.64]">{t.footerCopy}</p>
          </div>
          <div className="grid gap-3 text-sm text-cream/[0.72]">
            <a
              className="flex items-center gap-3 transition-colors hover:text-cream"
              href="https://www.instagram.com/sunrisesunsetloscabos"
              target="_blank"
              rel="noreferrer"
            >
              <Instagram className="h-4 w-4" /> @sunrisesunsetloscabos
            </a>
            <span className="flex items-center gap-3">
              <MapPin className="h-4 w-4" /> El Tezal, Cabo San Lucas
            </span>
            <span className="flex items-center gap-3">
              <Users className="h-4 w-4" /> {t.smallGroup}
            </span>
            <span className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4" /> {t.bookFromAccount}
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Index;
