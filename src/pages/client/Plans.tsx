import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Plan {
    id: string;
    name: string;
    price: number;
    duration_days: number;
    class_limit: number | null;
    description?: string;
    features?: string[];
    is_active: boolean;
    sort_order: number;
}

/**
 * Group definitions — the 3 buckets the studio offers.
 * Group A: Sculpt-Funcional + Yoga.
 * Group B: Surf-Pilates + Yoga.
 * Group C: Mixto (the 3 types).
 */
type GroupKey = 'A' | 'B' | 'C';
interface GroupDef {
    key: GroupKey;
    eyebrow: string;
    name: string;
    tagline: string;
    includes: string[];
    /** Filenames in the seed file mapped to this group, used to pick which plans belong here. */
    planNames: string[];
    recommended?: boolean;
}

const GROUPS: GroupDef[] = [
    {
        key: 'A',
        eyebrow: 'Iniciación',
        name: 'Sunrise & Yoga',
        tagline: 'Sculpt-Funcional + Yoga. Para empezar tu ritmo.',
        includes: ['Acceso Sculpt-Funcional', 'Acceso Yoga', 'Vigencia 30 días'],
        planNames: ['Sunrise Pack', 'Golden Hour', 'Sunset Flow', 'Full Day Experience'],
    },
    {
        key: 'C',
        eyebrow: 'Mixto · Recomendado',
        name: 'Full Sunrise Sunset',
        tagline: 'Los 3 tipos con composición exacta por paquete.',
        includes: ['Sculpt-Funcional, Surf-Pilates y Yoga', 'Composición fija por paquete', 'Vigencia 30 días'],
        planNames: ['Balanced Flow', 'Elevate Experience', 'Full Experience', 'Sunrise Sunset Combo'],
        recommended: true,
    },
    {
        key: 'B',
        eyebrow: 'Surf vibes',
        name: 'Wave & Yoga',
        tagline: 'Surf-Pilates + Yoga. Fluido, costero, fuerte.',
        includes: ['Acceso Surf-Pilates', 'Acceso Yoga', 'Vigencia 30 días'],
        planNames: ['Wave Starter', 'Ocean Flow', 'Deep Flow', 'Endless Waves'],
    },
];

function priceRange(plans: Plan[]): { from: number; to: number; hasUnlimited: boolean } {
    if (plans.length === 0) return { from: 0, to: 0, hasUnlimited: false };
    const sorted = [...plans].sort((a, b) => a.price - b.price);
    return {
        from: sorted[0].price,
        to: sorted[sorted.length - 1].price,
        hasUnlimited: sorted.some((p) => p.class_limit === null),
    };
}

const mxn = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function Plans() {
    const { data: plans, isLoading } = useQuery<Plan[]>({
        queryKey: ['plans-all'],
        queryFn: async () => {
            const { data } = await api.get('/plans');
            return Array.isArray(data) ? data.filter((p) => p.is_active) : [];
        },
    });

    const grouped = useMemo(() => {
        const map = new Map<GroupKey, Plan[]>(GROUPS.map((g) => [g.key, []]));
        (plans || []).forEach((p) => {
            for (const g of GROUPS) {
                if (g.planNames.includes(p.name)) {
                    map.get(g.key)!.push(p);
                    return;
                }
            }
        });
        return map;
    }, [plans]);

    return (
        <AuthGuard requiredRoles={['client']}>
            <ClientLayout>
                <div className="space-y-12">
                    {/* Header */}
                    <section className="text-center md:text-left max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <p className="text-xs font-semibold text-coral tracking-[0.18em] uppercase mb-3">
                            Membresías
                        </p>
                        <h1 className="font-heading text-4xl md:text-5xl text-foreground leading-tight mb-4">
                            Encuentra tu ritmo.
                        </h1>
                        <p className="text-base md:text-lg text-foreground/65 leading-relaxed">
                            Diseñadas para elevar tu práctica. Elige el grupo que resuene con tu estilo y únete al
                            studio.
                        </p>
                    </section>

                    {/* 3-group pricing grid */}
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 lg:items-center animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
                        {isLoading && (
                            <>
                                <Skeleton className="h-[420px] rounded-[1.5rem]" />
                                <Skeleton className="h-[460px] rounded-[1.5rem]" />
                                <Skeleton className="h-[420px] rounded-[1.5rem]" />
                            </>
                        )}
                        {!isLoading &&
                            GROUPS.map((g) => {
                                const groupPlans = grouped.get(g.key) || [];
                                const range = priceRange(groupPlans);
                                const recommended = g.recommended;

                                return (
                                    <article
                                        key={g.key}
                                        className={cn(
                                            'relative rounded-[1.5rem] p-8 flex flex-col h-full transition-all duration-300 hover:-translate-y-2',
                                            recommended
                                                ? 'bg-coral text-cream shadow-2xl shadow-coral/30 ring-4 ring-coral/20 lg:scale-[1.04] z-10'
                                                : 'bg-card text-foreground shadow-sm hover:shadow-md'
                                        )}
                                    >
                                        {recommended && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-chocolate text-cream text-[11px] font-semibold tracking-[0.18em] uppercase px-5 py-2 rounded-full shadow-lg">
                                                Recomendado
                                            </div>
                                        )}

                                        <div className="mb-6">
                                            <span
                                                className={cn(
                                                    'inline-block text-[11px] font-semibold tracking-[0.14em] uppercase px-3 py-1 rounded-full border',
                                                    recommended
                                                        ? 'border-cream/30 text-cream/90'
                                                        : 'border-foreground/15 text-foreground/60 bg-cream/50'
                                                )}
                                            >
                                                {g.eyebrow}
                                            </span>
                                            <h2
                                                className={cn(
                                                    'font-heading mt-4 mb-2 text-3xl',
                                                    recommended ? 'text-cream' : 'text-coral'
                                                )}
                                            >
                                                {g.name}
                                            </h2>
                                            <p className={cn(
                                                'text-sm leading-relaxed',
                                                recommended ? 'text-cream/80' : 'text-foreground/65'
                                            )}>
                                                {g.tagline}
                                            </p>
                                        </div>

                                        <div className="mb-8">
                                            {groupPlans.length > 0 ? (
                                                <div className="flex items-baseline gap-2">
                                                    <span className={cn(
                                                        'text-xs font-medium',
                                                        recommended ? 'text-cream/70' : 'text-foreground/50'
                                                    )}>
                                                        Desde
                                                    </span>
                                                    <span className={cn(
                                                        'font-heading text-4xl md:text-5xl',
                                                        recommended ? 'text-cream' : 'text-foreground'
                                                    )}>
                                                        {mxn(range.from)}
                                                    </span>
                                                    <span className={cn(
                                                        'text-sm',
                                                        recommended ? 'text-cream/70' : 'text-foreground/55'
                                                    )}>
                                                        / mes
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className={cn(
                                                    'text-sm',
                                                    recommended ? 'text-cream/70' : 'text-foreground/55'
                                                )}>
                                                    Sin paquetes activos
                                                </span>
                                            )}
                                            {groupPlans.length > 0 && range.from !== range.to && (
                                                <p className={cn(
                                                    'text-xs mt-1',
                                                    recommended ? 'text-cream/60' : 'text-foreground/50'
                                                )}>
                                                    Hasta {mxn(range.to)} {range.hasUnlimited ? '· ilimitadas' : ''}
                                                </p>
                                            )}
                                        </div>

                                        <ul className="space-y-3 mb-10 flex-grow">
                                            {g.includes.map((inc) => (
                                                <li key={inc} className="flex items-center gap-3">
                                                    <span
                                                        className={cn(
                                                            'material-symbols-outlined text-[20px]',
                                                            recommended ? 'text-cream filled' : 'text-coral'
                                                        )}
                                                    >
                                                        {recommended ? 'verified' : 'check_circle'}
                                                    </span>
                                                    <span className={cn(
                                                        'text-sm',
                                                        recommended ? 'text-cream/90' : 'text-foreground/75'
                                                    )}>
                                                        {inc}
                                                    </span>
                                                </li>
                                            ))}
                                            {groupPlans.length > 0 && (
                                                <li className="flex items-center gap-3 pt-2 border-t border-dashed border-current/15">
                                                    <span className={cn(
                                                        'material-symbols-outlined text-[20px]',
                                                        recommended ? 'text-cream filled' : 'text-coral'
                                                    )}>
                                                        {recommended ? 'verified' : 'check_circle'}
                                                    </span>
                                                    <span className={cn(
                                                        'text-sm font-medium',
                                                        recommended ? 'text-cream' : 'text-foreground'
                                                    )}>
                                                        {groupPlans.length} paquete{groupPlans.length !== 1 ? 's' : ''} disponibles
                                                    </span>
                                                </li>
                                            )}
                                        </ul>

                                        <Link
                                            to="/app/checkout"
                                            className={cn(
                                                'w-full text-center py-4 px-6 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] inline-flex items-center justify-center gap-2',
                                                recommended
                                                    ? 'bg-chocolate text-cream hover:opacity-90 shadow-xl'
                                                    : 'bg-transparent border-2 border-coral text-coral hover:bg-coral hover:text-cream'
                                            )}
                                        >
                                            Ver opciones
                                            <span className="material-symbols-outlined text-base">arrow_forward</span>
                                        </Link>
                                    </article>
                                );
                            })}
                    </section>

                    {/* Cómo funciona — sustituye la sección de "Equipamiento" del mockup, que no aplica aquí */}
                    <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        <h2 className="font-heading text-2xl md:text-3xl text-foreground mb-6">
                            Cómo funciona tu membresía
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                {
                                    icon: 'shopping_bag',
                                    title: 'Elige y compra',
                                    body: 'Selecciona el grupo y el número de clases que vas a tomar este mes.',
                                },
                                {
                                    icon: 'calendar_month',
                                    title: 'Reserva tu clase',
                                    body: 'Desde la app, aparta tu lugar con anticipación. Sin filas, sin estrés.',
                                },
                                {
                                    icon: 'spa',
                                    title: 'Vive el studio',
                                    body: 'Movimiento consciente, energía y comunidad en cada sesión.',
                                },
                            ].map((step, i) => (
                                <div key={step.title} className="bg-card rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="w-10 h-10 rounded-full bg-coral/15 flex items-center justify-center text-coral">
                                            <span className="material-symbols-outlined text-[22px]">{step.icon}</span>
                                        </span>
                                        <span className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground/45">
                                            Paso {i + 1}
                                        </span>
                                    </div>
                                    <h3 className="font-heading text-lg text-foreground mb-1">{step.title}</h3>
                                    <p className="text-sm text-foreground/65 leading-relaxed">{step.body}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Inscripción note */}
                    <section className="animate-in fade-in duration-1000 delay-300">
                        <div className="rounded-2xl bg-blush border border-rose/20 p-6 md:p-8 flex items-start gap-4">
                            <span className="material-symbols-outlined text-coral text-3xl mt-1">
                                redeem
                            </span>
                            <div>
                                <h3 className="font-heading text-xl text-foreground mb-2">
                                    Pago de inscripción: $500 MXN
                                </h3>
                                <p className="text-sm text-foreground/70 leading-relaxed">
                                    Pago único de membresía. Si te inscribes el mismo día que tomas tu clase muestra, el costo
                                    de la clase muestra ($300) se descuenta de tu inscripción.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </ClientLayout>
        </AuthGuard>
    );
}
