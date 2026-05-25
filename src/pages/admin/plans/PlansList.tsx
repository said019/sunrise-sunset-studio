import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api, { getErrorMessage } from '@/lib/api';
import type { Plan } from '@/types/auth';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, MoreHorizontal, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

const planSchema = z.object({
    name: z.string().min(2, 'El nombre es requerido'),
    description: z.string().optional(),
    price: z.coerce.number().positive('El precio debe ser mayor a 0'),
    durationDays: z.coerce.number().int().positive('La duración debe ser positiva'),
    classLimit: z
        .preprocess((v) => (v === '' || v === null || v === undefined ? null : Number(v)),
            z.number().int().positive().nullable())
        .optional(),
    features: z.string().optional(),
    isActive: z.boolean(),
    sortOrder: z.coerce.number().int().default(0),
});

type PlanForm = z.infer<typeof planSchema>;

const defaultForm: PlanForm = {
    name: '',
    description: '',
    price: 0,
    durationDays: 30,
    classLimit: null,
    features: '',
    isActive: true,
    sortOrder: 0,
};

function parseFeatures(raw: Plan['features']): string[] {
    if (Array.isArray(raw)) return raw as string[];
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

function toNumber(v: unknown): number {
    if (typeof v === 'number') return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

export default function PlansList() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isSubmitting },
    } = useForm<PlanForm>({
        resolver: zodResolver(planSchema) as any,
        defaultValues: defaultForm,
    });

    const { data: plans, isLoading } = useQuery<Plan[]>({
        queryKey: ['plans', 'admin'],
        queryFn: async () => (await api.get('/plans?all=true')).data,
    });

    const invalidatePlans = () => {
        queryClient.invalidateQueries({ queryKey: ['plans'] });
        queryClient.invalidateQueries({ queryKey: ['plans', 'admin'] });
        queryClient.invalidateQueries({ queryKey: ['public-plans'] });
    };

    const savePlanMutation = useMutation({
        mutationFn: async ({ id, data }: { id?: string; data: any }) => {
            if (id) return (await api.put(`/plans/${id}`, data)).data;
            return (await api.post('/plans', data)).data;
        },
        onSuccess: (_data, variables) => {
            invalidatePlans();
            toast({
                title: variables.id ? 'Plan actualizado' : 'Plan creado',
                description: variables.id
                    ? 'Los cambios se aplicaron y las vigencias de membresías activas se recalcularon.'
                    : 'El plan se ha creado exitosamente.',
            });
            setIsDialogOpen(false);
            setEditingPlan(null);
            reset(defaultForm);
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    const deactivatePlanMutation = useMutation({
        mutationFn: async (id: string) => (await api.delete(`/plans/${id}`)).data,
        onSuccess: () => {
            invalidatePlans();
            toast({ title: 'Paquete desactivado', description: 'Dejó de mostrarse en la landing.' });
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    const reactivatePlanMutation = useMutation({
        mutationFn: async (id: string) => (await api.put(`/plans/${id}`, { isActive: true })).data,
        onSuccess: () => {
            invalidatePlans();
            toast({ title: 'Paquete reactivado', description: 'Vuelve a estar visible en la landing.' });
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    const hardDeletePlanMutation = useMutation({
        mutationFn: async ({ id, force = false }: { id: string; force?: boolean }) => {
            const qs = force ? '?force=true' : '?hard=true';
            return (await api.delete(`/plans/${id}${qs}`)).data;
        },
        onSuccess: (data: any) => {
            invalidatePlans();
            const extra = data?.deletedOrders > 0 ? ` (incluyendo ${data.deletedOrders} orden(es) de compra)` : '';
            toast({ title: 'Paquete eliminado', description: `Se eliminó permanentemente${extra}.` });
        },
        onError: (error: any, variables) => {
            const data = error?.response?.data;
            // Si el backend dice canForce y aún no estábamos en modo force → preguntar al admin
            if (data?.canForce && !variables.force) {
                const ordersCount = data.ordersCount || '?';
                if (confirm(
                    `Este paquete tiene ${ordersCount} orden(es) de compra asociada(s).\n\n` +
                    `¿Eliminar también las órdenes? Esto borra los registros de compras y comprobantes (no toca pagos confirmados).\n\n` +
                    `Si la respuesta es No, usa "Desactivar" en su lugar.`
                )) {
                    hardDeletePlanMutation.mutate({ id: variables.id, force: true });
                    return;
                }
            }
            toast({ variant: 'destructive', title: 'No se puede eliminar', description: getErrorMessage(error) });
        },
    });

    const onSubmit = (data: PlanForm) => {
        const featuresArray = data.features
            ? data.features.split('\n').map((f) => f.trim()).filter((f) => f !== '')
            : [];

        const payload = {
            name: data.name.trim(),
            description: data.description?.trim() || undefined,
            price: data.price,
            currency: 'MXN',
            durationDays: data.durationDays,
            classLimit: data.classLimit ?? null,
            features: featuresArray,
            isActive: data.isActive,
            sortOrder: data.sortOrder ?? 0,
        };

        savePlanMutation.mutate({ id: editingPlan?.id, data: payload });
    };

    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingPlan(null);
        reset(defaultForm);
        setIsDialogOpen(true);
    };

    // Reset form whenever dialog opens with a specific plan
    useEffect(() => {
        if (!isDialogOpen) return;
        if (editingPlan) {
            reset({
                name: editingPlan.name ?? '',
                description: editingPlan.description ?? '',
                price: toNumber(editingPlan.price),
                durationDays: toNumber(editingPlan.duration_days) || 30,
                classLimit: editingPlan.class_limit ?? null,
                features: parseFeatures(editingPlan.features).join('\n'),
                isActive: !!editingPlan.is_active,
                sortOrder: toNumber(editingPlan.sort_order),
            });
        } else {
            reset(defaultForm);
        }
    }, [isDialogOpen, editingPlan, reset]);

    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) setEditingPlan(null);
    };

    return (
        <AuthGuard requiredRoles={['admin']}>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-heading font-bold">Paquetes</h1>
                            <p className="text-muted-foreground">
                                Edita precios y vigencia. Los cambios de vigencia se aplican a membresías activas existentes.
                            </p>
                        </div>
                        <Button onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Paquete
                        </Button>
                    </div>

                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Precio</TableHead>
                                    <TableHead>Vigencia</TableHead>
                                    <TableHead>Clases</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : !plans || plans.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No hay paquetes configurados
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    plans.map((plan) => {
                                        const price = toNumber(plan.price);
                                        return (
                                            <TableRow key={plan.id}>
                                                <TableCell className="font-medium">
                                                    <div>{plan.name}</div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[240px]">
                                                        {plan.description}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    ${price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {plan.currency || 'MXN'}
                                                </TableCell>
                                                <TableCell>{plan.duration_days} días</TableCell>
                                                <TableCell>
                                                    {plan.class_limit === null || plan.class_limit === undefined
                                                        ? 'Ilimitadas'
                                                        : plan.class_limit}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                                                        {plan.is_active ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Abrir menú</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                            <DropdownMenuItem onSelect={() => handleEdit(plan)}>
                                                                <Pencil className="mr-2 h-4 w-4" /> Editar
                                                            </DropdownMenuItem>
                                                            {plan.is_active ? (
                                                                <DropdownMenuItem
                                                                    onSelect={() => {
                                                                        if (confirm(`¿Desactivar "${plan.name}"? Dejará de mostrarse en la landing. Las membresías existentes no se afectan.`)) {
                                                                            deactivatePlanMutation.mutate(plan.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    <EyeOff className="mr-2 h-4 w-4" /> Desactivar
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onSelect={() => reactivatePlanMutation.mutate(plan.id)}>
                                                                    <Eye className="mr-2 h-4 w-4" /> Reactivar
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onSelect={() => {
                                                                    if (confirm(`⚠ ¿Eliminar "${plan.name}" PERMANENTEMENTE?\n\nSolo funciona si no tiene membresías asociadas. Si tiene, usa "Desactivar".`)) {
                                                                        hardDeletePlanMutation.mutate({ id: plan.id });
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{editingPlan ? 'Editar Paquete' : 'Crear Nuevo Paquete'}</DialogTitle>
                                <DialogDescription>
                                    Los cambios de precio y vigencia se reflejan en la landing. La vigencia actualiza el fin de membresías activas.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nombre</Label>
                                        <Input id="name" {...register('name')} placeholder="Ej. Pack 10 Clases" />
                                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Precio (MXN)</Label>
                                        <Input id="price" type="number" step="0.01" {...register('price')} placeholder="0.00" />
                                        {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Descripción</Label>
                                    <Input id="description" {...register('description')} placeholder="Breve descripción para el cliente" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="durationDays">Vigencia (días)</Label>
                                        <Input id="durationDays" type="number" {...register('durationDays')} placeholder="30" />
                                        {errors.durationDays && <p className="text-xs text-destructive">{errors.durationDays.message}</p>}
                                        {editingPlan && (
                                            <p className="text-xs text-muted-foreground">
                                                Se recalculará el fin de las membresías activas del paquete.
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="classLimit">Clases incluidas (vacío = ilimitado)</Label>
                                        <Input id="classLimit" type="number" {...register('classLimit')} placeholder="Ilimitado" />
                                        {errors.classLimit && <p className="text-xs text-destructive">{errors.classLimit.message as string}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="features">Características (una por línea)</Label>
                                    <Textarea
                                        id="features"
                                        {...register('features')}
                                        placeholder={'Acceso a todas las sedes\nToalla incluida\n...'}
                                        rows={4}
                                    />
                                </div>

                                <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                                    <Label htmlFor="isActive" className="flex flex-col space-y-1">
                                        <span>Paquete Activo</span>
                                        <span className="font-normal text-xs text-muted-foreground">
                                            Visible en la landing y disponible para compra
                                        </span>
                                    </Label>
                                    <Controller
                                        control={control}
                                        name="isActive"
                                        render={({ field }) => (
                                            <Switch id="isActive" checked={!!field.value} onCheckedChange={field.onChange} />
                                        )}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sortOrder">Orden de visualización</Label>
                                    <Input id="sortOrder" type="number" {...register('sortOrder')} placeholder="0" />
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting || savePlanMutation.isPending}>
                                        {(isSubmitting || savePlanMutation.isPending) && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {editingPlan ? 'Guardar cambios' : 'Crear paquete'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </AdminLayout>
        </AuthGuard>
    );
}
