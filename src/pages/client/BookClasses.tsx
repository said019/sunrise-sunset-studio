import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, addDays, isSameDay, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '@/lib/api';
import type { Class } from '@/types/class';
import type { BookingClient } from '@/types/booking';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { SURF_BLUE, SurfboardIcon, isSurfClass, isYogaClass } from '@/lib/classStyles';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const DAYS_SHORT_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_LABEL = (d: Date) =>
    format(d, 'MMMM yyyy', { locale: es }).replace(/^./, (c) => c.toUpperCase());

const safeParse = (s: string): Date | null => {
    try {
        const d = parseISO(s);
        return Number.isNaN(d.getTime()) ? null : d;
    } catch {
        return null;
    }
};

export default function BookClasses() {
    const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
    const [weekStart, setWeekStart] = useState<Date>(() =>
        startOfWeek(new Date(), { weekStartsOn: 0 })
    );
    const [selectMode, setSelectMode] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Keep weekStart aligned with whichever date the user lands on.
    useEffect(() => {
        setWeekStart(startOfWeek(selectedDate, { weekStartsOn: 0 }));
    }, [selectedDate]);

    const startStr = format(weekStart, 'yyyy-MM-dd');
    const endStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');

    const {
        data: classes,
        isLoading: classesLoading,
        isError: classesError,
        refetch: refetchClasses,
    } = useQuery<Class[]>({
        queryKey: ['classes-public', startStr, endStr],
        queryFn: async () => {
            const { data } = await api.get(`/classes?start=${startStr}&end=${endStr}`);
            return Array.isArray(data)
                ? data.filter((c: Class) => typeof c?.date === 'string' && typeof c?.start_time === 'string')
                : [];
        },
    });

    const { data: myBookings } = useQuery<BookingClient[]>({
        queryKey: ['my-bookings'],
        queryFn: async () => {
            const { data } = await api.get('/bookings/my-bookings');
            return Array.isArray(data) ? data : [];
        },
    });

    const isBooked = (classId: string) =>
        !!myBookings?.some((b) => b.class_id === classId && b.booking_status !== 'cancelled');

    const isClassPast = (c: Class) => {
        const d = safeParse(`${(c.date || '').slice(0, 10)}T${c.start_time || '00:00'}`);
        return d ? d.getTime() <= Date.now() : false;
    };

    const isSelectable = (c: Class) => {
        if (isBooked(c.id)) return false;
        if (c.status === 'cancelled') return false;
        if (c.current_bookings >= c.max_capacity) return false;
        if (isClassPast(c)) return false;
        return true;
    };

    const classesForDay = useMemo(() => {
        if (!classes) return [];
        return classes
            .filter((c) => {
                const d = safeParse(c.date);
                return d ? isSameDay(d, selectedDate) : false;
            })
            .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    }, [classes, selectedDate]);

    const toggleSelected = (id: string) =>
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const exitSelectMode = () => {
        setSelectMode(false);
        setSelected(new Set());
    };

    const bulkMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.post('/bookings/bulk', { classIds: Array.from(selected) });
            return data as { bookedCount: number; classesRemaining: number | null };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            queryClient.invalidateQueries({ queryKey: ['classes-public'] });
            const restantes =
                data.classesRemaining === null
                    ? ''
                    : ` Te quedan ${data.classesRemaining} crédito${data.classesRemaining !== 1 ? 's' : ''}.`;
            toast({
                title: `¡Reservaste ${data.bookedCount} clase${data.bookedCount !== 1 ? 's' : ''}!`,
                description: `Revisa "Mis Clases".${restantes}`,
            });
            exitSelectMode();
            refetchClasses();
        },
        onError: (err: any) => {
            toast({
                variant: 'destructive',
                title: 'No se pudo reservar',
                description: err?.response?.data?.error || 'Intenta de nuevo.',
            });
        },
    });

    const handleClassTap = (c: Class) => {
        if (selectMode) {
            if (isSelectable(c)) toggleSelected(c.id);
            return;
        }
        if (isSelectable(c)) navigate(`/app/book/${c.id}`);
    };

    const handlePrevWeek = () => setSelectedDate((d) => addDays(d, -7));
    const handleNextWeek = () => setSelectedDate((d) => addDays(d, 7));

    return (
        <AuthGuard requiredRoles={['client']}>
            <ClientLayout>
                <div className="space-y-8 pb-32">
                    {/* Hero / intro */}
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <p className="text-xs font-semibold text-coral tracking-[0.18em] uppercase mb-2">
                            Reserva
                        </p>
                        <h1 className="font-heading text-3xl md:text-4xl text-foreground leading-tight mb-2">
                            Encuentra tu ritmo.
                        </h1>
                        <p className="text-foreground/65 max-w-md">
                            Sculpt-Funcional, Surf-Pilates y Yoga en El Tezal. Elige el día y aparta tu lugar.
                        </p>
                    </section>

                    {/* Date picker — week navigation + horizontal day scroll */}
                    <section>
                        <div className="flex justify-between items-end mb-3">
                            <h3 className="text-xs font-semibold text-foreground/60 tracking-[0.18em] uppercase">
                                Selecciona el día
                            </h3>
                            <div className="flex items-center gap-2 bg-cream/60 rounded-full p-1">
                                <button
                                    onClick={handlePrevWeek}
                                    className="h-8 w-8 rounded-full flex items-center justify-center text-coral hover:bg-coral/10 transition-colors active:scale-95"
                                    aria-label="Semana anterior"
                                >
                                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                </button>
                                <span className="px-3 text-xs font-semibold text-foreground/80 min-w-[120px] text-center capitalize">
                                    {MONTH_LABEL(selectedDate)}
                                </span>
                                <button
                                    onClick={handleNextWeek}
                                    className="h-8 w-8 rounded-full flex items-center justify-center text-coral hover:bg-coral/10 transition-colors active:scale-95"
                                    aria-label="Semana siguiente"
                                >
                                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3 overflow-x-auto py-2 -mx-2 px-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                            {Array.from({ length: 7 }).map((_, i) => {
                                const day = addDays(weekStart, i);
                                const isToday = isSameDay(day, new Date());
                                const isSelected = isSameDay(day, selectedDate);
                                const isPastDay = isPast(day) && !isToday;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDate(day)}
                                        className={cn(
                                            'flex flex-col items-center justify-center min-w-[64px] h-20 rounded-2xl transition-all active:scale-95',
                                            isSelected
                                                ? 'bg-coral text-cream shadow-lg scale-105 ring-4 ring-coral/15'
                                                : 'bg-card border border-border/30 shadow-sm text-foreground hover:border-coral/40',
                                            isPastDay && !isSelected && 'opacity-50'
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'text-[11px] font-semibold tracking-wide',
                                                isSelected ? 'text-cream/80' : 'text-foreground/55'
                                            )}
                                        >
                                            {DAYS_SHORT_ES[i]}
                                        </span>
                                        <span
                                            className={cn(
                                                'font-heading text-xl mt-0.5',
                                                isSelected ? 'text-cream' : 'text-foreground'
                                            )}
                                        >
                                            {format(day, 'd')}
                                        </span>
                                        {isToday && !isSelected && (
                                            <span className="mt-0.5 w-1 h-1 rounded-full bg-coral" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Multi-select toggle */}
                    <div className="flex justify-end">
                        {!selectMode ? (
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full border-coral/40 text-coral hover:bg-coral/5"
                                onClick={() => setSelectMode(true)}
                            >
                                <span className="material-symbols-outlined text-[18px] mr-1.5">checklist</span>
                                Reservar varias
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full text-foreground/60"
                                onClick={exitSelectMode}
                            >
                                <span className="material-symbols-outlined text-[18px] mr-1.5">close</span>
                                Cancelar selección
                            </Button>
                        )}
                    </div>

                    {/* Class list */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-semibold text-foreground/60 tracking-[0.18em] uppercase">
                            Clases disponibles
                        </h3>

                        {classesLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-32 w-full rounded-[1.5rem]" />
                                <Skeleton className="h-32 w-full rounded-[1.5rem]" />
                            </div>
                        ) : classesError ? (
                            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-destructive">No pudimos cargar las clases</p>
                                    <p className="text-xs text-foreground/55 mt-0.5">Revisa tu conexión e intenta otra vez.</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => refetchClasses()}>
                                    Reintentar
                                </Button>
                            </div>
                        ) : classesForDay.length === 0 ? (
                            <div className="bg-card border border-border/30 rounded-[1.5rem] p-10 flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
                                    <span className="material-symbols-outlined text-foreground/40 text-3xl">event_busy</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-foreground/80">No hay clases este día</p>
                                    <p className="text-xs text-foreground/55">Prueba otro día de la semana.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {classesForDay.map((c) => {
                                    const booked = isBooked(c.id);
                                    const full = c.current_bookings >= c.max_capacity;
                                    const cancelled = c.status === 'cancelled';
                                    const pastTime = isClassPast(c);
                                    const isSel = selected.has(c.id);
                                    const selectable = isSelectable(c);
                                    const spotsLeft = c.max_capacity - c.current_bookings;
                                    const isSurf = isSurfClass(c.class_type_name);
                                    const color = isSurf
                                        ? SURF_BLUE
                                        : c.class_type_color || 'hsl(14, 47%, 60%)';

                                    return (
                                        <article
                                            key={c.id}
                                            onClick={() => handleClassTap(c)}
                                            className={cn(
                                                'group relative overflow-hidden rounded-[1.5rem] bg-card shadow-sm transition-all duration-300 cursor-pointer',
                                                isSel && 'ring-4 ring-coral/30 shadow-md',
                                                booked && 'ring-2 ring-emerald-400/40',
                                                !selectable && !booked && 'opacity-60 cursor-not-allowed',
                                                selectable && 'hover:shadow-md hover:-translate-y-0.5'
                                            )}
                                            role="button"
                                            tabIndex={selectable || booked ? 0 : -1}
                                        >
                                            <div className="flex">
                                                {/* Color "image" strip — Sunrise no tiene foto por clase, usamos el color */}
                                                <div
                                                    className="hidden sm:block w-[140px] relative overflow-hidden shrink-0"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${color}, ${color}aa)`,
                                                    }}
                                                >
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        {isSurf ? (
                                                            <SurfboardIcon className="h-12 w-12 text-cream/90" />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-cream/90 text-5xl filled">
                                                                {isYogaClass(c.class_type_name)
                                                                    ? 'self_improvement'
                                                                    : 'fitness_center'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Mobile: thin top color bar */}
                                                <div
                                                    className="sm:hidden absolute top-0 left-0 right-0 h-1.5"
                                                    style={{ backgroundColor: color }}
                                                />

                                                {/* Content */}
                                                <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between gap-3 pt-7 sm:pt-6">
                                                    <div>
                                                        <div className="flex items-start justify-between gap-3 mb-2">
                                                            <h4 className="font-heading text-lg md:text-xl text-foreground leading-snug">
                                                                {c.class_type_name}
                                                            </h4>
                                                            {selectMode && selectable && (
                                                                <span
                                                                    className={cn(
                                                                        'shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors',
                                                                        isSel
                                                                            ? 'bg-coral border-coral'
                                                                            : 'border-foreground/30'
                                                                    )}
                                                                >
                                                                    {isSel && (
                                                                        <span className="material-symbols-outlined text-cream text-[16px] filled">
                                                                            check
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            )}
                                                            {!selectMode && booked && (
                                                                <span className="shrink-0 text-emerald-600 flex items-center gap-1 text-xs font-semibold">
                                                                    <span className="material-symbols-outlined text-[18px] filled">
                                                                        check_circle
                                                                    </span>
                                                                    Reservada
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-foreground/65">
                                                            <span className="flex items-center gap-1.5">
                                                                <span className="material-symbols-outlined text-[18px] text-coral">schedule</span>
                                                                <span className="font-semibold tabular-nums text-foreground">
                                                                    {c.start_time.slice(0, 5)}
                                                                </span>
                                                            </span>
                                                            {c.instructor_name && (
                                                                <span className="flex items-center gap-1.5">
                                                                    <span className="material-symbols-outlined text-[18px] text-coral">person</span>
                                                                    <span>{c.instructor_name}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-end justify-between gap-3">
                                                        <div className="text-xs">
                                                            {cancelled ? (
                                                                <span className="text-destructive font-semibold">Clase cancelada</span>
                                                            ) : pastTime ? (
                                                                <span className="text-foreground/45">Ya pasó</span>
                                                            ) : full ? (
                                                                <span className="text-amber-600 font-semibold">Cupo lleno</span>
                                                            ) : (
                                                                <span className="text-foreground/65">
                                                                    <span className="font-semibold text-foreground">{spotsLeft}</span>{' '}
                                                                    {spotsLeft === 1 ? 'lugar' : 'lugares'} disponibles
                                                                </span>
                                                            )}
                                                        </div>
                                                        {!selectMode && selectable && (
                                                            <span className="text-coral text-xs font-semibold tracking-wide flex items-center gap-1 group-hover:gap-2 transition-all">
                                                                Reservar
                                                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>

                {/* Sticky confirm bar — multi-select mode */}
                {selectMode && (
                    <div
                        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur px-5 py-3"
                        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
                    >
                        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
                            <div className="text-sm">
                                <span className="font-semibold text-foreground">{selected.size}</span>{' '}
                                <span className="text-foreground/65">
                                    clase{selected.size !== 1 ? 's' : ''} seleccionada{selected.size !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <Button
                                disabled={selected.size === 0 || bulkMutation.isPending}
                                onClick={() => bulkMutation.mutate()}
                                className="rounded-full bg-coral text-cream hover:opacity-90 shadow-lg shadow-coral/20"
                            >
                                {bulkMutation.isPending
                                    ? 'Reservando…'
                                    : `Reservar ${selected.size > 0 ? selected.size : ''} clase${selected.size !== 1 ? 's' : ''}`}
                            </Button>
                        </div>
                    </div>
                )}
            </ClientLayout>
        </AuthGuard>
    );
}
