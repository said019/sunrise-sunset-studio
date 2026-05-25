import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PaymentInfo {
    id: string;
    status: string;
    amount: number;
    cardBrand?: string | null;
    cardLast4?: string | null;
    completedAt?: string | null;
    membershipId?: string | null;
}

// Página de retorno tras Clip Checkout. Polleta /api/payments/clip/:id hasta
// ver status=completed, declined, cancelled o expired. Máximo 90s.
export default function PaymentReturn() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [payment, setPayment] = useState<PaymentInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [polling, setPolling] = useState(true);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        const start = Date.now();

        const poll = async () => {
            try {
                const { data } = await api.get<PaymentInfo>(`/payments/clip/${id}`);
                if (cancelled) return;
                setPayment(data);

                const terminal = ['completed', 'declined', 'cancelled', 'expired'].includes(data.status);
                if (terminal) {
                    setPolling(false);
                    return;
                }
                if (Date.now() - start > 90_000) {
                    setPolling(false);
                    return;
                }
                setTimeout(poll, 3000);
            } catch (err: any) {
                if (cancelled) return;
                setError(err?.response?.data?.error || 'No pudimos verificar tu pago');
                setPolling(false);
            }
        };

        poll();
        return () => { cancelled = true; };
    }, [id]);

    const renderState = () => {
        if (error) {
            return (
                <div className="text-center space-y-4">
                    <XCircle className="h-16 w-16 text-destructive mx-auto" />
                    <h2 className="text-2xl font-heading">Algo salió mal</h2>
                    <p className="text-muted-foreground">{error}</p>
                </div>
            );
        }
        if (!payment) {
            return (
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">Verificando tu pago...</p>
                </div>
            );
        }

        if (payment.status === 'completed') {
            return (
                <div className="text-center space-y-4">
                    <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
                    <h2 className="text-2xl font-heading">¡Pago confirmado!</h2>
                    <p className="text-muted-foreground">
                        Tu membresía ya está activa.
                        {payment.cardBrand && payment.cardLast4 && (
                            <> Cargo a {payment.cardBrand} •••• {payment.cardLast4}.</>
                        )}
                    </p>
                    <div className="flex gap-2 justify-center pt-2">
                        <Button asChild>
                            <Link to="/app/profile/membership">Ver mi membresía</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link to="/app/classes">Reservar clases</Link>
                        </Button>
                    </div>
                </div>
            );
        }

        if (payment.status === 'declined') {
            return (
                <div className="text-center space-y-4">
                    <XCircle className="h-16 w-16 text-destructive mx-auto" />
                    <h2 className="text-2xl font-heading">Pago rechazado</h2>
                    <p className="text-muted-foreground">
                        El banco no autorizó el cargo. Intenta con otra tarjeta o usa otro método.
                    </p>
                    <Button onClick={() => navigate(-1)}>Volver a intentar</Button>
                </div>
            );
        }

        if (payment.status === 'cancelled' || payment.status === 'expired') {
            return (
                <div className="text-center space-y-4">
                    <XCircle className="h-16 w-16 text-warning mx-auto" />
                    <h2 className="text-2xl font-heading">
                        {payment.status === 'cancelled' ? 'Pago cancelado' : 'Pago expirado'}
                    </h2>
                    <p className="text-muted-foreground">
                        Puedes intentar de nuevo cuando quieras.
                    </p>
                    <Button onClick={() => navigate(-1)}>Volver</Button>
                </div>
            );
        }

        // pending / processing
        return (
            <div className="text-center space-y-4">
                {polling ? (
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
                ) : (
                    <Clock className="h-16 w-16 text-warning mx-auto" />
                )}
                <h2 className="text-2xl font-heading">
                    {polling ? 'Procesando pago...' : 'Pago en revisión'}
                </h2>
                <p className="text-muted-foreground">
                    {polling
                        ? 'Estamos confirmando con Clip. Esto suele tardar unos segundos.'
                        : 'Si pagaste, recibirás confirmación en unos minutos. Si no, intenta de nuevo.'}
                </p>
                {!polling && (
                    <Button asChild variant="outline">
                        <Link to="/app/profile/membership">Ver estado de mi membresía</Link>
                    </Button>
                )}
            </div>
        );
    };

    return (
        <section className="min-h-[80vh] flex items-center justify-center bg-background py-16 px-4">
            <Card className="max-w-md w-full">
                <CardContent className="py-12">
                    {renderState()}
                </CardContent>
            </Card>
        </section>
    );
}
