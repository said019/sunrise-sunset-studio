import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api, { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
    Loader2, ArrowLeft, Mail, Phone, Calendar, Heart,
    MessageSquare, User, CreditCard, DollarSign, UserX, Trash2, Power, Pencil, Check, X,
    Coins, Plus, Minus, KeyRound, Copy
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MonthBookingDialog } from '@/components/admin/MonthBookingDialog';
import { formatDbDate } from '@/lib/date';

const statusLabels: Record<string, string> = {
    active: 'Activo',
    expired: 'Vencido',
    cancelled: 'Cancelado',
    pending_payment: 'Pago pendiente',
    pending_activation: 'Pendiente',
    paused: 'Pausado',
};

const statusColors: Record<string, string> = {
    active: 'bg-coral/10 text-coral',
    expired: 'bg-red-100 text-red-800',
    cancelled: 'bg-muted text-foreground',
    pending_payment: 'bg-yellow-100 text-yellow-800',
    pending_activation: 'bg-info/10 text-info',
    paused: 'bg-orange-100 text-orange-800',
};

const noteSchema = z.object({
    content: z.string().min(1, 'La nota no puede estar vacia'),
});

type NoteForm = z.infer<typeof noteSchema>;

export default function ClientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<NoteForm>({
        resolver: zodResolver(noteSchema),
    });

    const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);
    const [creditsMembership, setCreditsMembership] = useState<any | null>(null);
    const [creditsValue, setCreditsValue] = useState(0);

    const [editingMembershipId, setEditingMembershipId] = useState<string | null>(null);
    const [editingEndDate, setEditingEndDate] = useState('');

    const updateEndDateMutation = useMutation({
        mutationFn: async ({ membershipId, end_date }: { membershipId: string; end_date: string }) => {
            const { data } = await api.patch(`/memberships/${membershipId}`, { end_date });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', id] });
            toast({ title: 'Fecha actualizada', description: 'Los avisos de vencimiento se reiniciaron automáticamente.' });
            setEditingMembershipId(null);
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    const creditsMutation = useMutation({
        mutationFn: async ({ membershipId, classes_remaining }: { membershipId: string; classes_remaining: number }) => {
            const { data } = await api.patch(`/memberships/${membershipId}/credits`, { classes_remaining });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', id] });
            toast({ title: 'Créditos actualizados' });
            setCreditsDialogOpen(false);
            setCreditsMembership(null);
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    const openCreditsDialog = (m: any) => {
        setCreditsMembership(m);
        setCreditsValue(m.credits_remaining ?? m.classes_remaining ?? 0);
        setCreditsDialogOpen(true);
    };

    const { data: client, isLoading } = useQuery({
        queryKey: ['client', id],
        queryFn: async () => {
            const { data } = await api.get(`/admin/clients/${id}/full-profile`);
            return data;
        },
        enabled: !!id,
    });

    const addNoteMutation = useMutation({
        mutationFn: async (data: NoteForm) => {
            return await api.post(`/admin/clients/${id}/notes`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', id] });
            toast({ title: 'Nota agregada', description: 'La nota se ha guardado correctamente.' });
            reset();
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    // Mutation para cambiar estado activo/inactivo
    const toggleStatusMutation = useMutation({
        mutationFn: async (isActive: boolean) => {
            return await api.patch(`/users/${id}/status`, { is_active: isActive });
        },
        onSuccess: (_, isActive) => {
            queryClient.invalidateQueries({ queryKey: ['client', id] });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast({
                title: isActive ? 'Usuario activado' : 'Usuario desactivado',
                description: isActive ? 'El usuario puede iniciar sesión nuevamente.' : 'El usuario no podrá iniciar sesión.'
            });
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    // Mutation para eliminar usuario
    const deleteUserMutation = useMutation({
        mutationFn: async () => {
            return await api.delete(`/users/${id}`);
        },
        onSuccess: () => {
            toast({ title: 'Usuario eliminado', description: 'El usuario ha sido eliminado permanentemente.' });
            navigate('/admin/members');
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    // Mutation para reenviar credenciales (genera contraseña nueva)
    const [resendResult, setResendResult] = useState<{
        tempPassword: string;
        emailSent: boolean;
        whatsappSent: boolean;
    } | null>(null);
    const resendCredentialsMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.post(`/users/${id}/resend-credentials`);
            return data as { tempPassword: string; emailSent: boolean; whatsappSent: boolean };
        },
        onSuccess: (data) => {
            setResendResult(data);
            const channels = [
                data.emailSent ? 'email' : null,
                data.whatsappSent ? 'WhatsApp' : null,
            ].filter(Boolean);
            toast({
                title: channels.length ? 'Credenciales reenviadas' : 'Contraseña actualizada',
                description: channels.length
                    ? `Enviadas por ${channels.join(' y ')}.`
                    : 'No se pudo entregar por email/WhatsApp — copia la contraseña manualmente.',
            });
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    // Edit profile state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        displayName: '',
        phone: '',
        dateOfBirth: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        healthNotes: '',
    });

    const openEditDialog = () => {
        setEditForm({
            displayName: client?.display_name || '',
            phone: client?.phone || '',
            dateOfBirth: client?.date_of_birth ? client.date_of_birth.split('T')[0] : '',
            emergencyContactName: client?.emergency_contact_name || '',
            emergencyContactPhone: client?.emergency_contact_phone || '',
            healthNotes: client?.health_notes || '',
        });
        setEditDialogOpen(true);
    };

    const updateProfileMutation = useMutation({
        mutationFn: async (data: typeof editForm) => {
            // Mandar solo campos que cambiaron — evita revalidar (y rebotar)
            // datos legacy como phone en formatos no canónicos.
            const payload: Record<string, unknown> = {};
            const dn = data.displayName.trim();
            if (dn && dn !== (client?.display_name || '')) payload.displayName = dn;
            const ph = data.phone.trim();
            if (ph !== (client?.phone || '')) payload.phone = ph;
            const dob = data.dateOfBirth || '';
            const currentDob = client?.date_of_birth ? String(client.date_of_birth).split('T')[0] : '';
            if (dob !== currentDob) payload.dateOfBirth = dob || null;
            if (data.emergencyContactName !== (client?.emergency_contact_name || '')) {
                payload.emergencyContactName = data.emergencyContactName || null;
            }
            if (data.emergencyContactPhone !== (client?.emergency_contact_phone || '')) {
                payload.emergencyContactPhone = data.emergencyContactPhone || null;
            }
            if (data.healthNotes !== (client?.health_notes || '')) {
                payload.healthNotes = data.healthNotes || null;
            }
            if (Object.keys(payload).length === 0) {
                return { data: { user: client } };
            }
            return await api.put(`/users/${id}`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', id] });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast({ title: 'Datos actualizados', description: 'El perfil del alumno se ha actualizado correctamente.' });
            setEditDialogOpen(false);
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    // Birthday edit state
    const [editingBirthday, setEditingBirthday] = useState(false);
    const [birthdayValue, setBirthdayValue] = useState('');

    const updateBirthdayMutation = useMutation({
        mutationFn: async (dateOfBirth: string) => {
            return await api.put(`/users/${id}`, { dateOfBirth: dateOfBirth || null });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', id] });
            toast({ title: 'Fecha de nacimiento actualizada' });
            setEditingBirthday(false);
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    // Email edit state
    const [editingEmail, setEditingEmail] = useState(false);
    const [emailValue, setEmailValue] = useState('');

    const updateEmailMutation = useMutation({
        mutationFn: async (email: string) => {
            return await api.put(`/users/${id}`, { email });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', id] });
            toast({ title: 'Correo actualizado' });
            setEditingEmail(false);
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'No se pudo actualizar', description: getErrorMessage(error) });
        },
    });

    const cancelBookingMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            return await api.post(`/bookings/${bookingId}/cancel`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', id] });
            toast({ title: 'Reserva cancelada', description: 'Crédito devuelto al cliente.' });
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });


    const onSubmitNote = (data: NoteForm) => {
        addNoteMutation.mutate(data);
    };

    if (isLoading) {
        return (
            <AuthGuard requiredRoles={['admin', 'instructor']}>
                <AdminLayout>
                    <div className="space-y-6">
                        <Skeleton className="h-8 w-64" />
                        <div className="grid md:grid-cols-3 gap-6">
                            <Skeleton className="h-64 md:col-span-1" />
                            <Skeleton className="h-64 md:col-span-2" />
                        </div>
                    </div>
                </AdminLayout>
            </AuthGuard>
        );
    }

    if (!client) {
        return (
            <AuthGuard requiredRoles={['admin', 'instructor']}>
                <AdminLayout>
                    <div className="text-center py-12">
                        <h2 className="text-xl font-semibold">Miembro no encontrado</h2>
                        <Button variant="link" onClick={() => navigate('/admin/members')}>
                            Volver a la lista
                        </Button>
                    </div>
                </AdminLayout>
            </AuthGuard>
        );
    }

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CL';
    };

    return (
        <AuthGuard requiredRoles={['admin', 'instructor']}>
            <AdminLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/members')} className="rounded-xl hover:bg-muted/50">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-2xl font-heading font-bold">{client.display_name}</h1>
                            <p className="text-muted-foreground font-body flex items-center gap-2 text-sm">
                                Miembro desde {new Date(client.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant="outline"
                                className="rounded-xl font-body border-border/60 hover:border-amber/50 hover:text-amber transition-colors"
                                onClick={openEditDialog}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar Datos
                            </Button>
                            <MonthBookingDialog
                                userId={client.id}
                                userName={client.display_name}
                            />

                            <Button 
                                className="rounded-xl font-body bg-amber hover:bg-amber/90 text-white shadow-sm"
                                onClick={() => navigate(`/admin/members/${id}/physical-sale`)}
                            >
                                <DollarSign className="mr-2 h-4 w-4" />
                                Venta en Físico
                            </Button>

                            {/* Botón Desactivar/Activar */}
                            <Button
                                variant="outline"
                                className={`rounded-xl font-body transition-colors ${
                                    client.is_active === false 
                                        ? 'border-coral/50 text-coral hover:bg-coral/10' 
                                        : 'border-orange-300/60 text-orange-600 hover:bg-orange-50'
                                }`}
                                onClick={() => toggleStatusMutation.mutate(client.is_active === false)}
                                disabled={toggleStatusMutation.isPending}
                            >
                                <Power className="mr-2 h-4 w-4" />
                                {client.is_active === false ? 'Activar' : 'Desactivar'}
                            </Button>

                            {/* Botón Reenviar credenciales con confirmación */}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="rounded-xl font-body border-border/60 hover:border-amber/50 hover:text-amber transition-colors"
                                        disabled={resendCredentialsMutation.isPending}
                                    >
                                        {resendCredentialsMutation.isPending ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <KeyRound className="mr-2 h-4 w-4" />
                                        )}
                                        Reenviar credenciales
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="font-heading">¿Reenviar credenciales?</AlertDialogTitle>
                                        <AlertDialogDescription className="font-body">
                                            Se generará una <strong>nueva contraseña temporal</strong> para <strong>{client.display_name}</strong> y se le enviará por email
                                            {client.phone ? ' y WhatsApp' : ''}.
                                            La contraseña anterior dejará de funcionar.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl font-body">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => resendCredentialsMutation.mutate()}
                                            className="bg-amber text-white hover:bg-amber/90 rounded-xl font-body"
                                        >
                                            Sí, reenviar
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            {/* Botón Eliminar con confirmación */}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="rounded-xl font-body border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Eliminar
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="font-heading">¿Eliminar usuario permanentemente?</AlertDialogTitle>
                                        <AlertDialogDescription className="font-body">
                                            Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta de <strong>{client.display_name}</strong> y todos sus datos asociados (membresías, reservaciones, etc.).
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl font-body">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => deleteUserMutation.mutate()}
                                            className="bg-red-600 text-white hover:bg-red-700 rounded-xl font-body"
                                        >
                                            {deleteUserMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-12 gap-6">
                        {/* Sidebar / Profile Card */}
                        <div className="md:col-span-4 lg:col-span-3 space-y-6">
                            <Card className="rounded-2xl border-border/40 overflow-hidden">
                                <CardContent className="pt-6 flex flex-col items-center text-center">
                                    <Avatar className="h-24 w-24 mb-4 ring-2 ring-amber/20 ring-offset-2">
                                        <AvatarImage src={client.photo_url} />
                                        <AvatarFallback className="text-lg bg-amber/10 text-amber font-heading">{getInitials(client.display_name)}</AvatarFallback>
                                    </Avatar>
                                    <h2 className="text-xl font-heading font-bold">{client.display_name}</h2>

                                    {/* Account Status Badge */}
                                    {client.is_active === false && (
                                        <Badge variant="destructive" className="mt-2">
                                            <Power className="h-3 w-3 mr-1" />
                                            Usuario Desactivado
                                        </Badge>
                                    )}

                                    {/* Current Membership Status */}
                                    {client.currentMembership ? (
                                        <Badge className={`mt-2 ${statusColors[client.currentMembership.status] || ''}`}>
                                            {statusLabels[client.currentMembership.status] || client.currentMembership.status}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="mt-2 text-muted-foreground">
                                            Sin membresia
                                        </Badge>
                                    )}

                                    {/* Current Plan Info */}
                                    {client.currentMembership && (
                                        <div className="w-full mt-4 p-3.5 bg-coral/5 rounded-xl text-sm text-left border border-coral/10">
                                            <div className="flex items-center gap-2 font-semibold mb-2 font-heading">
                                                <CreditCard className="h-4 w-4 text-coral" /> Plan Actual
                                            </div>
                                            <p className="font-medium font-body">{client.currentMembership.plan_name}</p>
                                            <div className="text-muted-foreground mt-1 space-y-1 font-body">
                                                <p>Vence: {formatDbDate(client.currentMembership.end_date)}</p>
                                                <p>
                                                    Creditos: {
                                                        client.currentMembership.class_limit === null || client.currentMembership.class_limit === undefined
                                                            ? 'Ilimitado'
                                                            : client.currentMembership.class_limit > 0
                                                                ? `${client.currentMembership.classes_remaining ?? 0} / ${client.currentMembership.class_limit}`
                                                                : 'Solo inscripción'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="w-full mt-6 space-y-4 text-left">
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground font-body">
                                            <Mail className="h-4 w-4 text-amber/70" />
                                            {editingEmail ? (
                                                <div className="flex items-center gap-1 flex-1">
                                                    <Input
                                                        type="email"
                                                        value={emailValue}
                                                        onChange={(e) => setEmailValue(e.target.value)}
                                                        placeholder="correo@ejemplo.com"
                                                        className="h-7 text-xs"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && emailValue && emailValue.includes('@')) {
                                                                updateEmailMutation.mutate(emailValue.trim().toLowerCase());
                                                            }
                                                            if (e.key === 'Escape') setEditingEmail(false);
                                                        }}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 shrink-0"
                                                        disabled={!emailValue || !emailValue.includes('@') || updateEmailMutation.isPending}
                                                        onClick={() => updateEmailMutation.mutate(emailValue.trim().toLowerCase())}
                                                    >
                                                        <Check className="h-3 w-3 text-green-600" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 shrink-0"
                                                        onClick={() => setEditingEmail(false)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span
                                                    className="cursor-pointer hover:text-foreground flex items-center gap-1 group truncate"
                                                    onClick={() => {
                                                        setEmailValue(client.email || '');
                                                        setEditingEmail(true);
                                                    }}
                                                    title={client.email || 'Click para agregar correo'}
                                                >
                                                    <span className="truncate">{client.email || 'Sin correo'}</span>
                                                    <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground font-body">
                                            <Phone className="h-4 w-4 text-amber/70" />
                                            <span>{client.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground font-body">
                                            <Calendar className="h-4 w-4 text-amber/70" />
                                            {editingBirthday ? (
                                                <div className="flex items-center gap-1 flex-1">
                                                    <Input
                                                        type="date"
                                                        value={birthdayValue}
                                                        onChange={(e) => setBirthdayValue(e.target.value)}
                                                        className="h-7 text-xs"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 shrink-0"
                                                        onClick={() => updateBirthdayMutation.mutate(birthdayValue)}
                                                        disabled={updateBirthdayMutation.isPending}
                                                    >
                                                        <Check className="h-3 w-3 text-green-600" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 shrink-0"
                                                        onClick={() => setEditingBirthday(false)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span
                                                    className="cursor-pointer hover:text-foreground flex items-center gap-1 group"
                                                    onClick={() => {
                                                        setBirthdayValue(client.date_of_birth ? client.date_of_birth.split('T')[0] : '');
                                                        setEditingBirthday(true);
                                                    }}
                                                >
                                                    {client.date_of_birth ? new Date(client.date_of_birth).toLocaleDateString() : 'Sin fecha nac.'}
                                                    <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {client.health_notes && (
                                        <div className="w-full mt-6 p-3.5 bg-red-50 text-red-800 rounded-xl text-sm text-left border border-red-100">
                                            <div className="flex items-center gap-2 font-semibold mb-1 font-heading">
                                                <Heart className="h-4 w-4" /> Notas de Salud
                                            </div>
                                            <p className="font-body">{client.health_notes}</p>
                                        </div>
                                    )}

                                    {/* Loyalty Points */}
                                    <div className="w-full mt-4 p-3.5 bg-amber/5 text-amber rounded-xl text-sm text-left border border-amber/10">
                                        <p className="font-semibold font-heading">Puntos de Lealtad</p>
                                        <p className="text-2xl font-bold font-heading">{client.loyaltyPoints || 0}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Emergency Contact */}
                            {(client.emergency_contact_name || client.emergency_contact_phone) && (
                                <Card className="rounded-2xl border-border/40">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-heading font-medium">Contacto de Emergencia</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-2 font-body">
                                        <div className="font-medium">{client.emergency_contact_name}</div>
                                        <div className="text-muted-foreground">{client.emergency_contact_phone}</div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Main Content Area */}
                        <div className="md:col-span-8 lg:col-span-9 space-y-6">
                            <Tabs defaultValue="memberships">
                                <TabsList className="rounded-xl bg-muted/50">
                                    <TabsTrigger value="memberships" className="rounded-lg font-body data-[state=active]:bg-amber data-[state=active]:text-white">Membresias</TabsTrigger>
                                    <TabsTrigger value="history" className="rounded-lg font-body data-[state=active]:bg-amber data-[state=active]:text-white">Historial Clases</TabsTrigger>
                                    <TabsTrigger value="notes" className="rounded-lg font-body data-[state=active]:bg-amber data-[state=active]:text-white">Notas Internas</TabsTrigger>
                                </TabsList>

                                {/* Memberships Tab */}
                                <TabsContent value="memberships" className="space-y-4 mt-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-heading font-semibold">Historial de Membresias</h3>
                                    </div>

                                    {client.memberships?.length > 0 ? (
                                        <div className="space-y-3">
                                            {client.memberships.map((m: any) => (
                                                <Card key={m.id} className="rounded-xl border-border/40 hover:border-border/60 transition-colors">
                                                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                                        <div>
                                                            <div className="font-semibold font-heading flex items-center gap-2">
                                                                {m.plan_name}
                                                                <Badge className={`rounded-lg text-xs font-body ${statusColors[m.status] || 'bg-muted'}`}>
                                                                    {statusLabels[m.status] || m.status}
                                                                </Badge>
                                                            </div>
                                                            <div className="text-sm text-muted-foreground mt-1 font-body">
                                                                {m.start_date && m.end_date ? (
                                                                    <span className="flex items-center gap-1 flex-wrap">
                                                                        Inicio: {formatDbDate(m.start_date)} —{' '}
                                                                        {editingMembershipId === m.id ? (
                                                                            <span className="flex items-center gap-1">
                                                                                Fin:
                                                                                <Input
                                                                                    type="date"
                                                                                    value={editingEndDate}
                                                                                    onChange={e => setEditingEndDate(e.target.value)}
                                                                                    className="h-6 w-36 px-1 py-0 text-xs rounded"
                                                                                    autoFocus
                                                                                />
                                                                                <Button
                                                                                    size="sm"
                                                                                    className="h-6 px-2 text-xs bg-amber hover:bg-amber/90"
                                                                                    disabled={updateEndDateMutation.isPending || !editingEndDate}
                                                                                    onClick={() => updateEndDateMutation.mutate({ membershipId: m.id, end_date: editingEndDate })}
                                                                                >
                                                                                    {updateEndDateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="h-6 px-1 text-xs"
                                                                                    onClick={() => setEditingMembershipId(null)}
                                                                                >
                                                                                    <X className="h-3 w-3" />
                                                                                </Button>
                                                                            </span>
                                                                        ) : (
                                                                            <span
                                                                                className="cursor-pointer hover:underline flex items-center gap-1"
                                                                                onClick={() => {
                                                                                    setEditingMembershipId(m.id);
                                                                                    setEditingEndDate(String(m.end_date).split('T')[0]);
                                                                                }}
                                                                            >
                                                                                Fin: {formatDbDate(m.end_date)}
                                                                                <Pencil className="h-3 w-3 opacity-50" />
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                ) : (
                                                                    'Fechas pendientes'
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right font-body flex flex-col items-end gap-2">
                                                            <div className="text-sm font-medium">
                                                                {m.class_limit === null || m.class_limit === undefined
                                                                    ? 'Ilimitado'
                                                                    : m.class_limit > 0
                                                                        ? `${m.credits_remaining ?? m.classes_remaining ?? 0} / ${m.credits_total ?? m.class_limit} creditos`
                                                                        : 'Solo inscripción'}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                ${m.price_paid ?? m.plan_price ?? 0} MXN
                                                            </div>
                                                            {m.status === 'active' && (m.class_limit ?? 0) > 0 && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="mt-1"
                                                                    onClick={() => openCreditsDialog(m)}
                                                                >
                                                                    <Coins className="mr-2 h-3.5 w-3.5" /> Ajustar
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center border rounded-xl bg-muted/10 text-muted-foreground font-body border-dashed border-border/50">
                                            No hay historial de membresias.
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Notes Tab */}
                                <TabsContent value="notes" className="mt-4">
                                    <div className="space-y-6">
                                        <Card className="rounded-2xl border-border/40">
                                            <CardHeader>
                                                <CardTitle className="text-base font-heading">Agregar Nota</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <form onSubmit={handleSubmit(onSubmitNote)} className="space-y-4">
                                                    <Textarea
                                                        {...register('content')}
                                                        placeholder="Escribe una nota interna sobre el cliente..."
                                                        className="rounded-xl font-body"
                                                    />
                                                    <div className="flex justify-end">
                                                        <Button type="submit" disabled={isSubmitting} size="sm" className="rounded-xl font-body bg-amber hover:bg-amber/90">
                                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                            Guardar Nota
                                                        </Button>
                                                    </div>
                                                </form>
                                            </CardContent>
                                        </Card>

                                        <div className="space-y-4">
                                            {client.notes?.length > 0 ? (
                                                client.notes.map((note: any) => (
                                                    <div key={note.id} className="flex gap-4 p-4 border border-border/40 rounded-xl bg-card hover:border-border/60 transition-colors">
                                                        <div className="h-8 w-8 rounded-lg bg-coral/10 flex items-center justify-center shrink-0">
                                                            <MessageSquare className="h-4 w-4 text-coral" />
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex justify-between items-start">
                                                                <div className="text-sm font-medium text-muted-foreground font-body">
                                                                    {note.author_name || 'Admin'} {note.created_by === user?.id ? '(Tu)' : ''}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground font-body">
                                                                    {new Date(note.created_at).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                            <p className="text-sm font-body">{note.note || note.content}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center border rounded-xl bg-muted/10 text-muted-foreground font-body border-dashed border-border/50">
                                                    No hay notas internas.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* History Tab */}
                                <TabsContent value="history" className="mt-4">
                                    <Card className="rounded-2xl border-border/40">
                                        <CardContent className="p-6">
                                            <h3 className="text-lg font-heading font-semibold mb-4">Clases (próximas primero)</h3>
                                            {client.recentBookings?.length > 0 ? (
                                                <div className="space-y-3">
                                                    {client.recentBookings.map((b: any) => (
                                                        <div key={b.id} className="flex items-center justify-between p-3.5 bg-muted/20 rounded-xl border border-border/30 hover:border-border/50 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-8 w-8 rounded-lg bg-amber/10 flex items-center justify-center">
                                                                    <Calendar className="h-4 w-4 text-amber" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium font-body text-sm">{b.class_name}</div>
                                                                    <div className="text-xs text-muted-foreground font-body">
                                                                        {formatDbDate(b.date)} - {b.start_time?.substring(0, 5)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge className={`rounded-lg text-xs font-body ${statusColors[b.status] || 'bg-muted'}`}>
                                                                    {b.status === 'confirmed' ? 'Confirmada' :
                                                                        b.status === 'checked_in' ? 'Asistió' :
                                                                            b.status === 'cancelled' ? 'Cancelada' :
                                                                                b.status === 'no_show' ? 'No asistió' :
                                                                                    b.status}
                                                                </Badge>
                                                                {(b.status === 'confirmed' || b.status === 'waitlist') && (
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                                                <X className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent className="rounded-2xl">
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>¿Cancelar reserva?</AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    Se devolverá el crédito al cliente automáticamente.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Volver</AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    onClick={() => cancelBookingMutation.mutate(b.id)}
                                                                                    className="bg-destructive hover:bg-destructive/90"
                                                                                >
                                                                                    Sí, cancelar
                                                                                </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground font-body text-sm">No hay clases registradas recientemente.</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>

                {/* Edit Profile Dialog */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogContent className="rounded-2xl sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-heading">Editar Datos del Alumno</DialogTitle>
                            <DialogDescription className="font-body">
                                Modifica los datos de {client.display_name}.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                updateProfileMutation.mutate(editForm);
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="edit-name" className="font-body">Nombre completo</Label>
                                <Input
                                    id="edit-name"
                                    value={editForm.displayName}
                                    onChange={(e) => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                                    className="rounded-xl font-body"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-phone" className="font-body">Teléfono</Label>
                                <Input
                                    id="edit-phone"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                                    className="rounded-xl font-body"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-dob" className="font-body">Fecha de nacimiento</Label>
                                <Input
                                    id="edit-dob"
                                    type="date"
                                    value={editForm.dateOfBirth}
                                    onChange={(e) => setEditForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                                    className="rounded-xl font-body"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-ec-name" className="font-body">Contacto emergencia</Label>
                                    <Input
                                        id="edit-ec-name"
                                        value={editForm.emergencyContactName}
                                        onChange={(e) => setEditForm(f => ({ ...f, emergencyContactName: e.target.value }))}
                                        placeholder="Nombre"
                                        className="rounded-xl font-body"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-ec-phone" className="font-body">Tel. emergencia</Label>
                                    <Input
                                        id="edit-ec-phone"
                                        value={editForm.emergencyContactPhone}
                                        onChange={(e) => setEditForm(f => ({ ...f, emergencyContactPhone: e.target.value }))}
                                        placeholder="Teléfono"
                                        className="rounded-xl font-body"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-health" className="font-body">Notas de salud</Label>
                                <Textarea
                                    id="edit-health"
                                    value={editForm.healthNotes}
                                    onChange={(e) => setEditForm(f => ({ ...f, healthNotes: e.target.value }))}
                                    placeholder="Alergias, lesiones, condiciones médicas..."
                                    className="rounded-xl font-body"
                                    rows={3}
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditDialogOpen(false)}
                                    className="rounded-xl font-body"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={updateProfileMutation.isPending}
                                    className="rounded-xl font-body bg-amber hover:bg-amber/90 text-white"
                                >
                                    {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar Cambios
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={creditsDialogOpen} onOpenChange={setCreditsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Ajustar Créditos</DialogTitle>
                            <DialogDescription>
                                {creditsMembership?.plan_name}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="text-sm text-muted-foreground">
                                Créditos actuales: <span className="font-medium text-foreground">
                                    {creditsMembership?.credits_remaining ?? creditsMembership?.classes_remaining ?? 0} / {creditsMembership?.credits_total ?? creditsMembership?.class_limit ?? 0}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="creditsValueDetail">Nuevo balance</Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCreditsValue((v) => Math.max(0, v - 1))}
                                        disabled={creditsValue <= 0}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <Input
                                        id="creditsValueDetail"
                                        type="number"
                                        min={0}
                                        max={creditsMembership?.class_limit ?? undefined}
                                        value={creditsValue}
                                        onChange={(e) => setCreditsValue(Math.max(0, Number(e.target.value) || 0))}
                                        className="text-center"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                            const max = creditsMembership?.class_limit;
                                            setCreditsValue((v) => (max ? Math.min(max, v + 1) : v + 1));
                                        }}
                                        disabled={!!creditsMembership?.class_limit && creditsValue >= creditsMembership.class_limit}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                {creditsMembership?.class_limit ? (
                                    <p className="text-xs text-muted-foreground">Máximo del plan: {creditsMembership.class_limit}</p>
                                ) : null}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreditsDialogOpen(false)}>Cancelar</Button>
                            <Button
                                onClick={() => creditsMembership?.id && creditsMutation.mutate({
                                    membershipId: creditsMembership.id,
                                    classes_remaining: creditsValue,
                                })}
                                disabled={creditsMutation.isPending || creditsValue === (creditsMembership?.credits_remaining ?? creditsMembership?.classes_remaining ?? 0)}
                            >
                                {creditsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Diálogo de resultado de reenvío de credenciales */}
                <Dialog open={!!resendResult} onOpenChange={(open) => !open && setResendResult(null)}>
                    <DialogContent className="max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="font-heading">Credenciales reenviadas</DialogTitle>
                            <DialogDescription className="font-body">
                                Se generó una nueva contraseña temporal. La anterior ya no funciona.
                            </DialogDescription>
                        </DialogHeader>

                        {resendResult && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Contraseña temporal</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 p-3 bg-muted rounded-md font-mono text-base break-all">
                                            {resendResult.tempPassword}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                navigator.clipboard.writeText(resendResult.tempPassword);
                                                toast({ title: 'Copiada', description: 'Contraseña en el portapapeles.' });
                                            }}
                                            className="shrink-0"
                                            title="Copiar"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-sm">
                                    <div className={resendResult.emailSent ? 'text-success' : 'text-destructive'}>
                                        {resendResult.emailSent
                                            ? '✓ Email enviado'
                                            : (client.email
                                                ? '✗ No se pudo enviar el email — copia la contraseña manualmente'
                                                : '— Sin email registrado')}
                                    </div>
                                    <div className={resendResult.whatsappSent ? 'text-success' : 'text-destructive'}>
                                        {resendResult.whatsappSent
                                            ? '✓ WhatsApp enviado'
                                            : (client.phone
                                                ? '✗ No se pudo enviar el WhatsApp — copia la contraseña manualmente'
                                                : '— Sin teléfono registrado')}
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button onClick={() => setResendResult(null)} className="rounded-xl">
                                Cerrar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </AdminLayout>
        </AuthGuard>
    );
}
