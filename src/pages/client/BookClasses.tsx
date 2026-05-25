import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, addDays, isSameDay, parseISO, isPast } from 'date-fns';
import api from '@/lib/api';
import type { Class } from '@/types/class';
import type { BookingClient } from '@/types/booking';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, Users, Check, CalendarCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const DAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const monthYearLabel = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

export default function BookClasses() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
    const [selectMode, setSelectMode] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        setWeekStart(startOfWeek(currentDate, { weekStartsOn: 0 }));
    }, [currentDate]);

    const startStr = format(weekStart, 'yyyy-MM-dd');
    const endStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');

    const { data: classes, isLoading: classesLoading, isError: classesError, refetch: refetchClasses } = useQuery<Class[]>({
        queryKey: ['classes-public', startStr, endStr],
        queryFn: async () => {
            const { data } = await api.get(`/classes?start=${startStr}&end=${endStr}`);
            // Filtrar clases con datos invalidos para que un registro corrupto no rompa todo el calendario
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

    const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
    const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

    // Helpers defensivos: nunca lanzan, siempre retornan algo razonable
    const safeParse = (s: string): Date | null => {
        try {
            const d = parseISO(s);
            return isNaN(d.getTime()) ? null : d;
        } catch {
            return null;
        }
    };

    const getClassesForDay = (day: Date) => {
        if (!classes) return [];
        return classes
            .filter(c => {
                const d = safeParse(c.date);
                return d ? isSameDay(d, day) : false;
            })
            .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    };

    const isBooked = (classId: string) => {
        return myBookings?.some(b => b.class_id === classId && b.booking_status !== 'cancelled');
    };

    const isClassPast = (c: Class) => {
        const d = safeParse(`${(c.date || '').slice(0, 10)}T${c.start_time || '00:00'}`);
        return d ? d.getTime() <= Date.now() : false;
    };

    // ¿Esta clase se puede seleccionar para reservar? (disponible, no llena, no pasada, no reservada)
    const isSelectable = (c: Class) => {
        if (isBooked(c.id)) return false;
        if (c.status === 'cancelled') return false;
        if (c.current_bookings >= c.max_capacity) return false;
        if (isClassPast(c)) return false;
        return true;
    };

    const toggleSelected = (classId: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(classId)) next.delete(classId);
            else next.add(classId);
            return next;
        });
    };

    const exitSelectMode = () => {
        setSelectMode(false);
        setSelected(new Set());
    };

    const bulkMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.post('/bookings/bulk', { classIds: Array.from(selected) });
            return data as { bookedCount: number; skipped?: any[]; classesRemaining: number | null };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            queryClient.invalidateQueries({ queryKey: ['classes-public'] });
            const restantes = data.classesRemaining === null
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

    // Click en una clase: en modo selección alterna; si no, navega al flujo 1x1.
    const handleClassClick = (c: Class) => {
        if (selectMode) {
            if (isSelectable(c)) toggleSelected(c.id);
            return;
        }
        if (isSelectable(c)) navigate(`/app/book/${c.id}`);
    };

    const selectedCount = selected.size;

    return (
        <AuthGuard requiredRoles={['client']}>
            <ClientLayout>
                <div className="space-y-6 pb-28">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold font-heading">Reservar Clases</h1>
                            <p className="text-muted-foreground text-sm">
                                {selectMode ? 'Toca las clases que quieras apartar' : 'Selecciona una clase para reservar'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {!selectMode ? (
                                <Button variant="outline" size="sm" className="rounded-full" onClick={() => setSelectMode(true)}>
                                    <CalendarCheck className="h-4 w-4 mr-1.5" />
                                    Reservar varias
                                </Button>
                            ) : (
                                <Button variant="ghost" size="sm" className="rounded-full" onClick={exitSelectMode}>
                                    <X className="h-4 w-4 mr-1.5" />
                                    Cancelar
                                </Button>
                            )}

                            <div className="flex items-center gap-2 bg-muted/50 rounded-full p-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handlePrevWeek}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="px-3 font-medium text-sm min-w-[120px] text-center capitalize">
                                    {monthYearLabel(currentDate)}
                                </span>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleNextWeek}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {classesLoading && (
                        <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 py-10 text-center text-sm text-muted-foreground">
                            Cargando clases...
                        </div>
                    )}

                    {classesError && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-destructive">No pudimos cargar las clases</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Revisa tu conexion e intenta otra vez.</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => refetchClasses()}>Reintentar</Button>
                        </div>
                    )}

                    {/* Mobile: horizontal scroll view */}
                    <div className="sm:hidden">
                        <div className="flex overflow-x-auto gap-2 pb-3 snap-x snap-mandatory -mx-4 px-4">
                            {Array.from({ length: 7 }).map((_, i) => {
                                const day = addDays(weekStart, i);
                                const isToday = isSameDay(day, new Date());
                                const isPastDay = isPast(day) && !isToday;
                                const dayClasses = getClassesForDay(day);

                                return (
                                    <div
                                        key={`mobile-${i}`}
                                        className={cn(
                                            "flex-shrink-0 w-[160px] snap-start rounded-xl border overflow-hidden",
                                            isToday && "border-primary ring-2 ring-primary/20",
                                            !isToday && "border-border",
                                            isPastDay && "opacity-50"
                                        )}
                                    >
                                        {/* Day header */}
                                        <div className={cn(
                                            "text-center py-2",
                                            isToday && "bg-primary text-primary-foreground",
                                            !isToday && "bg-muted/50"
                                        )}>
                                            <div className={cn(
                                                "text-[10px] font-medium tracking-wider",
                                                isToday ? "text-primary-foreground/80" : "text-muted-foreground"
                                            )}>
                                                {DAYS[i]}
                                            </div>
                                            <div className={cn(
                                                "text-lg font-bold",
                                                isToday ? "text-primary-foreground" : "text-foreground"
                                            )}>
                                                {format(day, 'd')}
                                            </div>
                                        </div>

                                        {/* Classes */}
                                        <div className="p-2 space-y-2 min-h-[200px]">
                                            {dayClasses.map(c => {
                                                const booked = isBooked(c.id);
                                                const full = c.current_bookings >= c.max_capacity;
                                                const spotsLeft = c.max_capacity - c.current_bookings;
                                                const cancelled = c.status === 'cancelled';
                                                const pastTime = isPastDay || isClassPast(c);
                                                const isSel = selected.has(c.id);
                                                const selectable = isSelectable(c);

                                                return (
                                                    <button
                                                        key={c.id}
                                                        disabled={selectMode ? !selectable : (cancelled || full || pastTime)}
                                                        onClick={() => handleClassClick(c)}
                                                        className={cn(
                                                            "w-full rounded-lg transition-all text-left overflow-hidden border shadow-sm relative",
                                                            isSel && "ring-2 ring-primary border-primary",
                                                            booked && "bg-gradient-to-r from-success/10 to-success/10 border-success/30",
                                                            !booked && !full && !cancelled && !pastTime && !isSel && "bg-card hover:shadow-md cursor-pointer border-border",
                                                            (full || cancelled || pastTime) && !booked && "bg-muted/50 border-border/50 cursor-not-allowed opacity-60"
                                                        )}
                                                    >
                                                        <div className="h-1 w-full" style={{ backgroundColor: c.class_type_color || '#9ca3af' }} />
                                                        <div className="p-2">
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                                <span className="font-bold text-sm tabular-nums">{c.start_time.slice(0, 5)}</span>
                                                                {selectMode && selectable && (
                                                                    <span className={cn(
                                                                        "ml-auto h-4 w-4 rounded border flex items-center justify-center",
                                                                        isSel ? "bg-primary border-primary" : "border-muted-foreground/40"
                                                                    )}>
                                                                        {isSel && <Check className="h-3 w-3 text-primary-foreground" />}
                                                                    </span>
                                                                )}
                                                                {!selectMode && booked && <Check className="h-3 w-3 text-success ml-auto" />}
                                                            </div>
                                                            <p className="text-xs font-medium leading-tight mb-1">{c.class_type_name}</p>
                                                            {!booked && (
                                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                                    <Users className="h-3 w-3" />
                                                                    <span className="text-[10px]">
                                                                        {cancelled ? 'Cancelada' : full ? 'Lleno' : pastTime ? 'Pasada' : `${spotsLeft} lugares`}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}

                                            {dayClasses.length === 0 && (
                                                <div className="flex items-center justify-center h-20 text-xs text-muted-foreground italic">
                                                    Sin clases
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Desktop: 7-column grid */}
                    <div className="hidden sm:grid grid-cols-7 gap-2">
                        {/* Day Headers */}
                        {Array.from({ length: 7 }).map((_, i) => {
                            const day = addDays(weekStart, i);
                            const isToday = isSameDay(day, new Date());
                            const isPastDay = isPast(day) && !isToday;

                            return (
                                <div
                                    key={`header-${i}`}
                                    className={cn(
                                        "text-center py-3 rounded-t-xl",
                                        isToday && "bg-primary text-primary-foreground",
                                        !isToday && "bg-muted/50"
                                    )}
                                >
                                    <div className={cn(
                                        "text-[10px] font-medium tracking-wider",
                                        isToday ? "text-primary-foreground/80" : "text-muted-foreground",
                                        isPastDay && "opacity-50"
                                    )}>
                                        {DAYS[i]}
                                    </div>
                                    <div className={cn(
                                        "text-lg font-bold",
                                        isToday ? "text-primary-foreground" : "text-foreground",
                                        isPastDay && "opacity-50"
                                    )}>
                                        {format(day, 'd')}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Classes for each day */}
                        {Array.from({ length: 7 }).map((_, i) => {
                            const day = addDays(weekStart, i);
                            const isToday = isSameDay(day, new Date());
                            const isPastDay = isPast(day) && !isToday;
                            const dayClasses = getClassesForDay(day);

                            return (
                                <div
                                    key={`classes-${i}`}
                                    className={cn(
                                        "min-h-[280px] p-1 sm:p-2 rounded-b-xl border-x border-b",
                                        isToday && "bg-primary/5 border-primary/20",
                                        !isToday && "bg-card",
                                        isPastDay && "opacity-60"
                                    )}
                                >
                                    <div className="space-y-1.5">
                                        {dayClasses.map(c => {
                                            const booked = isBooked(c.id);
                                            const full = c.current_bookings >= c.max_capacity;
                                            const spotsLeft = c.max_capacity - c.current_bookings;
                                            const cancelled = c.status === 'cancelled';
                                            const pastTime = isPastDay || isClassPast(c);
                                            const isSel = selected.has(c.id);
                                            const selectable = isSelectable(c);

                                            return (
                                                <button
                                                    key={c.id}
                                                    disabled={selectMode ? !selectable : (cancelled || full || pastTime)}
                                                    onClick={() => handleClassClick(c)}
                                                    className={cn(
                                                        "w-full rounded-lg transition-all text-left overflow-hidden",
                                                        "border shadow-sm relative",
                                                        isSel && "ring-2 ring-primary border-primary",
                                                        booked && "bg-gradient-to-r from-success/10 to-success/10 border-success/30 dark:from-success/40 dark:to-success/40 dark:border-success/30",
                                                        !booked && !full && !cancelled && !pastTime && !isSel && "bg-card hover:shadow-md hover:scale-[1.02] cursor-pointer border-border",
                                                        (full || cancelled || pastTime) && !booked && "bg-muted/50 border-border/50 cursor-not-allowed opacity-60"
                                                    )}
                                                >
                                                    {/* Color bar */}
                                                    <div
                                                        className="h-1 w-full"
                                                        style={{ backgroundColor: c.class_type_color || '#9ca3af' }}
                                                    />

                                                    <div className="p-2 sm:p-2.5">
                                                        {/* Time */}
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                                <span className="font-bold text-sm tabular-nums">
                                                                    {c.start_time.slice(0, 5)}
                                                                </span>
                                                            </div>
                                                            {selectMode && selectable && (
                                                                <span className={cn(
                                                                    "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                                                                    isSel ? "bg-primary border-primary" : "border-muted-foreground/40"
                                                                )}>
                                                                    {isSel && <Check className="h-3 w-3 text-primary-foreground" />}
                                                                </span>
                                                            )}
                                                            {!selectMode && booked && (
                                                                <div className="flex items-center gap-0.5 text-success dark:text-success">
                                                                    <Check className="h-3 w-3" />
                                                                    <span className="text-[10px] font-medium hidden sm:inline">Reservado</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Class name */}
                                                        <p className={cn(
                                                            "text-xs font-medium truncate mb-1.5",
                                                            cancelled && "line-through text-muted-foreground"
                                                        )}>
                                                            {c.class_type_name}
                                                        </p>

                                                        {/* Spots */}
                                                        {!booked && (
                                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                                <Users className="h-3 w-3" />
                                                                <span className="text-[10px]">
                                                                    {cancelled ? 'Cancelada' : full ? 'Lleno' : pastTime ? 'Pasada' : `${spotsLeft} lugares`}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}

                                        {dayClasses.length === 0 && (
                                            <div className="flex items-center justify-center h-20 text-xs text-muted-foreground italic">
                                                Sin clases
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-gradient-to-r from-success/10 to-success/10 border border-success/30" />
                            <span>Reservado</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-card border border-border" />
                            <span>Disponible</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-muted border border-border" />
                            <span>Lleno / Pasado</span>
                        </div>
                    </div>
                </div>

                {/* Barra fija de confirmación en modo selección */}
                {selectMode && (
                    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur px-4 py-3 md:pl-64"
                        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
                        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                            <div className="text-sm">
                                <span className="font-semibold">{selectedCount}</span> clase{selectedCount !== 1 ? 's' : ''} seleccionada{selectedCount !== 1 ? 's' : ''}
                            </div>
                            <Button
                                disabled={selectedCount === 0 || bulkMutation.isPending}
                                onClick={() => bulkMutation.mutate()}
                                className="rounded-full"
                            >
                                {bulkMutation.isPending
                                    ? 'Reservando...'
                                    : `Reservar ${selectedCount > 0 ? selectedCount : ''} clase${selectedCount !== 1 ? 's' : ''}`}
                            </Button>
                        </div>
                    </div>
                )}
            </ClientLayout>
        </AuthGuard>
    );
}
