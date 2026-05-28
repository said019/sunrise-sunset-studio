/**
 * Admin — Agregar Miembro
 *
 * Único flujo: crear cuenta nueva. El admin captura nombre, email, teléfono,
 * y opcionalmente fecha de nacimiento; el backend genera contraseña temporal,
 * manda email de bienvenida y (si está configurado) WhatsApp con la temp.
 * Después de creada la cuenta, el admin puede venderle un plan desde
 * Punto de Venta o asignar membresía manualmente desde Membresías.
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import api, { getErrorMessage } from '@/lib/api';
import type { User } from '@/types/auth';
import { ArrowLeft, UserCheck } from 'lucide-react';
import { NewClientForm } from '@/components/admin/members/NewClientForm';

interface CreateMemberResponse {
    user: User;
    tempPassword?: string;
    emailSent?: boolean;
    whatsappSent?: boolean;
}

export default function MemberNew() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [result, setResult] = useState<CreateMemberResponse | null>(null);

    const createMutation = useMutation({
        mutationFn: async (payload: any) => {
            const finalPayload = {
                ...payload,
                password: payload.password ? payload.password : undefined,
            };
            const { data } = await api.post<CreateMemberResponse>('/users', finalPayload);
            return data;
        },
        onSuccess: (data) => {
            toast({
                title: '✅ Cliente creado',
                description: 'La cuenta se creó correctamente. Ahora puedes asignarle una membresía.',
            });
            setResult(data);
        },
        onError: (error) => {
            toast({
                variant: 'destructive',
                title: 'Error al crear cliente',
                description: getErrorMessage(error),
            });
        },
    });

    const handleSubmit = (data: any) => {
        createMutation.mutate(data);
    };

    // Pantalla de éxito
    if (result) {
        return (
            <AuthGuard requiredRoles={['admin']}>
                <AdminLayout>
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" asChild>
                                <Link to="/admin/members">
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-heading font-bold">Cliente creado exitosamente</h1>
                            </div>
                        </div>

                        <Card className="border-success/30 bg-success/10">
                            <CardHeader>
                                <CardTitle className="text-success flex items-center gap-2">
                                    <UserCheck className="h-5 w-5" />
                                    Cuenta creada
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-success">
                                        <strong>Cliente:</strong> {result.user.display_name}
                                    </p>
                                    <p className="text-sm text-success">
                                        <strong>Email:</strong> {result.user.email}
                                    </p>
                                    <p className="text-sm text-success">
                                        <strong>Teléfono:</strong> {result.user.phone}
                                    </p>
                                </div>

                                {result.tempPassword && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-success">
                                            Contraseña temporal:
                                        </p>
                                        <div className="rounded-md bg-white/70 p-3 font-mono text-base text-success">
                                            {result.tempPassword}
                                        </div>
                                        <p className="text-xs text-success">
                                            Comparte esta contraseña con el cliente para su primer acceso.
                                        </p>
                                    </div>
                                )}

                                <div className="rounded-md border bg-white/70 p-3 space-y-2 text-sm">
                                    <p className="font-medium">Notificaciones automáticas:</p>
                                    <div className={result.emailSent ? 'text-success' : 'text-destructive'}>
                                        {result.emailSent
                                            ? '✓ Email de bienvenida enviado'
                                            : '✗ No se pudo enviar el email — entrega la contraseña manualmente'}
                                    </div>
                                    <div className={result.whatsappSent ? 'text-success' : 'text-destructive'}>
                                        {result.whatsappSent
                                            ? '✓ WhatsApp con contraseña temporal enviado'
                                            : '✗ No se pudo enviar el WhatsApp — entrega la contraseña manualmente'}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-success/30">
                                    <p className="text-sm text-success mb-3">
                                        <strong>Siguientes pasos:</strong>
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-success">
                                        <li>Vende una membresía desde "Punto de Venta"</li>
                                        <li>O activa una membresía manualmente desde "Membresías"</li>
                                    </ul>
                                </div>

                                <div className="flex gap-2 pt-4 flex-wrap">
                                    <Button onClick={() => navigate('/admin/members')}>
                                        Ver todos los miembros
                                    </Button>
                                    <Button variant="outline" onClick={() => navigate(`/admin/members/${result.user.id}`)}>
                                        Ver perfil del cliente
                                    </Button>
                                    <Button variant="outline" onClick={() => setResult(null)}>
                                        Agregar otro
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </AdminLayout>
            </AuthGuard>
        );
    }

    // Pantalla de formulario
    return (
        <AuthGuard requiredRoles={['admin']}>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link to="/admin/members">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-heading font-bold">Agregar miembro</h1>
                            <p className="text-muted-foreground">
                                Captura los datos del cliente. Se le creará su cuenta y podrás venderle un plan
                                desde Punto de Venta.
                            </p>
                        </div>
                    </div>

                    <NewClientForm
                        onSubmit={handleSubmit}
                        isLoading={createMutation.isPending}
                        onCancel={() => navigate('/admin/members')}
                    />
                </div>
            </AdminLayout>
        </AuthGuard>
    );
}
