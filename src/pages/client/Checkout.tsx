import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import type { OrderPaymentMethod, CreateOrderRequest, Order } from '@/types/order';
import {
  CreditCard,
  Building2,
  Banknote,
  ChevronRight,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Tag,
  X,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  class_limit: number | null;
  description: string | null;
  is_active: boolean;
  is_unlimited: boolean;
  category: string;
  is_exclusive: boolean;
}

interface BankInfo {
  bank_name: string;
  account_holder: string;
  account_number: string;
  clabe: string;
  reference_instructions: string;
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const preselectedPlanId = searchParams.get('plan');

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(preselectedPlanId);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<OrderPaymentMethod>('bank_transfer');
  const [notes, setNotes] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };
  const [step, setStep] = useState<'plan' | 'payment' | 'confirm'>('plan');

  // Discount code state
  const [discountCode, setDiscountCode] = useState('');
  const [discountResult, setDiscountResult] = useState<{
    valid: boolean;
    codeId: string;
    discountAmount: number;
    finalTotal: number;
    discountType: string;
    discountValue: number;
    description?: string;
    code: string;
  } | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);

  // Fetch available plans
  const { data: plans, isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ['plans-active'],
    queryFn: async () => {
      const res = await api.get('/plans');
      return res.data.filter((p: Plan) => p.is_active).sort((a: Plan, b: Plan) => (a.sort_order || 0) - (b.sort_order || 0));
    },
  });

  // Fetch user membership status 
  // We need to know if they have an active "membership_fee" plan
  const { data: myMembership } = useQuery({
    queryKey: ['my-membership-status'],
    queryFn: async () => {
      try {
        // We can check /bookings/my-bookings or a specific endpoint. 
        // Or simpler: /memberships/my-active-fee
        // Since we dont have that, let's use the generic my-membership and check plan details if possible.
        // Actually, `ProfileMembership` uses `fetchMyMembership`. Let's assume user might have multiple or we check the backend check.
        // For UI, let's just assume we need to handle the visual lock.
        // Let's use `api.get('/memberships/active')` if it exists, or check the existing `my-membership` logic.
        // Existing code uses `fetchMyMembership`. Let's rely on that.
        const res = await api.get('/memberships/my');
        // BE endpoint /api/memberships/my returns the active membership usually. 
        // But we specifically need to know if they have the "Fee" membership.
        // Let's assume the backend endpoint returns plan details.
        return res.data;
      } catch (e) {
        return null;
      }
    },
    retry: false
  });

  const hasActiveMembershipFee = myMembership?.some((m: any) =>
    m.status === 'active' && (
      m.plan_category === 'membership_fee' ||
      m.plan_name?.toLowerCase().includes('inscripci') ||
      m.plan_name?.toLowerCase().includes('social')
    )
  );


  // Fetch bank info for transfer instructions
  const { data: bankInfo } = useQuery<BankInfo>({
    queryKey: ['bank-info'],
    queryFn: async () => (await api.get('/settings/bank-info')).data,
    enabled: selectedPaymentMethod === 'bank_transfer',
  });

  // Create order mutation
  const createOrder = useMutation({
    mutationFn: async (data: CreateOrderRequest) => {
      let orderId: string | null = null;
      let order: Order | null = null;

      try {
        const res = await api.post('/orders', data);
        order = res.data as Order;
        orderId = order.id;
      } catch (err: any) {
        // 409: ya existe orden pendiente para este plan. Reusarla si es pago con tarjeta.
        if (err?.response?.status === 409 && err?.response?.data?.existingOrderId) {
          orderId = err.response.data.existingOrderId;
          if (data.payment_method !== 'card') {
            // Para transfer/cash redirige a la orden existente
            navigate(`/app/orders/${orderId}`);
            const placeholder: any = { id: orderId, order_number: err.response.data.existingOrderNumber };
            return placeholder as Order;
          }
          // Para card, seguimos al checkout abajo
        } else {
          throw err;
        }
      }

      // Si es pago con tarjeta, generar link de Clip y redirigir.
      if (data.payment_method === 'card' && orderId) {
        const checkoutRes = await api.post<{ checkoutUrl: string; paymentId: string }>(
          '/payments/clip/checkout',
          { orderId },
        );
        return { ...(order || { id: orderId } as any), _clipCheckoutUrl: checkoutRes.data.checkoutUrl } as any;
      }

      return order!;
    },
    onSuccess: (order: any) => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });

      if (order._clipCheckoutUrl) {
        toast({
          title: 'Redirigiendo a Clip',
          description: 'Vas a la página segura de Clip para capturar tu tarjeta.',
        });
        window.location.assign(order._clipCheckoutUrl);
        return;
      }

      toast({
        title: '¡Orden creada!',
        description: `Tu orden ${order.order_number} ha sido creada.`,
      });
      navigate(`/app/orders/${order.id}`);
    },
    onError: (error: any) => {
      // Handle specific error codes
      if (error.response?.data?.code === 'MEMBERSHIP_REQUIRED') {
        toast({
          title: 'Membresía Requerida',
          description: 'Este plan es exclusivo para miembros activos.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'No se pudo crear la orden',
          variant: 'destructive',
        });
      }
    },
  });

  const selectedPlan = plans?.find(p => p.id === selectedPlanId);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    // Clear discount when changing plan (may not apply to new plan)
    handleRemoveDiscount();
    // Force bank_transfer for trial/individual plans
    const plan = plans?.find(p => p.id === planId);
    if (plan && (plan.name.toLowerCase().includes('muestra') || plan.name.toLowerCase().includes('individual') || plan.name.toLowerCase().includes('prueba'))) {
      setSelectedPaymentMethod('bank_transfer');
    }
    // Don't auto-advance: the redesigned plan grid lets the user compare across
    // groups; advancing happens via the sticky "Continuar" button instead.
  };

  const handlePaymentMethodSelect = () => {
    if (!selectedPlanId) return;
    setStep('confirm');
  };

  const handleConfirmOrder = () => {
    if (!selectedPlanId) return;

    createOrder.mutate({
      plan_id: selectedPlanId,
      payment_method: selectedPaymentMethod,
      notes: notes || undefined,
      discount_code_id: discountResult?.codeId || undefined,
      discount_amount: discountResult?.discountAmount || undefined,
    });
  };

  const handleValidateDiscount = async () => {
    if (!discountCode.trim() || !selectedPlan) return;

    setIsValidatingDiscount(true);
    setDiscountError('');
    setDiscountResult(null);

    try {
      const res = await api.post('/discount-codes/validate', {
        code: discountCode.trim(),
        plan_id: selectedPlan.id,
        subtotal: Number(selectedPlan.price),
      });

      setDiscountResult(res.data);
      toast({
        title: '¡Código aplicado!',
        description: `Descuento de ${formatPrice(res.data.discountAmount)} aplicado`,
      });
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Código no válido';
      setDiscountError(msg);
      toast({
        title: 'Código no válido',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountResult(null);
    setDiscountCode('');
    setDiscountError('');
  };

  const finalTotal = discountResult ? discountResult.finalTotal : (selectedPlan?.price ?? 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price);
  };

  const isTrialOrIndividualPlan = selectedPlan && (
    selectedPlan.name.toLowerCase().includes('muestra') ||
    selectedPlan.name.toLowerCase().includes('individual') ||
    selectedPlan.name.toLowerCase().includes('prueba')
  );

  const paymentMethods: { value: OrderPaymentMethod; label: string; icon: typeof CreditCard; description: string }[] = [
    {
      value: 'bank_transfer',
      label: 'Transferencia bancaria',
      icon: Building2,
      description: 'Realiza una transferencia y sube tu comprobante',
    },
    ...(!isTrialOrIndividualPlan ? [{
      value: 'cash' as OrderPaymentMethod,
      label: 'Efectivo en estudio',
      icon: Banknote,
      description: 'Paga directamente en el estudio',
    }] : []),
  ];

  return (
    <AuthGuard requiredRoles={['client']}>
      <ClientLayout>
        <div className={cn(step === 'plan' ? 'max-w-6xl' : 'max-w-2xl', 'mx-auto space-y-6')}>
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (step === 'payment') setStep('plan');
                else if (step === 'confirm') setStep('payment');
                else navigate('/app');
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-heading font-bold">
                {step === 'plan' && 'Elige tu plan'}
                {step === 'payment' && 'Método de pago'}
                {step === 'confirm' && 'Confirmar orden'}
              </h1>
              <p className="text-muted-foreground">
                {step === 'plan' && 'Selecciona el plan que mejor se adapte a ti'}
                {step === 'payment' && 'Elige cómo quieres pagar'}
                {step === 'confirm' && 'Revisa los detalles de tu compra'}
              </p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={step === 'plan' ? 'default' : 'secondary'}>1. Plan</Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant={step === 'payment' ? 'default' : 'secondary'}>2. Pago</Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant={step === 'confirm' ? 'default' : 'secondary'}>3. Confirmar</Badge>
          </div>

          {/* Step 1: Select Plan — grouped boutique showcase */}
          {step === 'plan' && (() => {
            if (plansLoading) {
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
                </div>
              );
            }
            if (!plans || plans.length === 0) {
              return (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No hay planes disponibles en este momento.</p>
                  </CardContent>
                </Card>
              );
            }

            // Group definitions
            const GROUP_A_NAMES = ['Sunrise Pack', 'Golden Hour', 'Sunset Flow', 'Full Day Experience'];
            const GROUP_B_NAMES = ['Wave Starter', 'Ocean Flow', 'Deep Flow', 'Endless Waves'];
            const GROUP_C_NAMES = ['Balanced Flow', 'Elevate Experience', 'Full Experience', 'Sunrise Sunset Combo'];
            const SINGLES_ORDER = ['Clase Muestra', 'Clase Suelta - Sculpt-Funcional', 'Clase Suelta - Surf-Pilates', 'Clase Suelta - Yoga'];
            const recommendedName = 'Full Experience';
            const byPrice = (a: Plan, b: Plan) => Number(a.price) - Number(b.price);

            const visiblePlans = plans.filter((p) => {
              const isFee = p.category === 'membership_fee' ||
                p.name.toLowerCase().includes('inscrip') ||
                Number(p.price) === 500;
              return !(isFee && hasActiveMembershipFee);
            });

            const inscripcion = visiblePlans.find((p) => p.name === 'Inscripción');
            const singles = visiblePlans
              .filter((p) => SINGLES_ORDER.includes(p.name))
              .sort((a, b) => SINGLES_ORDER.indexOf(a.name) - SINGLES_ORDER.indexOf(b.name));
            const groupA = visiblePlans.filter((p) => GROUP_A_NAMES.includes(p.name)).sort(byPrice);
            const groupB = visiblePlans.filter((p) => GROUP_B_NAMES.includes(p.name)).sort(byPrice);
            const groupC = visiblePlans.filter((p) => GROUP_C_NAMES.includes(p.name)).sort(byPrice);

            const isPlanLocked = (plan: Plan) => {
              const isFee = plan.category === 'membership_fee' ||
                plan.name.toLowerCase().includes('inscrip') ||
                Number(plan.price) === 500;
              const isTrial = plan.category === 'trial' ||
                plan.name.toLowerCase().includes('muestra') ||
                plan.name.toLowerCase().includes('prueba');
              const requiresMembership = plan.is_exclusive || (!isFee && !isTrial);
              return !hasActiveMembershipFee && requiresMembership;
            };

            const planClassLabel = (plan: Plan) => {
              if (plan.is_unlimited || plan.class_limit === null) return 'Clases ilimitadas';
              if (plan.class_limit === 0) return 'Acceso anual';
              return `${plan.class_limit} clase${plan.class_limit !== 1 ? 's' : ''}`;
            };

            // Inline plan card — varies by `variant`
            const PlanCard = ({ plan, variant = 'default' }: { plan: Plan; variant?: 'default' | 'compact' | 'recommended' | 'hero' }) => {
              const locked = isPlanLocked(plan);
              const selected = selectedPlanId === plan.id;
              const recommended = variant === 'recommended';
              const compact = variant === 'compact';
              const hero = variant === 'hero';
              const displayName = plan.name.replace('Clase Suelta - ', '');

              return (
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => !locked && handlePlanSelect(plan.id)}
                  className={cn(
                    'group relative w-full text-left rounded-2xl overflow-hidden transition-all',
                    compact ? 'p-4' : 'p-5 md:p-6',
                    recommended
                      ? 'bg-sunset text-cream sunset-glow lg:scale-[1.03]'
                      : hero
                        ? 'bg-card text-foreground shadow-md ring-1 ring-coral/10'
                        : 'bg-card text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5',
                    selected && !recommended && 'ring-4 ring-coral/40',
                    selected && recommended && 'ring-4 ring-cream/40',
                    locked && 'opacity-60 cursor-not-allowed hover:translate-y-0'
                  )}
                >
                  {recommended && (
                    <>
                      <span className="pointer-events-none absolute -right-16 -top-16 w-48 h-48 rounded-full bg-cream/15 blur-3xl" />
                      <span className="pointer-events-none absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-wine/30 blur-3xl" />
                      <span className="absolute top-3 right-3 text-[10px] font-bold tracking-[0.18em] uppercase bg-cream/20 backdrop-blur-sm text-cream px-2.5 py-1 rounded-full z-10">
                        Recomendado
                      </span>
                    </>
                  )}
                  {locked && (
                    <div className="absolute inset-0 bg-card/70 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-4 z-20">
                      <span className="material-symbols-outlined text-coral text-2xl mb-1">lock</span>
                      <p className="text-xs font-semibold text-foreground">Requiere inscripción</p>
                    </div>
                  )}

                  <div className="relative z-[5] flex flex-col gap-2">
                    <h4 className={cn(
                      'font-heading leading-tight',
                      compact ? 'text-base' : 'text-lg md:text-xl',
                      recommended ? 'text-cream' : 'text-foreground'
                    )}>
                      {displayName}
                    </h4>
                    {!compact && plan.description && (
                      <p className={cn('text-xs leading-relaxed line-clamp-2',
                        recommended ? 'text-cream/80' : 'text-foreground/55'
                      )}>
                        {plan.description}
                      </p>
                    )}
                    <div className="mt-3">
                      <span className={cn(
                        'font-heading tabular-nums',
                        compact ? 'text-2xl' : 'text-3xl md:text-4xl',
                        recommended ? 'text-cream' : 'text-coral'
                      )}>
                        {formatPrice(plan.price)}
                      </span>
                      <p className={cn('text-[11px] uppercase tracking-[0.14em] mt-1',
                        recommended ? 'text-cream/70' : 'text-foreground/55'
                      )}>
                        {planClassLabel(plan)}
                        {plan.duration_days !== 365 && ` · ${plan.duration_days} días`}
                      </p>
                    </div>
                  </div>
                </button>
              );
            };

            return (
              <div className="space-y-12">
                {/* Inscripción — paso 1 si no la tienen */}
                {inscripcion && (
                  <section>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-coral filled text-xl">redeem</span>
                      <h3 className="font-heading text-xl text-foreground">Inscripción · paso uno</h3>
                    </div>
                    <p className="text-sm text-foreground/65 mb-4 max-w-xl">
                      Pago único para acceder al studio. Si te inscribes el mismo día que tomas tu clase muestra,
                      el costo de ésta se descuenta de tu inscripción.
                    </p>
                    <div className="max-w-md">
                      <PlanCard plan={inscripcion} variant="hero" />
                    </div>
                  </section>
                )}

                {/* Sueltas y muestra */}
                {singles.length > 0 && (
                  <section>
                    <h3 className="font-heading text-xl text-foreground mb-1">Sueltas y muestra</h3>
                    <p className="text-sm text-foreground/55 mb-4">Una clase a la vez · sin compromiso</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {singles.map((p) => <PlanCard key={p.id} plan={p} variant="compact" />)}
                    </div>
                  </section>
                )}

                {/* Grupo A */}
                {groupA.length > 0 && (
                  <section>
                    <h3 className="font-heading text-xl text-foreground mb-1">Sunrise &amp; Yoga</h3>
                    <p className="text-sm text-foreground/55 mb-4">Sculpt-Funcional + Yoga · 30 días</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {groupA.map((p) => <PlanCard key={p.id} plan={p} />)}
                    </div>
                  </section>
                )}

                {/* Grupo B */}
                {groupB.length > 0 && (
                  <section>
                    <h3 className="font-heading text-xl text-foreground mb-1">Wave &amp; Yoga</h3>
                    <p className="text-sm text-foreground/55 mb-4">Surf-Pilates + Yoga · 30 días</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {groupB.map((p) => <PlanCard key={p.id} plan={p} />)}
                    </div>
                  </section>
                )}

                {/* Grupo C — Mixto (con featured "Recomendado") */}
                {groupC.length > 0 && (
                  <section>
                    <h3 className="font-heading text-xl text-foreground mb-1">Full Sunrise Sunset · Mixto</h3>
                    <p className="text-sm text-foreground/55 mb-4">Los 3 tipos con composición exacta · 30 días</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:items-stretch">
                      {groupC.map((p) => (
                        <PlanCard
                          key={p.id}
                          plan={p}
                          variant={p.name === recommendedName ? 'recommended' : 'default'}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Sticky continue bar (only when a plan is selected) */}
                {selectedPlanId && (
                  <div className="sticky bottom-24 md:bottom-6 z-30">
                    <div className="bg-card/95 backdrop-blur border border-border/40 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 max-w-3xl mx-auto">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wide text-foreground/55">Seleccionado</p>
                        <p className="font-semibold text-foreground truncate">
                          {selectedPlan?.name} · {selectedPlan && formatPrice(selectedPlan.price)}
                        </p>
                      </div>
                      <button
                        onClick={() => setStep('payment')}
                        className="bg-coral text-cream px-5 py-3 rounded-xl text-sm font-semibold tracking-wide hover:opacity-90 active:scale-[0.98] shadow-lg shadow-coral/25 inline-flex items-center gap-2 shrink-0"
                      >
                        Continuar
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Step 2: Select Payment Method */}
          {step === 'payment' && selectedPlan && (
            <div className="space-y-4">
              {/* Selected plan summary */}
              <Card className="bg-muted/30">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedPlan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPlan.is_unlimited || !selectedPlan.class_limit
                          ? 'Clases ilimitadas'
                          : `${selectedPlan.class_limit} clases`}
                        {' · '}
                        {selectedPlan.duration_days} días
                      </p>
                    </div>
                    <p className="text-xl font-bold">{formatPrice(selectedPlan.price)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selecciona método de pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={selectedPaymentMethod}
                    onValueChange={(v) => setSelectedPaymentMethod(v as OrderPaymentMethod)}
                    className="space-y-3"
                  >
                    {paymentMethods.map((method) => (
                      <div
                        key={method.value}
                        className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${selectedPaymentMethod === method.value
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                          }`}
                        onClick={() => setSelectedPaymentMethod(method.value)}
                      >
                        <RadioGroupItem value={method.value} id={method.value} className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor={method.value} className="flex items-center gap-2 cursor-pointer">
                            <method.icon className="h-5 w-5 text-primary" />
                            <span className="font-medium">{method.label}</span>
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {method.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
                <CardFooter>
                  <Button onClick={handlePaymentMethodSelect} className="w-full">
                    Continuar
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          {/* Step 3: Confirm Order */}
          {step === 'confirm' && selectedPlan && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumen de tu orden</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Plan details */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedPlan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPlan.is_unlimited || !selectedPlan.class_limit
                          ? 'Clases ilimitadas'
                          : `${selectedPlan.class_limit} clases`}
                        {' · '}
                        {selectedPlan.duration_days} días
                      </p>
                    </div>
                    <p className="font-medium">{formatPrice(selectedPlan.price)}</p>
                  </div>

                  <Separator />

                  {/* Payment method */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Método de pago</span>
                    <span className="font-medium">
                      {paymentMethods.find(m => m.value === selectedPaymentMethod)?.label}
                    </span>
                  </div>

                  <Separator />

                  {/* Discount code */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-sm">
                      <Tag className="h-4 w-4" />
                      Código de descuento
                    </Label>

                    {discountResult ? (
                      <div className="flex items-center justify-between rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">
                              {discountResult.code}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-500">
                              {discountResult.discountType === 'percentage'
                                ? `${discountResult.discountValue}% de descuento`
                                : `${formatPrice(discountResult.discountValue)} de descuento`}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-red-500 hover:bg-red-50"
                          onClick={handleRemoveDiscount}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ingresa tu código"
                          value={discountCode}
                          onChange={(e) => {
                            setDiscountCode(e.target.value.toUpperCase());
                            setDiscountError('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleValidateDiscount();
                            }
                          }}
                          className={discountError ? 'border-red-400' : ''}
                          disabled={isValidatingDiscount}
                        />
                        <Button
                          variant="outline"
                          onClick={handleValidateDiscount}
                          disabled={!discountCode.trim() || isValidatingDiscount}
                          className="shrink-0"
                        >
                          {isValidatingDiscount ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Aplicar'
                          )}
                        </Button>
                      </div>
                    )}

                    {discountError && (
                      <p className="text-xs text-red-500">{discountError}</p>
                    )}
                  </div>

                  <Separator />

                  {/* Subtotal and discount breakdown */}
                  {discountResult && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(selectedPlan.price)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          Descuento ({discountResult.code})
                        </span>
                        <span>-{formatPrice(discountResult.discountAmount)}</span>
                      </div>
                    </>
                  )}

                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-lg text-primary">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="¿Algún comentario sobre tu compra?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>

                  {/* Bank transfer info preview */}
                  {selectedPaymentMethod === 'bank_transfer' && bankInfo && (
                    <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Datos para transferencia
                      </p>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between p-2.5 rounded-md bg-background">
                          <div>
                            <p className="text-xs text-muted-foreground">Banco</p>
                            <p className="text-sm font-medium">{bankInfo.bank_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-md bg-background">
                          <div>
                            <p className="text-xs text-muted-foreground">Titular</p>
                            <p className="text-sm font-medium">{bankInfo.account_holder}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => copyToClipboard(bankInfo.account_holder, 'holder')}
                          >
                            {copiedField === 'holder' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                        {bankInfo.account_number && (
                          <div className="flex items-center justify-between p-2.5 rounded-md bg-background">
                            <div>
                              <p className="text-xs text-muted-foreground">Número de cuenta</p>
                              <p className="text-sm font-medium font-mono">{bankInfo.account_number}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => copyToClipboard(bankInfo.account_number, 'account')}
                            >
                              {copiedField === 'account' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        )}
                        <div className="flex items-center justify-between p-2.5 rounded-md bg-background">
                          <div>
                            <p className="text-xs text-muted-foreground">CLABE interbancaria</p>
                            <p className="text-sm font-medium font-mono">{bankInfo.clabe}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => copyToClipboard(bankInfo.clabe, 'clabe')}
                          >
                            {copiedField === 'clabe' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                        <div className="p-2.5 rounded-md bg-primary/5 border border-primary/20">
                          <p className="text-xs text-muted-foreground">Monto a transferir</p>
                          <p className="font-bold text-primary">{formatPrice(finalTotal)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Después de confirmar, podrás subir tu comprobante de pago desde el detalle de tu orden.
                      </p>
                    </div>
                  )}

                  {selectedPaymentMethod === 'cash' && (
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="text-sm flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        <span>
                          Tu orden quedará pendiente hasta que realices el pago en el estudio.
                          Presenta el número de orden al pagar.
                        </span>
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  <Button
                    onClick={handleConfirmOrder}
                    className="w-full"
                    disabled={createOrder.isPending}
                  >
                    {createOrder.isPending ? (
                      'Creando orden...'
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirmar orden
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Al confirmar, aceptas los términos y condiciones del estudio.
                  </p>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </ClientLayout>
    </AuthGuard>
  );
}
