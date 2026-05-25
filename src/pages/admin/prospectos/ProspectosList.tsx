import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { Loader2, Search, UserCheck } from 'lucide-react';

interface Prospect {
    id: string;
    display_name: string;
    phone: string;
    created_at: string;
    converted_at: string | null;
    class_name: string | null;
    class_date: string | null;
}
interface ProspectsResponse {
    prospects: Prospect[];
    pagination: { total: number };
}
interface Plan { id: string; name: string; price: number; }

export default function ProspectosList() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const debouncedSearch = useDebounce(search, 500);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [convertTarget, setConvertTarget] = useState<Prospect | null>(null);
    const [email, setEmail] = useState('');
    const [planId, setPlanId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');

    const { data, isLoading } = useQuery<ProspectsResponse>({
        queryKey: ['prospects', debouncedSearch, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (debouncedSearch) params.append('search', debouncedSearch);
            params.append('limit', '10');
            params.append('offset', String(page * 10));
            const { data } = await api.get(`/users/prospects?${params.toString()}`);
            return data;
        },
        placeholderData: (prev) => prev,
    });

    const { data: plans } = useQuery<Plan[]>({
        queryKey: ['plans', 'active'],
        queryFn: async () => (await api.get('/plans')).data,
        enabled: !!convertTarget,
    });

    const openConvert = (p: Prospect) => {
        setConvertTarget(p);
        setEmail('');
        setPlanId('');
        setPaymentMethod('cash');
    };

    const convertMutation = useMutation({
        mutationFn: async () => {
            if (!convertTarget) return;
            const { data } = await api.post(`/users/${convertTarget.id}/convert`, {
                email,
                planId,
                paymentMethod,
            });
            return data;
        },
        onSuccess: () => {
            toast({ title: 'Convertida', description: 'La prospecta ahora es clienta.' });
            queryClient.invalidateQueries({ queryKey: ['prospects'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setConvertTarget(null);
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    const canConvert = /\S+@\S+\.\S+/.test(email) && !!planId;

    return (
        <AuthGuard requiredRoles={['admin']}>
            <AdminLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-heading font-bold">Prospectos</h1>
                        <p className="text-muted-foreground">
                            Chicas que vinieron a sesión muestra. Conviértelas en clientas cuando paguen su membresía.
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o teléfono..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Teléfono</TableHead>
                                    <TableHead>Clase</TableHead>
                                    <TableHead>Alta</TableHead>
                                    <TableHead>Estatus</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                    </TableCell></TableRow>
                                ) : data?.prospects.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No hay prospectos todavía.
                                    </TableCell></TableRow>
                                ) : (
                                    data?.prospects.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.display_name}</TableCell>
                                            <TableCell>{p.phone}</TableCell>
                                            <TableCell>
                                                {p.class_name
                                                    ? `${p.class_name}${p.class_date ? ' · ' + String(p.class_date).split('T')[0] : ''}`
                                                    : '—'}
                                            </TableCell>
                                            <TableCell>{String(p.created_at).split('T')[0]}</TableCell>
                                            <TableCell>
                                                {p.converted_at
                                                    ? <Badge variant="secondary">Convertida</Badge>
                                                    : <Badge>Pendiente</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="outline" onClick={() => openConvert(p)}>
                                                    <UserCheck className="mr-2 h-4 w-4" /> Convertir a clienta
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {data && data.pagination.total > 10 && (
                        <div className="flex items-center justify-end space-x-2">
                            <Button variant="outline" size="sm"
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}>Anterior</Button>
                            <div className="text-sm text-muted-foreground">
                                Página {page + 1} de {Math.ceil(data.pagination.total / 10)}
                            </div>
                            <Button variant="outline" size="sm"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={(page + 1) * 10 >= data.pagination.total}>Siguiente</Button>
                        </div>
                    )}
                </div>

                <Dialog open={!!convertTarget} onOpenChange={(o) => { if (!o) setConvertTarget(null); }}>
                    <DialogContent className="sm:max-w-[440px]">
                        <DialogHeader>
                            <DialogTitle>Convertir a clienta</DialogTitle>
                            <DialogDescription>
                                {convertTarget?.display_name} · {convertTarget?.phone}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="cv-email">Email <span className="text-destructive">*</span></Label>
                                <Input id="cv-email" type="email" placeholder="cliente@email.com"
                                    value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cv-plan">Membresía a asignar <span className="text-destructive">*</span></Label>
                                <Select value={planId} onValueChange={setPlanId}>
                                    <SelectTrigger id="cv-plan">
                                        <SelectValue placeholder="Selecciona un plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {plans?.map((pl) => (
                                            <SelectItem key={pl.id} value={pl.id}>
                                                {pl.name} (${pl.price})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cv-pay">Método de pago</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger id="cv-pay">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Efectivo</SelectItem>
                                        <SelectItem value="transfer">Transferencia</SelectItem>
                                        <SelectItem value="card">Tarjeta</SelectItem>
                                        <SelectItem value="online">Pago en línea</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setConvertTarget(null)}>Cancelar</Button>
                            <Button onClick={() => convertMutation.mutate()}
                                disabled={!canConvert || convertMutation.isPending}>
                                {convertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Convertir
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </AdminLayout>
        </AuthGuard>
    );
}
