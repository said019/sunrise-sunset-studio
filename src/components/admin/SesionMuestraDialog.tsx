import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { PhoneInput } from '@/components/PhoneInput';
import { DEFAULT_COUNTRY, findCountryByISO } from '@/lib/country-codes';

interface SesionMuestraDialogProps {
    classId: string;
    onBooked?: () => void;
}

export function SesionMuestraDialog({ classId, onBooked }: SesionMuestraDialogProps) {
    const [open, setOpen] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [countryISO, setCountryISO] = useState<string>(DEFAULT_COUNTRY.iso);
    const [phoneNational, setPhoneNational] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const country = findCountryByISO(countryISO) ?? DEFAULT_COUNTRY;
    const fullPhone = `${country.dialCode}${phoneNational}`;

    const reset = () => {
        setDisplayName('');
        setCountryISO(DEFAULT_COUNTRY.iso);
        setPhoneNational('');
        setPaymentMethod('cash');
    };

    const mutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.post('/users/prospect-booking', {
                displayName,
                phone: fullPhone,
                classId,
                paymentMethod,
            });
            return data;
        },
        onSuccess: () => {
            toast({ title: 'Sesión muestra agendada', description: `${displayName} quedó reservada.` });
            queryClient.invalidateQueries({ queryKey: ['attendees', classId] });
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            queryClient.invalidateQueries({ queryKey: ['prospects'] });
            setOpen(false);
            reset();
            onBooked?.();
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    const canSubmit = displayName.trim().length >= 2 && phoneNational.length >= 6;

    return (
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                    <Sparkles className="mr-2 h-4 w-4" /> Sesión Muestra
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle>Agendar sesión muestra</DialogTitle>
                    <DialogDescription>
                        Solo nombre y teléfono. Se cobra al plan de prueba configurado.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="sm-name">Nombre <span className="text-destructive">*</span></Label>
                        <Input id="sm-name" placeholder="Nombre y apellido"
                            value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sm-phone">Teléfono <span className="text-destructive">*</span></Label>
                        <PhoneInput
                            id="sm-phone"
                            countryISO={countryISO}
                            phoneNational={phoneNational}
                            onCountryChange={setCountryISO}
                            onPhoneChange={setPhoneNational}
                        />
                        <p className="text-xs text-muted-foreground">
                            Se guardará como <span className="font-mono">{country.dialCode}{phoneNational || '…'}</span>
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sm-pay">Método de pago</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger id="sm-pay">
                                <SelectValue placeholder="Selecciona método" />
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
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Agendar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
