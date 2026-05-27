import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowUpRight, Sunrise, Sunset } from 'lucide-react';
import { Link } from 'react-router-dom';
import { safeFormat } from '@/lib/date';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { fetchMyMembership } from '@/lib/memberships';
import type { BookingClient } from '@/types/booking';
import type { ClientMembership } from '@/types/membership';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Skeleton } from '@/components/ui/skeleton';

interface WalletSummary {
  pointsBalance: number;
}

const statusLabel: Record<ClientMembership['status'], string> = {
  active: 'Activa',
  expired: 'Vencida',
  cancelled: 'Cancelada',
  pending_payment: 'Pago pendiente',
  pending_activation: 'Pendiente',
  paused: 'Pausada',
};

const easeBreath = [0.65, 0, 0.35, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 22, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

const SunGlyph = ({ className = '' }: { className?: string }) => (
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

export default function ClientDashboard() {
  const { user } = useAuthStore();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const { data: membership, isLoading: membershipLoading } = useQuery<ClientMembership | null>({
    queryKey: ['my-membership'],
    queryFn: fetchMyMembership,
  });

  const isExpiredOrCancelled =
    membership?.status === 'expired' || membership?.status === 'cancelled';
  const isOutOfCredits =
    membership?.status === 'active' &&
    !!membership?.class_limit &&
    (membership?.classes_remaining ?? 0) <= 0;
  const hasActiveCredits = membership?.status === 'active' && !isOutOfCredits;

  const { data: bookings, isLoading: bookingsLoading } = useQuery<BookingClient[]>({
    queryKey: ['my-bookings'],
    queryFn: async () => (await api.get('/bookings/my-bookings')).data,
  });

  const { data: walletSummary } = useQuery<WalletSummary>({
    queryKey: ['wallet-pass'],
    queryFn: async () => (await api.get('/wallet/pass')).data,
  });

  const upcomingClasses = useMemo(() => {
    if (!bookings) return [];
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return bookings
      .filter((b) => b.booking_status !== 'cancelled')
      .filter((b) => parseISO(b.date) >= today)
      .sort((a, b) => {
        const da = parseISO(`${a.date}T${a.start_time}`);
        const db = parseISO(`${b.date}T${b.start_time}`);
        return da.getTime() - db.getTime();
      });
  }, [bookings, now]);

  const nextClass = upcomingClasses[0] ?? null;
  const restOfWeek = upcomingClasses.slice(1, 4);

  const membershipEnd = membership?.end_date ? parseISO(membership.end_date) : null;
  const daysRemaining = membershipEnd
    ? Math.max(differenceInCalendarDays(membershipEnd, new Date()), 0)
    : null;
  const classLimit = membership?.class_limit ?? null;
  const classesRemaining = membership?.classes_remaining ?? null;
  const pointsBalance = walletSummary?.pointsBalance ?? 0;

  const firstName = user?.display_name?.split(' ')[0] || 'amiga';
  const greetingEyebrow = (() => {
    const h = now.getHours();
    if (h < 11) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  const dateString = now
    .toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long' })
    .replace(/\./g, '');
  const timeString = now.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const sunProgress = useMemo(() => {
    const minutes = now.getHours() * 60 + now.getMinutes();
    const start = 6 * 60;
    const end = 20 * 60;
    if (minutes < start) return 0;
    if (minutes > end) return 1;
    return (minutes - start) / (end - start);
  }, [now]);

  const skyColors = useMemo<[string, string, string]>(() => {
    if (sunProgress < 0.25) return ['#FFD8B2', '#F5A26C', '#7B0000'];
    if (sunProgress < 0.55) return ['#FFE6BD', '#EF704E', '#B33A1F'];
    if (sunProgress < 0.85) return ['#F8B069', '#E36F4C', '#7B0000'];
    return ['#C26E55', '#7B0000', '#3A0E0E'];
  }, [sunProgress]);

  const sunriseStr = '06:42';
  const sunsetStr = '19:48';

  // Membership pass content
  const pass = (() => {
    if (membershipLoading) return null;
    if (!membership) {
      return {
        eyebrow: 'Tu pase boutique',
        title: 'Activa tu plan',
        body: 'Reserva tu primera clase y empieza tu rutina con intención.',
        cta: { label: 'Comprar membresía', to: '/app/checkout' },
        badge: 'Sin membresía',
      };
    }
    if (isOutOfCredits) {
      return {
        eyebrow: 'Tu pase boutique',
        title: membership.plan_name || 'Tu membresía',
        body: `Agotaste tus ${membership.class_limit} clases${membership.end_date ? ` · vence el ${safeFormat(parseISO(membership.end_date), 'dd MMM')}` : ''}.`,
        cta: { label: 'Comprar más clases', to: '/app/checkout' },
        badge: 'Sin créditos',
      };
    }
    if (isExpiredOrCancelled) {
      return {
        eyebrow: 'Tu pase boutique',
        title: membership.plan_name || 'Tu membresía',
        body: `Tu membresía ${membership.status === 'expired' ? 'venció' : 'fue cancelada'}${membership.end_date ? ` el ${safeFormat(parseISO(membership.end_date), 'dd MMM')}` : ''}.`,
        cta: { label: 'Renovar membresía', to: '/app/checkout' },
        badge: statusLabel[membership.status],
      };
    }
    return {
      eyebrow: 'Tu pase boutique',
      title: membership.plan_name || 'Tu membresía',
      body:
        classLimit && classesRemaining !== null
          ? `${classesRemaining} de ${classLimit} clases · ${daysRemaining ?? 0} días restantes`
          : `Acceso ilimitado · ${daysRemaining ?? 0} días restantes`,
      cta: { label: 'Reservar clase', to: '/app/book' },
      badge: 'Activa',
    };
  })();

  const passProgress =
    hasActiveCredits && classLimit && classesRemaining !== null
      ? Math.max(0, Math.min(1, classesRemaining / classLimit))
      : null;

  return (
    <AuthGuard requiredRoles={['client']}>
      <ClientLayout fab={{ to: '/app/book', label: 'Reservar clase', icon: 'add' }}>
        {/* dynamic sky strip — sits just under the layout header */}
        <div
          className="pointer-events-none fixed inset-x-0 top-[5rem] z-30 h-[2px]"
          style={{
            background: `linear-gradient(90deg, ${skyColors[0]} 0%, ${skyColors[1]} ${Math.round(
              sunProgress * 100
            )}%, ${skyColors[2]} 100%)`,
          }}
        />

        <div className="space-y-10 md:space-y-14">
          {/* GREETING + sun meta */}
          <motion.section
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.8, ease: easeBreath }}
            className="pt-2"
          >
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-[0.22em] text-chocolate/55">
              <span className="inline-flex items-center gap-2 text-coral">
                <span className="h-px w-6 bg-coral" />
                {greetingEyebrow}
              </span>
              <span className="text-chocolate/30">·</span>
              <span>{dateString}</span>
              <span className="text-chocolate/30">·</span>
              <span className="tabular-nums">{timeString} Cabo</span>
            </div>
            <h1 className="mt-5 font-heading text-[clamp(2.6rem,7vw,4.8rem)] font-light leading-[0.95] tracking-[-0.015em] text-chocolate">
              <span
                className="italic text-coral"
                style={{ fontVariationSettings: '"opsz" 144' }}
              >
                Hola,
              </span>{' '}
              {firstName}.
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-chocolate/55">
              <span className="inline-flex items-center gap-2">
                <Sunrise className="h-3.5 w-3.5" strokeWidth={1.6} /> Amanecer {sunriseStr}
              </span>
              <span className="inline-flex items-center gap-2">
                <Sunset className="h-3.5 w-3.5" strokeWidth={1.6} /> Atardecer {sunsetStr}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-coral/60" />
                  <span className="relative h-2 w-2 rounded-full bg-coral" />
                </span>
                Studio abierto
              </span>
            </div>
          </motion.section>

          {/* MEMBERSHIP PASS */}
          <motion.section
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.85, delay: 0.08, ease: easeBreath }}
          >
            {membershipLoading || !pass ? (
              <div className="space-y-3 rounded-[1.6rem] border border-chocolate/10 bg-cream p-7">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-12 w-full rounded-full" />
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-[1.8rem] bg-chocolate text-cream shadow-[0_45px_120px_-50px_hsla(13,66%,28%,0.55)]">
                {/* decorative sun glyph */}
                <div className="pointer-events-none absolute -right-16 -top-16 h-[260px] w-[260px] text-cream/10">
                  <SunGlyph className="h-full w-full" />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_120%,hsla(33,100%,72%,0.22),transparent_55%)]" />

                <div className="relative grid gap-7 p-6 md:grid-cols-[1.2fr_0.8fr] md:items-end md:gap-10 md:p-8">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/12 text-amber">
                        <SunGlyph className="h-5 w-5" />
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber">
                        {pass.eyebrow}
                      </p>
                      <span className="ml-auto rounded-full border border-cream/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cream/85 md:hidden">
                        {pass.badge}
                      </span>
                    </div>

                    <h2 className="mt-5 font-heading text-3xl font-light leading-tight text-cream md:text-4xl">
                      {pass.title}
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-[1.7] text-cream/75 md:text-base">
                      {pass.body}
                    </p>

                    {passProgress !== null ? (
                      <div className="mt-6">
                        <div className="h-[3px] w-full overflow-hidden rounded-full bg-cream/15">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${passProgress * 100}%` }}
                            transition={{ duration: 1.1, ease: easeBreath, delay: 0.2 }}
                            className="h-full rounded-full bg-amber"
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-cream/55">
                          <span>{classesRemaining} clases</span>
                          <span>{daysRemaining} días</span>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-stretch gap-3 md:items-end">
                    <span className="hidden rounded-full border border-cream/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cream/85 md:inline-flex">
                      {pass.badge}
                    </span>
                    <Link
                      to={pass.cta.to}
                      className="group inline-flex min-h-[3rem] items-center justify-center gap-3 rounded-full bg-cream px-6 py-3 text-[12px] font-bold uppercase tracking-[0.18em] text-chocolate transition-[transform,background-color] duration-300 ease-sunrise hover:-translate-y-0.5 hover:bg-amber active:scale-[0.98]"
                    >
                      {pass.cta.label}
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </motion.section>

          {/* NEXT VISIT */}
          <motion.section
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.85, delay: 0.16, ease: easeBreath }}
          >
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
                  Próxima visita
                </p>
                <h3 className="mt-2 font-heading text-2xl font-light leading-tight text-chocolate md:text-3xl">
                  {nextClass ? 'Te esperamos en' : 'Una pausa bonita te espera.'}
                  {nextClass ? (
                    <>
                      {' '}
                      <span
                        className="italic text-coral"
                        style={{ fontVariationSettings: '"opsz" 144' }}
                      >
                        el studio.
                      </span>
                    </>
                  ) : null}
                </h3>
              </div>
              <Link
                to="/app/classes"
                className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-coral hover:text-wine sm:inline-flex"
              >
                Ver mis clases →
              </Link>
            </div>

            {bookingsLoading ? (
              <Skeleton className="h-40 w-full rounded-[1.6rem]" />
            ) : nextClass ? (
              <Link
                to={`/app/classes/${nextClass.booking_id}`}
                className="group block overflow-hidden rounded-[1.6rem] border border-chocolate/10 bg-cream transition-[transform,border-color,box-shadow] duration-300 ease-sunrise hover:-translate-y-0.5 hover:border-coral/40 hover:shadow-[0_30px_70px_-40px_hsla(13,66%,28%,0.4)]"
              >
                <div className="grid gap-0 md:grid-cols-[180px_1fr_auto]">
                  {/* TIME block */}
                  <div className="flex flex-col justify-between gap-3 border-b border-chocolate/10 bg-[#F4E7D4] p-6 md:border-b-0 md:border-r">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
                      {safeFormat(nextClass.date, 'EEE d MMM')}
                    </p>
                    <p className="font-heading text-5xl font-light leading-none tabular-nums text-chocolate md:text-6xl">
                      {nextClass.start_time.slice(0, 5)}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-chocolate/55">
                      Coach {nextClass.instructor_name}
                    </p>
                  </div>

                  {/* CLASS info */}
                  <div className="flex flex-col justify-center gap-3 p-6">
                    <p className="font-heading text-3xl font-light leading-tight text-chocolate">
                      {nextClass.class_type_name}
                    </p>
                    {'location' in nextClass && (nextClass as { location?: string }).location ? (
                      <p className="text-sm text-chocolate/65">
                        {(nextClass as { location?: string }).location}
                      </p>
                    ) : null}
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-end gap-2 border-t border-chocolate/10 p-6 md:border-l md:border-t-0">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-chocolate/65 transition-colors group-hover:text-coral">
                      Detalles
                    </span>
                    <ArrowUpRight className="h-5 w-5 text-chocolate/55 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-coral" />
                  </div>
                </div>
              </Link>
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-chocolate/20 bg-cream p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-coral/10 text-coral">
                  <SunGlyph className="h-6 w-6" />
                </div>
                <p className="mt-5 font-heading text-2xl font-light italic text-chocolate">
                  Reserva tu siguiente pausa.
                </p>
                <p className="mt-2 text-sm text-chocolate/65">
                  Elige el momento del día que mejor te siente.
                </p>
                <Link
                  to="/app/book"
                  className="mt-6 inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-full bg-chocolate px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cream transition-[transform,background-color] duration-200 ease-sunrise hover:-translate-y-0.5 hover:bg-coral active:scale-[0.98]"
                >
                  Reservar ahora
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </motion.section>

          {/* QUICK RAIL — WalletClub + Plans + Orders */}
          <motion.section
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.85, delay: 0.22, ease: easeBreath }}
            className="grid gap-4 sm:grid-cols-3"
          >
            <Link
              to="/app/wallet"
              className="group relative overflow-hidden rounded-[1.4rem] border border-chocolate/10 bg-cream p-5 transition-[transform,border-color] duration-300 ease-sunrise hover:-translate-y-0.5 hover:border-coral/40"
            >
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
                  WalletClub
                </p>
                <ArrowUpRight className="h-4 w-4 text-chocolate/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-coral" />
              </div>
              <p className="mt-7 font-heading text-4xl font-light leading-none tabular-nums text-chocolate">
                {pointsBalance.toLocaleString()}
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-chocolate/55">
                puntos disponibles
              </p>
            </Link>

            <Link
              to="/app/plans"
              className="group relative overflow-hidden rounded-[1.4rem] border border-chocolate/10 bg-[#F4E7D4] p-5 transition-[transform,border-color] duration-300 ease-sunrise hover:-translate-y-0.5 hover:border-coral/40"
            >
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
                  Planes
                </p>
                <ArrowUpRight className="h-4 w-4 text-chocolate/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-coral" />
              </div>
              <p
                className="mt-7 font-heading text-3xl font-light italic leading-none text-chocolate"
                style={{ fontVariationSettings: '"opsz" 144' }}
              >
                Explora
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-chocolate/55">
                paquetes y combos
              </p>
            </Link>

            <Link
              to="/app/orders"
              className="group relative overflow-hidden rounded-[1.4rem] border border-chocolate/10 bg-cream p-5 transition-[transform,border-color] duration-300 ease-sunrise hover:-translate-y-0.5 hover:border-coral/40"
            >
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
                  Mis órdenes
                </p>
                <ArrowUpRight className="h-4 w-4 text-chocolate/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-coral" />
              </div>
              <p
                className="mt-7 font-heading text-3xl font-light italic leading-none text-chocolate"
                style={{ fontVariationSettings: '"opsz" 144' }}
              >
                Historial
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-chocolate/55">
                compras y comprobantes
              </p>
            </Link>
          </motion.section>

          {/* REST OF WEEK */}
          {restOfWeek.length > 0 ? (
            <motion.section
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.85, delay: 0.28, ease: easeBreath }}
            >
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
                    Esta semana
                  </p>
                  <h3 className="mt-2 font-heading text-2xl font-light leading-tight text-chocolate md:text-3xl">
                    Tus próximas{' '}
                    <span
                      className="italic text-coral"
                      style={{ fontVariationSettings: '"opsz" 144' }}
                    >
                      pausas.
                    </span>
                  </h3>
                </div>
                <Link
                  to="/app/classes"
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-coral hover:text-wine"
                >
                  Ver todas →
                </Link>
              </div>

              <ul className="overflow-hidden rounded-[1.6rem] border border-chocolate/10 bg-cream">
                {restOfWeek.map((cls, index) => (
                  <li
                    key={cls.booking_id}
                    className={`${index > 0 ? 'border-t border-chocolate/10' : ''}`}
                  >
                    <Link
                      to={`/app/classes/${cls.booking_id}`}
                      className="group grid grid-cols-[80px_1fr_auto] items-center gap-4 px-5 py-5 transition-colors duration-200 hover:bg-[#FAF1E6]"
                    >
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
                          {safeFormat(cls.date, 'EEE')}
                        </p>
                        <p className="mt-1 font-heading text-2xl font-light leading-none tabular-nums text-chocolate">
                          {cls.start_time.slice(0, 5)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-heading text-lg font-light leading-snug text-chocolate">
                          {cls.class_type_name}
                        </p>
                        <p className="mt-1 truncate text-[11px] uppercase tracking-[0.18em] text-chocolate/55">
                          {cls.instructor_name} · {safeFormat(cls.date, 'd MMM')}
                        </p>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-chocolate/35 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-coral" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.section>
          ) : null}

          {/* CLOSING QUOTE */}
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.36, ease: easeBreath }}
            className="relative overflow-hidden rounded-[1.8rem] bg-[#F4E7D4] px-7 py-14 text-center"
          >
            <div className="pointer-events-none absolute -bottom-10 left-1/2 h-[280px] w-[280px] -translate-x-1/2 text-coral/10">
              <SunGlyph className="h-full w-full" />
            </div>
            <p className="relative text-[10px] font-bold uppercase tracking-[0.32em] text-coral">
              Manifiesto
            </p>
            <blockquote
              className="relative mx-auto mt-6 max-w-2xl font-heading text-2xl font-light italic leading-snug text-chocolate md:text-3xl"
              style={{ fontVariationSettings: '"opsz" 144' }}
            >
              "El movimiento es una medicina para crear un cambio en los estados físicos, emocionales y mentales."
            </blockquote>
          </motion.section>
        </div>
      </ClientLayout>
    </AuthGuard>
  );
}
