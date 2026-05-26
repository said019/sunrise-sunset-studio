import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, MapPin, Sparkles, Waves } from "lucide-react";
import heroImage from "@/assets/hero.jpeg";

type AuthShellProps = {
  title: string;
  eyebrow: string;
  copy: string;
  children: React.ReactNode;
};

export function AuthShell({ title, eyebrow, copy, children }: AuthShellProps) {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#F3E7D4] px-4 py-6 text-foreground">
      <div className="auth-sunset-field" />
      <div className="auth-sunset-ribbon" />
      <div className="auth-sunset-veil" />
      <div className="sunset-grain" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center" aria-label="Volver a inicio">
            <img
              src="/logo-wordmark.svg"
              alt="Sunrise Sunset"
              className="h-14 w-auto rounded-[1rem] shadow-[0_10px_26px_hsla(14,72%,45%,0.16)]"
            />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-cream/[0.58] px-4 py-2 text-sm font-medium text-chocolate transition-[transform,background-color] duration-200 ease-sunrise hover:-translate-y-0.5 hover:bg-cream/[0.86] active:scale-[0.97]"
          >
            <ArrowLeft className="h-4 w-4" />
            Inicio
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:py-14">
          <motion.section
            initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.72, ease: [0.23, 1, 0.32, 1] }}
            className="hidden lg:order-1 lg:block"
          >
            <div className="rounded-[2.1rem] bg-[linear-gradient(135deg,#EF704E,#F8B069_54%,#7B0000)] p-2 shadow-[0_36px_110px_hsla(14,72%,45%,0.24)]">
              <div className="overflow-hidden rounded-[1.65rem] bg-[#FFF0E3]">
                <img
                  src={heroImage}
                  alt="Interior luminoso del studio Sunrise Sunset"
                  className="aspect-[4/5] w-full object-cover"
                />
                <div className="grid grid-cols-2 divide-x divide-coral/15 bg-[#FFF0E3] p-5 text-chocolate">
                  <div className="pr-5">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Waves className="h-4 w-4 text-coral" />
                      Los Cabos ritual
                    </div>
                    <p className="mt-2 text-sm leading-6 text-chocolate/[0.64]">
                      Fuerza, balance y energía en grupos reducidos.
                    </p>
                  </div>
                  <div className="pl-5">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <CalendarDays className="h-4 w-4 text-coral" />
                      Reserva fácil
                    </div>
                    <p className="mt-2 text-sm leading-6 text-chocolate/[0.64]">
                      Tu clase lista desde tu cuenta.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.68, delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="order-1 lg:order-2"
          >
            <div className="mx-auto max-w-[520px] rounded-[2rem] bg-cream/[0.62] p-3 shadow-[0_34px_100px_hsla(14,72%,38%,0.2)] backdrop-blur-xl">
              <div className="rounded-[1.55rem] bg-blush/[0.9] p-6 shadow-[inset_0_1px_0_hsla(0,0%,100%,0.68)] md:p-8">
                <div className="mb-8">
                  <p className="inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-coral">
                    <Sparkles className="h-3.5 w-3.5" />
                    {eyebrow}
                  </p>
                  <h1 className="mt-5 font-heading text-4xl leading-tight text-chocolate md:text-5xl">
                    {title}
                  </h1>
                  <p className="mt-4 text-sm leading-6 text-chocolate/[0.66]">{copy}</p>
                </div>

                {children}
              </div>
            </div>

            <div className="mx-auto mt-5 flex max-w-[520px] items-center gap-2 text-sm text-chocolate/[0.62]">
              <MapPin className="h-4 w-4 text-coral" />
              El Tezal, Cabo San Lucas
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
