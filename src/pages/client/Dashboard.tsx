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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  Calendar,
  Clock,
  Gift,
  ChevronRight,
  Plus,
  RefreshCw,
  Sparkles,
  Play,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface WalletSummary {
  pointsBalance: number;
}

interface LoyaltyReward {
  id: string;
  name: string;
  points_cost: number;
  is_active: boolean;
  stock: number | null;
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
  const isOutOfCredits = membership?.status === 'active' && membership?.class_limit && (membership?.classes_remaining ?? 0) <= 0;

  const { data: bookings, isLoading: bookingsLoading } = useQuery<BookingClient[]>({
    queryKey: ['my-bookings'],
    queryFn: async () => (await api.get('/bookings/my-bookings')).data,
  });

  const { data: walletSummary } = useQuery<WalletSummary>({
    queryKey: ['wallet-pass'],
    queryFn: async () => (await api.get('/wallet/pass')).data,
  });

  const { data: loyaltyRewards, isLoading: loyaltyRewardsLoading } = useQuery<LoyaltyReward[]>({
    queryKey: ['loyalty-rewards'],
    queryFn: async () => (await api.get('/loyalty/rewards')).data,
  });

  const { data: latestVideos } = useQuery<any[]>({
    queryKey: ['latest-videos'],
    queryFn: async () => {
      const { data } = await api.get('/videos', { params: { limit: 4 } });
      return data;
    },
  });

  const upcomingClasses = useMemo(() => {
    if (!bookings) return [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return bookings
      .filter((booking) => booking.booking_status !== 'cancelled')
      .filter((booking) => {
        const classDate = parseISO(booking.date);
        // Show all classes from today onwards (not just future hours)
        return classDate >= today;
      })
      .sort((a, b) => {
        const dateA = parseISO(`${a.date}T${a.start_time}`);
        const dateB = parseISO(`${b.date}T${b.start_time}`);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 2);
  }, [bookings]);

  const membershipEndDate = membership?.end_date ? parseISO(membership.end_date) : null;
  const daysRemaining = membershipEndDate
    ? Math.max(differenceInCalendarDays(membershipEndDate, new Date()), 0)
    : null;
  const classLimit = membership?.class_limit ?? null;
  const classesRemaining = membership?.classes_remaining ?? null;
  const classesProgress = classLimit && classesRemaining !== null
    ? (classesRemaining / classLimit) * 100
    : null;
  const pointsBalance = walletSummary?.pointsBalance ?? 0;
  const nextReward = useMemo(() => {
    return (loyaltyRewards || [])
      .filter((reward) => reward.is_active && (reward.stock === null || reward.stock > 0))
      .sort((a, b) => a.points_cost - b.points_cost)[0] || null;
  }, [loyaltyRewards]);
  const rewardTarget = nextReward?.points_cost ?? null;
  const pointsRemaining = rewardTarget ? Math.max(rewardTarget - pointsBalance, 0) : 0;
  const rewardProgress = rewardTarget ? Math.min((pointsBalance / rewardTarget) * 100, 100) : 0;

  return (
    <AuthGuard requiredRoles={['client']}>
      <ClientLayout>
        <div className="space-y-6">
          {/* Header with gradient */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-catarsis-dark via-[#3D3229] to-catarsis-dark p-6">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-catarsis-gold/[0.08] blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-catarsis-olive/[0.1] blur-3xl" />
            <div className="relative z-10">
              <h1 className="text-2xl font-heading font-bold text-white">
                ¡Hola, {user?.display_name?.split(' ')[0] || 'bienvenido'}! 👋
              </h1>
              <p className="text-catarsis-sand/60 font-body text-sm mt-1">
                Bienvenido de vuelta a Sunrise Sunset
              </p>
            </div>
          </div>

          {/* Membership Card — Premium feel */}
          <Card className={`relative overflow-hidden ${isExpiredOrCancelled || isOutOfCredits ? 'border-amber-300/40 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/30' : 'border-catarsis-gold/20 bg-gradient-to-br from-catarsis-cream via-white to-catarsis-sand/10'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-catarsis-gold/[0.06] blur-2xl" />
            <CardHeader className="pb-2 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-heading">Tu Membresía</CardTitle>
                <Badge
                  variant={membership?.status === 'active' ? 'default' : 'secondary'}
                  className={
                    isOutOfCredits
                      ? 'bg-amber-100 text-amber-700 border border-amber-300 rounded-lg'
                      : membership?.status === 'active'
                        ? 'bg-emerald-600 rounded-lg'
                        : isExpiredOrCancelled
                          ? 'bg-amber-100 text-amber-700 border border-amber-300 rounded-lg'
                          : 'rounded-lg'
                  }
                >
                  {isOutOfCredits ? 'Sin créditos' : membership ? statusLabel[membership.status] : 'Sin membresía'}
                </Badge>
              </div>
              <CardDescription className="font-body">{membership?.plan_name || 'Activa tu plan para comenzar'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              {membershipLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-56" />
                </div>
              ) : membership && isOutOfCredits ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200/60">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-800">
                        Agotaste tus {membership.class_limit} clases de {membership.plan_name}
                      </p>
                      <p className="text-xs text-amber-600">
                        Tu plan vence el {membership.end_date ? safeFormat(parseISO(membership.end_date), 'dd MMM yyyy') : '—'}. Compra más clases para seguir reservando.
                      </p>
                    </div>
                  </div>
                  <Button asChild className="w-full rounded-xl bg-catarsis-gold hover:bg-catarsis-gold/90 shadow-md">
                    <Link to="/app/checkout">
                      <Plus className="h-4 w-4 mr-2" />
                      Comprar más clases
                    </Link>
                  </Button>
                </div>
              ) : membership && isExpiredOrCancelled ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200/60">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-800">
                        Tu membresía {membership.status === 'expired' ? 'venció' : 'fue cancelada'}{membership.end_date ? ` el ${safeFormat(parseISO(membership.end_date), 'dd MMM yyyy')}` : ''}
                      </p>
                      <p className="text-xs text-amber-600">
                        Renueva para seguir reservando clases y acumulando puntos WalletClub.
                      </p>
                    </div>
                  </div>
                  <Button asChild className="w-full rounded-xl bg-catarsis-gold hover:bg-catarsis-gold/90 shadow-md">
                    <Link to="/app/checkout">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Renovar membresía
                    </Link>
                  </Button>
                </div>
              ) : membership ? (
                <>
                  {classLimit && classLimit > 0 ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Clases restantes</span>
                        <span className="font-medium">
                          {classesRemaining ?? 0} de {classLimit}
                        </span>
                      </div>
                      <Progress value={classesProgress ?? 0} className="h-2" />
                    </div>
                  ) : classLimit === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Solo acceso (sin clases incluidas)
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Clases ilimitadas activas
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {daysRemaining !== null ? `${daysRemaining} días restantes` : 'Sin fecha de vencimiento'}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {membership.end_date ? `Vence: ${safeFormat(membershipEndDate!, 'dd MMM yyyy')}` : 'Sin vencimiento'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Aún no tienes una membresía activa.
                  </p>
                  <Button asChild size="sm">
                    <Link to="/app/checkout">
                      <Plus className="h-4 w-4 mr-2" />
                      Comprar membresía
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button asChild size="lg" className="h-auto py-5 flex-col gap-2 rounded-xl bg-catarsis-gold hover:bg-catarsis-gold/90 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <Link to="/app/book">
                <Plus className="h-5 w-5" />
                <span className="font-body font-semibold">Reservar Clase</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-auto py-5 flex-col gap-2 rounded-xl border-catarsis-sand/40 hover:border-catarsis-gold/40 hover:bg-catarsis-gold/5 transition-all duration-300 hover:-translate-y-0.5">
              <Link to="/app/wallet">
                <Gift className="h-5 w-5 text-catarsis-gold" />
                <span className="font-body font-semibold">WalletClub</span>
              </Link>
            </Button>
          </div>

          <Card className="border-border/60 hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-heading">Próximas Clases</CardTitle>
                <Button variant="ghost" size="sm" className="font-body rounded-xl" asChild>
                  <Link to="/app/classes">
                    Ver todas
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : upcomingClasses.length > 0 ? (
                <div className="space-y-3">
                  {upcomingClasses.map((cls) => (
                    <div
                      key={cls.booking_id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/40 overflow-hidden relative hover:bg-muted/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      {cls.class_type_color && (
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1"
                          style={{ backgroundColor: cls.class_type_color }}
                        />
                      )}
                      <div className="flex items-center gap-3 pl-2">
                        <div 
                          className="h-10 w-10 rounded-full flex items-center justify-center"
                          style={{ 
                            backgroundColor: cls.class_type_color ? `${cls.class_type_color}20` : 'hsl(var(--primary) / 0.1)'
                          }}
                        >
                          <Calendar 
                            className="h-5 w-5" 
                            style={{ color: cls.class_type_color || 'hsl(var(--primary))' }}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{cls.class_type_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {safeFormat(cls.date, 'EEE d MMM')} • {cls.start_time.slice(0, 5)} • {cls.instructor_name}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/app/classes/${cls.booking_id}`}>Ver detalle</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-10 w-10 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">No tienes clases próximas</p>
                  <Button asChild className="mt-4">
                    <Link to="/app/book">Reservar ahora</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Videos On-Demand */}
          {latestVideos && latestVideos.length > 0 && (
            <Card className="border-border/60 hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 font-heading">
                    <div className="h-8 w-8 rounded-xl bg-catarsis-gold/10 flex items-center justify-center">
                      <Play className="h-4 w-4 text-catarsis-gold" />
                    </div>
                    Videos On-Demand
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="font-body rounded-xl" asChild>
                    <Link to="/app/videos">
                      Ver todos
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <CardDescription className="font-body">Rutinas y técnica disponibles para ti</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {latestVideos.slice(0, 4).map((video: any) => (
                    <Link
                      key={video.id}
                      to={`/app/videos/${video.id}`}
                      className="group"
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        {video.thumbnail_url ? (
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Play className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white/90 rounded-full p-2 shadow-lg">
                            <Play className="h-4 w-4 text-primary fill-primary ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-medium mt-1.5 group-hover:text-primary transition-colors line-clamp-1">
                        {video.title}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{video.level}</p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-catarsis-gold/20 hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 font-heading">
                  <Sparkles className="h-5 w-5 text-catarsis-gold" />
                  WalletClub
                </CardTitle>
                <span className="text-2xl font-bold text-catarsis-gold font-heading">{pointsBalance} pts</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loyaltyRewardsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : nextReward ? (
                <div className="space-y-2">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground truncate">
                      Próxima recompensa: {nextReward.name}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {pointsRemaining > 0 ? `${pointsRemaining} pts más` : 'Lista para canjear'}
                    </span>
                  </div>
                  <Progress value={rewardProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Meta: {rewardTarget} pts
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  Sin recompensas configuradas por ahora.
                </div>
              )}
              <Button variant="outline" asChild className="w-full rounded-xl border-catarsis-gold/20 hover:border-catarsis-gold/40 hover:bg-catarsis-gold/5 font-body">
                <Link to="/app/wallet">
                  Ver recompensas
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    </AuthGuard>
  );
}
