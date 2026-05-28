import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import api from '@/lib/api';
import type { AdminStats, Membership } from '@/types/auth';
import type { Order } from '@/types/order';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ArrowUpRight,
    Banknote,
    Cake,
    CheckCircle2,
    Receipt,
    Ticket,
    UserPlus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { safeFormat } from '@/lib/date';

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

type MembershipStatus = Membership['status'];

const statusCopy: Record<MembershipStatus, { label: string; tone: 'good' | 'warn' | 'mute' }> = {
    active: { label: 'Activa', tone: 'good' },
    pending_payment: { label: 'Pendiente pago', tone: 'warn' },
    pending_activation: { label: 'Pendiente activación', tone: 'warn' },
    expired: { label: 'Vencida', tone: 'mute' },
    cancelled: { label: 'Cancelada', tone: 'mute' },
    paused: { label: 'Pausada', tone: 'mute' },
};

export default function AdminDashboard() {
    const { user } = useAuthStore();
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), 60_000);
        return () => window.clearInterval(id);
    }, []);

    const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
        queryKey: ['admin-stats'],
        queryFn: async () => (await api.get('/admin/stats')).data,
    });

    const { data: memberships, isLoading: membershipsLoading } = useQuery<Membership[]>({
        queryKey: ['recent-memberships'],
        queryFn: async () => (await api.get('/memberships')).data,
    });

    const { data: pendingOrders, isLoading: ordersLoading } = useQuery<Order[]>({
        queryKey: ['pending-orders'],
        queryFn: async () => (await api.get('/orders/pending')).data,
    });

    const { data: pendingEventRegs = [] } = useQuery<any[]>({
        queryKey: ['pending-event-registrations'],
        queryFn: async () => (await api.get('/events/registrations/pending')).data,
    });

    const { data: birthdays = [] } = useQuery<any[]>({
        queryKey: ['admin-birthdays'],
        queryFn: async () => (await api.get('/admin/birthdays')).data,
    });

    const recentMemberships = memberships?.slice(0, 5) || [];
    const pendingMemberships =
        memberships?.filter(
            (m) => m.status === 'pending_payment' || m.status === 'pending_activation'
        ).length || 0;
    const pendingVerificationOrders =
        pendingOrders?.filter(
            (o) => o.status === 'pending_verification' || o.status === 'pending_payment'
        ) || [];

    const firstName = user?.display_name?.split(' ')[0] || 'Admin';
    const dateString = safeFormat(now, "EEEE d 'de' MMMM, yyyy");
    const timeString = now.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    const greetingEyebrow = (() => {
        const h = now.getHours();
        if (h < 11) return 'Buenos días';
        if (h < 19) return 'Buenas tardes';
        return 'Buenas noches';
    })();

    const pulse = [
        {
            label: 'Clases hoy',
            value: stats?.scheduledClasses ?? 0,
            subtitle: 'programadas',
        },
        {
            label: 'Reservas',
            value: stats?.confirmedBookings ?? 0,
            subtitle: 'confirmadas',
        },
        {
            label: 'Miembros',
            value: stats?.activeMemberships ?? 0,
            subtitle: 'activos',
        },
        {
            label: 'Ingresos hoy',
            value: `$${(stats?.revenue ?? 0).toLocaleString()}`,
            subtitle: 'MXN',
        },
    ];

    return (
        <AuthGuard requiredRoles={['admin', 'instructor']}>
            <AdminLayout>
                <div className="space-y-8">
                    {/* HERO — welcome with coral glow */}
                    <section className="relative isolate overflow-hidden rounded-[1.8rem] shadow-[0_40px_100px_-50px_hsla(13,66%,28%,0.45)]">
                        <div className="absolute inset-0 -z-10 bg-orange-glow" />
                        <div className="orange-grain -z-10" />
                        <div className="pointer-events-none absolute -right-20 -top-24 -z-10 h-[320px] w-[320px] text-cream/15">
                            <SunGlyph className="h-full w-full" />
                        </div>

                        <div className="relative grid gap-6 p-6 text-cream sm:p-8 md:grid-cols-[1.2fr_0.8fr] md:items-end md:gap-10">
                            <div>
                                <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.24em] text-cream">
                                    <span className="inline-flex items-center gap-2">
                                        <span className="h-px w-6 bg-cream" />
                                        Panel de control
                                    </span>
                                    <span className="text-cream/45">·</span>
                                    <span className="text-cream/85">{greetingEyebrow}</span>
                                </div>
                                <h1 className="mt-4 font-heading text-[clamp(2rem,4.6vw,3.6rem)] font-light leading-[0.95] tracking-[-0.015em] text-cream drop-shadow-[0_2px_18px_hsla(0,100%,18%,0.35)]">
                                    <span
                                        className="italic text-cream"
                                        style={{ fontVariationSettings: '"opsz" 144' }}
                                    >
                                        Hola,
                                    </span>{' '}
                                    {firstName}.
                                </h1>
                                <p className="mt-3 text-sm uppercase tracking-[0.18em] text-cream/85">
                                    {dateString}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.2rem] bg-cream/25 md:justify-self-end">
                                <div className="bg-wine/55 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cream/80">
                                        Cabo
                                    </p>
                                    <p className="mt-2 font-heading text-2xl tabular-nums text-cream">
                                        {timeString}
                                    </p>
                                </div>
                                <div className="bg-wine/55 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cream/80">
                                        Estatus
                                    </p>
                                    <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-cream">
                                        <span className="relative flex h-2 w-2">
                                            <span className="absolute inset-0 animate-ping rounded-full bg-cream/70" />
                                            <span className="relative h-2 w-2 rounded-full bg-cream" />
                                        </span>
                                        Abierto
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ALERTS */}
                    {(pendingVerificationOrders.length > 0 || pendingMemberships > 0) && (
                        <div className="grid gap-3 md:grid-cols-2">
                            {pendingVerificationOrders.length > 0 && (
                                <Link
                                    to="/admin/orders"
                                    className="group flex items-center justify-between gap-4 rounded-[1.2rem] border border-coral/35 bg-coral/8 p-4 transition-[border-color,background-color] duration-200 ease-sunrise hover:border-coral hover:bg-coral/15"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-coral text-cream">
                                            <Banknote className="h-5 w-5" strokeWidth={1.6} />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-chocolate">
                                                {pendingVerificationOrders.length} pago
                                                {pendingVerificationOrders.length > 1 ? 's' : ''} por verificar
                                            </p>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-chocolate/55">
                                                Revisar y aprobar
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-coral transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </Link>
                            )}

                            {pendingMemberships > 0 && (
                                <Link
                                    to="/admin/memberships/pending"
                                    className="group flex items-center justify-between gap-4 rounded-[1.2rem] border border-amber/45 bg-amber/12 p-4 transition-[border-color,background-color] duration-200 ease-sunrise hover:border-amber hover:bg-amber/22"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber text-chocolate">
                                            <UserPlus className="h-5 w-5" strokeWidth={1.6} />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-chocolate">
                                                {pendingMemberships} membresía
                                                {pendingMemberships > 1 ? 's' : ''} requieren atención
                                            </p>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-chocolate/55">
                                                Activar o cobrar
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-amber-700 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </Link>
                            )}
                        </div>
                    )}

                    {/* PULSE — horizontal at-a-glance row, no card wrappers */}
                    <section
                        aria-label="Pulso del día"
                        className="overflow-hidden rounded-[1.4rem] border border-chocolate/12 bg-cream"
                    >
                        <div className="flex items-center justify-between border-b border-chocolate/10 bg-[#FAF1E6] px-5 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-coral">
                                Pulso de hoy
                            </p>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-chocolate/45">
                                actualiza en vivo
                            </p>
                        </div>
                        <div className="grid grid-cols-2 divide-chocolate/10 lg:grid-cols-4 lg:divide-x">
                            {pulse.map((m, i) => (
                                <div
                                    key={m.label}
                                    className={`flex flex-col gap-2 px-5 py-6 ${
                                        i < 2 ? 'border-b border-chocolate/10 lg:border-b-0' : ''
                                    } ${i === 0 ? 'border-r border-chocolate/10 lg:border-r-0' : ''} ${
                                        i === 2 ? 'border-r border-chocolate/10 lg:border-r-0' : ''
                                    }`}
                                >
                                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
                                        {m.label}
                                    </p>
                                    {statsLoading ? (
                                        <Skeleton className="h-10 w-20" />
                                    ) : (
                                        <p className="font-heading text-4xl font-light leading-none tabular-nums text-chocolate md:text-5xl">
                                            {m.value}
                                        </p>
                                    )}
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-chocolate/55">
                                        {m.subtitle}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* TWO PANELS — Memberships + Pending payments */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Recent memberships */}
                        <section className="overflow-hidden rounded-[1.4rem] border border-chocolate/12 bg-cream">
                            <div className="flex items-end justify-between border-b border-chocolate/10 px-6 py-5">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
                                        Membresías recientes
                                    </p>
                                    <h3 className="mt-2 font-heading text-2xl font-light leading-tight text-chocolate">
                                        Últimas{' '}
                                        <span
                                            className="italic text-coral"
                                            style={{ fontVariationSettings: '"opsz" 144' }}
                                        >
                                            asignaciones.
                                        </span>
                                    </h3>
                                </div>
                                <Link
                                    to="/admin/memberships"
                                    className="text-[11px] font-semibold uppercase tracking-[0.18em] text-coral hover:text-wine"
                                >
                                    Ver todas
                                </Link>
                            </div>

                            <div>
                                {membershipsLoading ? (
                                    <div className="space-y-3 p-6">
                                        {Array(3)
                                            .fill(0)
                                            .map((_, i) => (
                                                <div key={i} className="flex items-center gap-4">
                                                    <Skeleton className="h-10 w-10 rounded-full" />
                                                    <div className="flex-1 space-y-2">
                                                        <Skeleton className="h-4 w-40" />
                                                        <Skeleton className="h-3 w-24" />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                ) : recentMemberships.length > 0 ? (
                                    <ul className="divide-y divide-chocolate/10">
                                        {recentMemberships.map((membership) => {
                                            const sc = statusCopy[membership.status] ?? {
                                                label: membership.status,
                                                tone: 'mute' as const,
                                            };
                                            const toneClass =
                                                sc.tone === 'good'
                                                    ? 'text-emerald-700 bg-emerald-100/60'
                                                    : sc.tone === 'warn'
                                                      ? 'text-coral bg-coral/12'
                                                      : 'text-chocolate/55 bg-chocolate/8';
                                            return (
                                                <li
                                                    key={membership.id}
                                                    className="flex items-center gap-4 px-6 py-4 transition-colors duration-200 hover:bg-[#FAF1E6]"
                                                >
                                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/25 text-amber-800">
                                                        <UserPlus className="h-4 w-4" strokeWidth={1.7} />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-heading text-base font-light text-chocolate">
                                                            {membership.user_name}
                                                        </p>
                                                        <p className="mt-0.5 truncate text-[11px] uppercase tracking-[0.16em] text-chocolate/55">
                                                            {membership.plan_name}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${toneClass}`}
                                                    >
                                                        {sc.label}
                                                    </span>
                                                    <span className="hidden text-[10px] tabular-nums text-chocolate/40 md:inline">
                                                        {safeFormat(membership.created_at, 'd MMM')}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <EmptyPanel
                                        title="Sin actividad reciente"
                                        copy="Las nuevas asignaciones de membresía aparecerán aquí."
                                    />
                                )}
                            </div>
                        </section>

                        {/* Pending payments */}
                        <section className="overflow-hidden rounded-[1.4rem] border border-chocolate/12 bg-cream">
                            <div className="flex items-end justify-between border-b border-chocolate/10 px-6 py-5">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
                                        Pagos pendientes
                                    </p>
                                    <h3 className="mt-2 font-heading text-2xl font-light leading-tight text-chocolate">
                                        Por{' '}
                                        <span
                                            className="italic text-coral"
                                            style={{ fontVariationSettings: '"opsz" 144' }}
                                        >
                                            verificar o cobrar.
                                        </span>
                                    </h3>
                                </div>
                                <Link
                                    to="/admin/orders"
                                    className="text-[11px] font-semibold uppercase tracking-[0.18em] text-coral hover:text-wine"
                                >
                                    Ver todos
                                </Link>
                            </div>

                            <div>
                                {ordersLoading ? (
                                    <div className="space-y-3 p-6">
                                        {Array(3)
                                            .fill(0)
                                            .map((_, i) => (
                                                <div key={i} className="flex items-center gap-4">
                                                    <Skeleton className="h-10 w-10 rounded-full" />
                                                    <div className="flex-1 space-y-2">
                                                        <Skeleton className="h-4 w-40" />
                                                        <Skeleton className="h-3 w-24" />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                ) : pendingVerificationOrders.length > 0 || pendingEventRegs.length > 0 ? (
                                    <ul className="divide-y divide-chocolate/10">
                                        {pendingVerificationOrders.slice(0, 5).map((order) => (
                                            <li key={order.id}>
                                                <Link
                                                    to="/admin/orders"
                                                    className="group flex items-center gap-4 px-6 py-4 transition-colors duration-200 hover:bg-[#FAF1E6]"
                                                >
                                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-coral/15 text-coral">
                                                        <Receipt className="h-4 w-4" strokeWidth={1.7} />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-heading text-base font-light text-chocolate transition-colors group-hover:text-coral">
                                                            {order.user_name}
                                                        </p>
                                                        <p className="mt-0.5 truncate text-[11px] uppercase tracking-[0.16em] text-chocolate/55">
                                                            {order.plan_name}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-heading text-base tabular-nums text-chocolate">
                                                            ${Number(order.total).toLocaleString()}
                                                        </p>
                                                        <p className="text-[10px] uppercase tracking-[0.16em] text-coral">
                                                            {order.status === 'pending_verification'
                                                                ? 'Verificar'
                                                                : 'Por cobrar'}
                                                        </p>
                                                    </div>
                                                    <ArrowUpRight className="h-4 w-4 text-chocolate/35 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-coral" />
                                                </Link>
                                            </li>
                                        ))}
                                        {pendingEventRegs.slice(0, 5).map((reg: any) => (
                                            <li key={reg.id}>
                                                <Link
                                                    to="/admin/events"
                                                    className="group flex items-center gap-4 px-6 py-4 transition-colors duration-200 hover:bg-[#FAF1E6]"
                                                >
                                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/25 text-amber-800">
                                                        <Ticket className="h-4 w-4" strokeWidth={1.7} />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-heading text-base font-light text-chocolate transition-colors group-hover:text-coral">
                                                            {reg.user_name}
                                                        </p>
                                                        <p className="mt-0.5 truncate text-[11px] uppercase tracking-[0.16em] text-chocolate/55">
                                                            {reg.event_title}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-heading text-base tabular-nums text-chocolate">
                                                            ${Number(reg.amount).toLocaleString()}
                                                        </p>
                                                        <p className="text-[10px] uppercase tracking-[0.16em] text-amber-700">
                                                            Evento
                                                        </p>
                                                    </div>
                                                    <ArrowUpRight className="h-4 w-4 text-chocolate/35 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-coral" />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                                        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-coral/12 text-coral">
                                            <CheckCircle2 className="h-6 w-6" strokeWidth={1.6} />
                                        </span>
                                        <p className="font-heading text-xl font-light italic text-chocolate">
                                            Todo al día.
                                        </p>
                                        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-chocolate/55">
                                            Sin pagos por verificar
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* BIRTHDAYS — brand-colored */}
                    {birthdays.length > 0 && (
                        <section className="overflow-hidden rounded-[1.4rem] border border-chocolate/12 bg-cream">
                            <div className="flex items-center justify-between border-b border-chocolate/10 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-coral/15 text-coral">
                                        <Cake className="h-4 w-4" strokeWidth={1.7} />
                                    </span>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
                                            Cumpleaños del mes
                                        </p>
                                        <h3 className="mt-1 font-heading text-xl font-light leading-tight text-chocolate">
                                            {birthdays.length}{' '}
                                            <span
                                                className="italic text-coral"
                                                style={{ fontVariationSettings: '"opsz" 144' }}
                                            >
                                                clientas.
                                            </span>
                                        </h3>
                                    </div>
                                </div>
                            </div>
                            <ul className="grid gap-px bg-chocolate/10 sm:grid-cols-2 lg:grid-cols-3">
                                {birthdays.map((b: any) => {
                                    const bday = new Date(b.date_of_birth);
                                    const day = bday.getUTCDate();
                                    const today = now;
                                    const isToday = day === today.getDate();
                                    const isPast = day < today.getDate();

                                    return (
                                        <li key={b.id} className="bg-cream">
                                            <Link
                                                to={`/admin/members/${b.id}`}
                                                className={`group flex items-center gap-4 px-5 py-4 transition-colors duration-200 ${
                                                    isToday
                                                        ? 'bg-coral text-cream hover:bg-wine'
                                                        : isPast
                                                          ? 'opacity-60 hover:bg-[#FAF1E6]'
                                                          : 'hover:bg-[#FAF1E6]'
                                                }`}
                                            >
                                                <span
                                                    className={`flex h-10 w-10 items-center justify-center rounded-full font-heading text-base tabular-nums ${
                                                        isToday
                                                            ? 'bg-cream text-coral'
                                                            : 'bg-coral/12 text-coral'
                                                    }`}
                                                >
                                                    {day}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p
                                                        className={`truncate font-heading text-base font-light ${
                                                            isToday ? 'text-cream' : 'text-chocolate'
                                                        }`}
                                                    >
                                                        {b.display_name}
                                                    </p>
                                                    <p
                                                        className={`mt-0.5 truncate text-[11px] uppercase tracking-[0.16em] ${
                                                            isToday ? 'text-amber' : 'text-chocolate/55'
                                                        }`}
                                                    >
                                                        {isToday
                                                            ? 'Hoy cumple años'
                                                            : `${day} de ${safeFormat(bday, 'MMMM')}`}
                                                    </p>
                                                </div>
                                                <ArrowUpRight
                                                    className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                                                        isToday ? 'text-cream' : 'text-chocolate/35'
                                                    }`}
                                                />
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    )}
                </div>
            </AdminLayout>
        </AuthGuard>
    );
}

function EmptyPanel({ title, copy }: { title: string; copy: string }) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber/20 text-amber-800">
                <SunGlyph className="h-6 w-6" />
            </span>
            <p className="font-heading text-xl font-light italic text-chocolate">{title}</p>
            <p className="mt-2 max-w-xs text-[11px] uppercase tracking-[0.18em] text-chocolate/55">
                {copy}
            </p>
        </div>
    );
}
