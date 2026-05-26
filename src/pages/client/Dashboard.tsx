import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { safeFormat } from '@/lib/date';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { fetchMyMembership } from '@/lib/memberships';
import type { BookingClient } from '@/types/booking';
import type { ClientMembership } from '@/types/membership';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

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

export default function ClientDashboard() {
  const { user } = useAuthStore();

  const { data: membership, isLoading: membershipLoading } = useQuery<ClientMembership | null>({
    queryKey: ['my-membership'],
    queryFn: fetchMyMembership,
  });

  const isExpiredOrCancelled = membership?.status === 'expired' || membership?.status === 'cancelled';
  const isOutOfCredits =
    membership?.status === 'active' &&
    !!membership?.class_limit &&
    (membership?.classes_remaining ?? 0) <= 0;
  const hasActiveCredits =
    membership?.status === 'active' && !isOutOfCredits;

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
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return bookings
      .filter((b) => b.booking_status !== 'cancelled')
      .filter((b) => {
        const d = parseISO(b.date);
        return d >= today;
      })
      .sort((a, b) => {
        const da = parseISO(`${a.date}T${a.start_time}`);
        const db = parseISO(`${b.date}T${b.start_time}`);
        return da.getTime() - db.getTime();
      })
      .slice(0, 2);
  }, [bookings]);

  const membershipEnd = membership?.end_date ? parseISO(membership.end_date) : null;
  const daysRemaining = membershipEnd
    ? Math.max(differenceInCalendarDays(membershipEnd, new Date()), 0)
    : null;
  const classLimit = membership?.class_limit ?? null;
  const classesRemaining = membership?.classes_remaining ?? null;
  const pointsBalance = walletSummary?.pointsBalance ?? 0;

  // Decide which CTA + headline to show on the premium membership card.
  const card = (() => {
    if (membershipLoading) return null;
    if (!membership) {
      return {
        eyebrow: 'Premium Access',
        title: 'Tu Membresía',
        body: 'Activa tu plan para comenzar tu viaje de transformación y bienestar.',
        cta: { label: 'Comprar membresía', to: '/app/checkout', icon: 'arrow_forward' },
        badge: 'Sin membresía',
      };
    }
    if (isOutOfCredits) {
      return {
        eyebrow: 'Premium Access',
        title: `${membership.plan_name}`,
        body: `Agotaste tus ${membership.class_limit} clases. Compra más para seguir reservando${membership.end_date ? `. Vence el ${safeFormat(parseISO(membership.end_date), 'dd MMM yyyy')}` : '.'}`,
        cta: { label: 'Comprar más clases', to: '/app/checkout', icon: 'add' },
        badge: 'Sin créditos',
      };
    }
    if (isExpiredOrCancelled) {
      return {
        eyebrow: 'Premium Access',
        title: `${membership.plan_name}`,
        body: `Tu membresía ${membership.status === 'expired' ? 'venció' : 'fue cancelada'}${membership.end_date ? ` el ${safeFormat(parseISO(membership.end_date), 'dd MMM yyyy')}` : ''}. Renueva para seguir reservando.`,
        cta: { label: 'Renovar membresía', to: '/app/checkout', icon: 'refresh' },
        badge: statusLabel[membership.status],
      };
    }
    // Active + has credits
    return {
      eyebrow: 'Premium Access',
      title: membership.plan_name || 'Tu Membresía',
      body:
        classLimit && classesRemaining !== null
          ? `${classesRemaining} de ${classLimit} clases disponibles${daysRemaining !== null ? ` · ${daysRemaining} días restantes` : ''}.`
          : `Acceso ilimitado activo${daysRemaining !== null ? ` · ${daysRemaining} días restantes` : '.'}`,
      cta: { label: 'Reservar clase', to: '/app/book', icon: 'arrow_forward' },
      badge: 'Activa',
    };
  })();

  return (
    <AuthGuard requiredRoles={['client']}>
      <ClientLayout fab={{ to: '/app/book', label: 'Reservar clase', icon: 'add' }}>
        <div className="space-y-8">
          {/* Greeting */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-xs font-semibold text-coral tracking-[0.18em] uppercase mb-2">
              Bienvenido de vuelta
            </p>
            <h1 className="font-heading text-3xl md:text-4xl text-foreground">
              ¡Hola, {user?.display_name?.split(' ')[0] || 'bienvenido'}!
            </h1>
          </section>

          {/* Premium membership card — sunset gradient panel */}
          <section className="relative animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            <div className="relative bg-sunset text-cream rounded-[1.5rem] p-6 md:p-8 sunset-glow overflow-hidden">
              {/* Inner light & shadow blobs for depth */}
              <div className="pointer-events-none absolute -right-24 -top-24 w-72 h-72 rounded-full bg-cream/20 blur-3xl" />
              <div className="pointer-events-none absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-wine/40 blur-3xl" />
              <div className="relative z-10 space-y-6">
                {membershipLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-10 rounded-full bg-cream/20" />
                    <Skeleton className="h-7 w-48 bg-cream/20" />
                    <Skeleton className="h-4 w-3/4 bg-cream/20" />
                    <Skeleton className="h-12 w-full rounded-xl bg-cream/20" />
                  </div>
                ) : card ? (
                  <>
                    <div className="flex items-start justify-between">
                      <span
                        className="material-symbols-outlined text-cream text-4xl filled"
                        aria-hidden
                      >
                        spa
                      </span>
                      <span className="text-[11px] font-semibold tracking-[0.14em] uppercase bg-cream/20 backdrop-blur-sm px-3 py-1 rounded-full text-cream">
                        {card.badge}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h2 className="font-heading text-2xl md:text-3xl text-cream">{card.title}</h2>
                      <p className="text-sm md:text-base text-cream/85 leading-relaxed">{card.body}</p>
                    </div>
                    {hasActiveCredits && classLimit && classesRemaining !== null && (
                      <div className="space-y-2">
                        <div className="h-2 w-full rounded-full bg-cream/20 overflow-hidden">
                          <div
                            className="h-full bg-cream rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(0, Math.min(100, (classesRemaining / classLimit) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <Link
                      to={card.cta.to}
                      className="w-full bg-cream text-coral py-4 px-6 rounded-xl text-sm font-semibold tracking-wide hover:bg-blush active:scale-[0.98] transition-all duration-200 shadow-lg shadow-wine/30 flex items-center justify-center gap-2"
                    >
                      {card.cta.label}
                      <span className="material-symbols-outlined text-base">{card.cta.icon}</span>
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          </section>

          {/* Quick actions */}
          <section className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            <Link
              to="/app/book"
              className="flex flex-col items-center justify-center p-6 bg-card rounded-[1.5rem] hover:bg-cream/60 transition-colors group shadow-sm"
            >
              <div className="w-14 h-14 rounded-full bg-coral/15 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-coral text-[26px]">calendar_month</span>
              </div>
              <span className="text-sm font-semibold text-foreground tracking-wide">Reservar Clase</span>
            </Link>
            <Link
              to="/app/wallet"
              className="flex flex-col items-center justify-center p-6 bg-card rounded-[1.5rem] hover:bg-cream/60 transition-colors group shadow-sm"
            >
              <div className="w-14 h-14 rounded-full bg-amber/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-chocolate text-[26px]">account_balance_wallet</span>
              </div>
              <span className="text-sm font-semibold text-foreground tracking-wide">
                WalletClub <span className="text-foreground/50 font-normal">· {pointsBalance} pts</span>
              </span>
            </Link>
          </section>

          {/* Upcoming classes */}
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xl md:text-2xl text-foreground">Próximas Clases</h3>
              <Link to="/app/classes" className="text-xs font-semibold text-coral tracking-[0.18em] uppercase hover:opacity-80">
                Ver todas
              </Link>
            </div>

            {bookingsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            ) : upcomingClasses.length > 0 ? (
              <div className="space-y-3">
                {upcomingClasses.map((cls) => (
                  <Link
                    key={cls.booking_id}
                    to={`/app/classes/${cls.booking_id}`}
                    className="flex items-center justify-between p-4 rounded-2xl bg-card hover:bg-cream/60 transition-all duration-200 hover:-translate-y-0.5 shadow-sm group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: cls.class_type_color
                            ? `${cls.class_type_color}22`
                            : 'hsl(var(--primary) / 0.15)',
                        }}
                      >
                        <span
                          className="material-symbols-outlined text-[22px]"
                          style={{ color: cls.class_type_color || 'hsl(var(--primary))' }}
                        >
                          calendar_month
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{cls.class_type_name}</p>
                        <p className="text-xs text-foreground/60 mt-0.5">
                          {safeFormat(cls.date, 'EEE d MMM')} · {cls.start_time.slice(0, 5)} · {cls.instructor_name}
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-foreground/40 group-hover:text-coral transition-colors">
                      chevron_right
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border/30 rounded-[1.5rem] p-10 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
                  <span className="material-symbols-outlined text-foreground/40 text-3xl">event_busy</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground/80">No tienes clases próximas</p>
                  <p className="text-xs text-foreground/50">Es el momento perfecto para agendar tu próxima sesión.</p>
                </div>
                <Link
                  to="/app/book"
                  className="text-coral font-semibold text-sm border-b-2 border-coral/20 pb-1 hover:border-coral transition-all"
                >
                  Reservar ahora
                </Link>
              </div>
            )}
          </section>

          {/* Editorial atmosphere */}
          <section className="py-6 text-center animate-in fade-in duration-1000 delay-500">
            <p className="italic text-foreground/45 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
              "El movimiento es una medicina para crear un cambio en los estados físicos, emocionales y mentales."
            </p>
          </section>
        </div>
      </ClientLayout>
    </AuthGuard>
  );
}
