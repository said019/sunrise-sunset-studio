import { useMutation, useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import api, { getErrorMessage } from '@/lib/api';
import { safeFormat } from '@/lib/date';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

interface WalletPassResponse {
    memberName: string;
    memberSince: string | null;
    planName: string | null;
    membershipStatus: string | null;
    membershipId: string | null;
    expirationDate: string | null;
    classesRemaining: number | null;
    pointsBalance: number;
    qrPayload: string;
    walletPasses: Array<{ platform: string; serial_number: string }>;
    canDownloadPass: boolean;
}
interface ApplePassResponse { downloadUrl?: string; message?: string }
interface GooglePassResponse { saveUrl?: string; message?: string }

interface LoyaltyReward {
    id: string;
    name: string;
    description: string | null;
    points_cost: number;
    reward_type: string;
    reward_value: string | null;
    is_active: boolean;
    stock: number | null;
}

const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return format(parsed, 'dd MMM yyyy');
};

export default function WalletClub() {
    const { toast } = useToast();

    const { data, isLoading, isError } = useQuery<WalletPassResponse>({
        queryKey: ['wallet-pass'],
        queryFn: async () => (await api.get('/wallet/pass')).data,
        retry: false,
    });

    const { data: loyaltyData } = useQuery<{
        history: Array<{
            id: string;
            points: number;
            type: string;
            description: string;
            created_at: string;
            class_name: string | null;
        }>;
        totalPoints: number;
    }>({
        queryKey: ['loyalty-history'],
        queryFn: async () => (await api.get('/loyalty/my-history')).data,
        retry: false,
    });

    const { data: rewards, isLoading: rewardsLoading } = useQuery<LoyaltyReward[]>({
        queryKey: ['loyalty-rewards'],
        queryFn: async () => (await api.get('/loyalty/rewards')).data,
        retry: false,
    });

    const recentActivity = (loyaltyData?.history || []).slice(0, 3);
    const activeRewards = (rewards || [])
        .filter((r) => r.is_active && (r.stock === null || r.stock > 0))
        .slice(0, 3);

    const hasMembership = Boolean(data?.membershipId);
    const canDownloadPass = data?.canDownloadPass ?? false;
    const pointsBalance = data?.pointsBalance ?? loyaltyData?.totalPoints ?? 0;
    // We treat "no membership yet" as an intentional empty state, NOT an error.
    // 401 (session expired) is handled at the api interceptor layer.
    const noMembership = !isLoading && (!data || !hasMembership || isError);

    const formatActivityDate = (dateStr: string) => {
        try {
            const date = parseISO(dateStr);
            const now = new Date();
            const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
            if (diff === 0) return 'Hoy';
            if (diff === 1) return 'Ayer';
            return safeFormat(date, 'd MMM');
        } catch {
            return '';
        }
    };

    const getActivityLabel = (item: { type: string; description: string; class_name: string | null }) => {
        if (item.description?.startsWith('Puntos por pago #')) return 'Compra de membresía';
        if (item.class_name) return `Clase: ${item.class_name}`;
        if (item.type === 'bonus') return item.description || 'Bono';
        if (item.type === 'redemption') return item.description || 'Canje';
        return item.description || 'Puntos';
    };

    const getRewardIcon = (type: string) => {
        const icons: Record<string, string> = {
            discount: 'savings',
            free_class: 'redeem',
            product: 'shopping_bag',
            membership_extension: 'star',
        };
        return icons[type] || 'auto_awesome';
    };

    const applePassMutation = useMutation({
        mutationFn: async () => (await api.post<ApplePassResponse>('/wallet/pass/apple')).data,
        onSuccess: (r) => {
            if (r.downloadUrl) { window.location.assign(r.downloadUrl); return; }
            toast({ title: 'Pase en preparación', description: r.message || 'Te avisaremos cuando esté listo.' });
        },
        onError: (e) => toast({ variant: 'destructive', title: 'No pudimos generar tu pase', description: getErrorMessage(e) }),
    });

    const googlePassMutation = useMutation({
        mutationFn: async () => (await api.post<GooglePassResponse>('/wallet/pass/google')).data,
        onSuccess: (r) => {
            if (r.saveUrl) { window.open(r.saveUrl, '_blank', 'noopener,noreferrer'); return; }
            toast({ title: 'Pase en preparación', description: r.message || 'Te avisaremos cuando esté listo.' });
        },
        onError: (e) => toast({ variant: 'destructive', title: 'No pudimos generar tu pase', description: getErrorMessage(e) }),
    });

    return (
        <AuthGuard requiredRoles={['client']}>
            <ClientLayout>
                <div className="relative space-y-8 pb-8">
                    {/* Decorative sunset blob — softens the page background */}
                    <div
                        aria-hidden
                        className="bg-sunset-blob absolute -top-20 right-0 left-0 h-64 -z-10 blur-3xl opacity-50 pointer-events-none"
                    />

                    {/* Header */}
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <p className="text-xs font-semibold text-coral tracking-[0.18em] uppercase mb-2">
                            WalletClub
                        </p>
                        <h1 className="font-heading text-3xl md:text-4xl text-foreground leading-tight">
                            Tu pase, tus puntos.
                        </h1>
                        <p className="text-foreground/65 mt-2 max-w-md">
                            Membresía, check-in QR, recompensas — todo en un solo lugar.
                        </p>
                    </section>

                    {/* Pass card + add-to-wallet panel */}
                    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
                        {/* Pass card with sunset gradient */}
                        <article className="relative overflow-hidden rounded-[1.5rem] bg-sunset text-cream sunset-glow p-6 md:p-8 min-h-[320px]">
                            {/* Soft white blob in corner for depth */}
                            <div className="pointer-events-none absolute -right-20 -top-20 w-64 h-64 rounded-full bg-cream/20 blur-3xl" />
                            <div className="pointer-events-none absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-wine/30 blur-3xl" />

                            <div className="relative z-10">
                                {isLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-5 w-32 bg-cream/20" />
                                        <Skeleton className="h-8 w-56 bg-cream/20" />
                                        <Skeleton className="h-4 w-44 bg-cream/20" />
                                        <Skeleton className="h-32 w-full bg-cream/20" />
                                    </div>
                                ) : noMembership ? (
                                    <div className="flex flex-col items-start gap-4 h-full justify-between min-h-[256px]">
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-cream/75 mb-2">
                                                Sunrise Sunset
                                            </p>
                                            <h2 className="font-heading text-2xl md:text-3xl mb-2">
                                                Aún no tienes membresía
                                            </h2>
                                            <p className="text-cream/85 text-sm leading-relaxed max-w-md">
                                                Cuando actives tu plan, aquí aparecerá tu pase con QR para check-in y tus puntos
                                                WalletClub.
                                            </p>
                                        </div>
                                        <Link
                                            to="/app/plans"
                                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cream text-coral font-semibold text-sm tracking-wide hover:bg-blush transition-colors active:scale-[0.98]"
                                        >
                                            Ver planes
                                            <span className="material-symbols-outlined text-base">arrow_forward</span>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-[11px] uppercase tracking-[0.18em] text-cream/75">
                                                    Sunrise Sunset
                                                </p>
                                                <h2 className="font-heading text-2xl md:text-3xl mt-1">
                                                    {data?.memberName || 'Miembro'}
                                                </h2>
                                                <p className="text-cream/85 text-xs mt-1">
                                                    Miembro desde {formatDate(data?.memberSince)}
                                                </p>
                                            </div>
                                            <span
                                                className={`text-[11px] font-semibold tracking-[0.14em] uppercase px-3 py-1 rounded-full ${data?.membershipStatus === 'active'
                                                    ? 'bg-cream text-coral'
                                                    : 'bg-cream/20 text-cream'
                                                    }`}
                                            >
                                                {data?.membershipStatus === 'active' ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wide text-cream/70">Plan</p>
                                                <p className="font-medium truncate">{data?.planName || 'Sin plan activo'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wide text-cream/70">Vence</p>
                                                <p className="font-medium">{formatDate(data?.expirationDate)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wide text-cream/70">Puntos</p>
                                                <p className="font-medium tabular-nums">{data?.pointsBalance ?? 0} pts</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wide text-cream/70">Clases</p>
                                                <p className="font-medium">
                                                    {hasMembership ? data?.classesRemaining ?? 'Ilimitado' : '—'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-cream/25 bg-cream/15 p-4 backdrop-blur-sm">
                                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-cream/85">
                                                <span className="material-symbols-outlined text-base">qr_code_2</span>
                                                QR de check-in
                                            </div>
                                            <div className="mt-3 flex items-center justify-center">
                                                {data?.qrPayload ? (
                                                    <div className="p-2 bg-cream rounded-xl">
                                                        <QRCodeSVG
                                                            value={data.qrPayload}
                                                            size={112}
                                                            level="M"
                                                            bgColor="#FFFFFF"
                                                            fgColor="#6E4528"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-cream/30 bg-cream/10 text-xs text-cream/60">
                                                        Sin QR
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </article>

                        {/* Add to wallet panel */}
                        <aside className="bg-card rounded-[1.5rem] p-6 md:p-8 space-y-4 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-foreground/60">
                                <span className="material-symbols-outlined text-base">wallet</span>
                                Agrega tu pase digital
                            </div>
                            <div className="space-y-3">
                                <Button
                                    className="w-full bg-coral text-cream hover:opacity-90 rounded-xl py-5 font-semibold tracking-wide shadow-md shadow-coral/15"
                                    disabled={!canDownloadPass || applePassMutation.isPending}
                                    onClick={() => applePassMutation.mutate()}
                                >
                                    {applePassMutation.isPending ? 'Generando…' : 'Agregar a Apple Wallet'}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full border-coral/40 text-coral hover:bg-coral/5 rounded-xl py-5 font-semibold tracking-wide"
                                    disabled={!canDownloadPass || googlePassMutation.isPending}
                                    onClick={() => googlePassMutation.mutate()}
                                >
                                    {googlePassMutation.isPending ? 'Generando…' : 'Agregar a Google Pay'}
                                </Button>
                            </div>
                            {!canDownloadPass && (
                                <p className="text-xs text-foreground/55 leading-relaxed">
                                    Necesitas una membresía activa para generar tu pase digital.
                                </p>
                            )}
                        </aside>
                    </section>

                    {/* Rewards + history */}
                    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        <div className="bg-card rounded-[1.5rem] p-6 md:p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-heading text-xl text-foreground flex items-center gap-2">
                                    <span className="material-symbols-outlined text-coral filled">redeem</span>
                                    Canjear recompensas
                                </h3>
                                <Link
                                    to="/app/wallet/rewards"
                                    className="text-xs font-semibold text-coral tracking-[0.18em] uppercase hover:opacity-80"
                                >
                                    Ver todas
                                </Link>
                            </div>

                            {rewardsLoading ? (
                                <div className="grid gap-4 sm:grid-cols-3">
                                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                                </div>
                            ) : activeRewards.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-3">
                                    {activeRewards.map((reward) => {
                                        const canAfford = pointsBalance >= reward.points_cost;
                                        return (
                                            <div
                                                key={reward.id}
                                                className={`rounded-2xl p-4 text-center transition-all ${canAfford
                                                    ? 'bg-blush ring-2 ring-coral/30 sunset-glow'
                                                    : 'bg-cream/60'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-3xl text-coral">
                                                    {getRewardIcon(reward.reward_type)}
                                                </span>
                                                <p className="mt-2 text-sm font-medium text-foreground line-clamp-2">
                                                    {reward.name}
                                                </p>
                                                <p
                                                    className={`text-xs mt-1 ${canAfford
                                                        ? 'text-coral font-semibold'
                                                        : 'text-foreground/55'
                                                        }`}
                                                >
                                                    {reward.points_cost} pts
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-coral/30 bg-cream/50 p-6 flex flex-col items-center gap-3 text-center">
                                    <span className="material-symbols-outlined text-coral text-3xl">card_giftcard</span>
                                    <p className="text-sm text-foreground/75">Empieza a ganar puntos asistiendo a clases.</p>
                                    <Link
                                        to="/app/book"
                                        className="text-xs font-semibold text-coral tracking-[0.18em] uppercase border-b-2 border-coral/30 hover:border-coral pb-0.5 transition-colors"
                                    >
                                        Reservar clase
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="bg-card rounded-[1.5rem] p-6 md:p-8 shadow-sm">
                            <h3 className="font-heading text-xl text-foreground flex items-center gap-2 mb-5">
                                <span className="material-symbols-outlined text-foreground/60">history</span>
                                Historial reciente
                            </h3>
                            {recentActivity.length > 0 ? (
                                <ul className="space-y-3">
                                    {recentActivity.map((item) => (
                                        <li
                                            key={item.id}
                                            className="flex items-center justify-between text-sm pb-3 border-b border-border/30 last:border-b-0 last:pb-0"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{getActivityLabel(item)}</p>
                                                <p className="text-xs text-foreground/55 mt-0.5">{formatActivityDate(item.created_at)}</p>
                                            </div>
                                            <span
                                                className={`font-semibold tabular-nums ${item.points > 0 ? 'text-emerald-600' : 'text-rose-600'
                                                    }`}
                                            >
                                                {item.points > 0 ? `+${item.points}` : item.points} pts
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="rounded-2xl bg-cream/50 p-6 text-center">
                                    <p className="text-sm text-foreground/65 leading-relaxed">
                                        Aún no tienes movimientos.
                                        <br />
                                        <span className="text-foreground/80">Asiste a clases para ganar puntos.</span>
                                    </p>
                                </div>
                            )}
                            {recentActivity.length > 0 && (
                                <Link
                                    to="/app/wallet/history"
                                    className="inline-block mt-4 text-xs font-semibold text-coral tracking-[0.18em] uppercase hover:opacity-80"
                                >
                                    Ver todo →
                                </Link>
                            )}
                        </div>
                    </section>
                </div>
            </ClientLayout>
        </AuthGuard>
    );
}
