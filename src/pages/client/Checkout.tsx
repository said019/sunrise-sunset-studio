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
    setStep('payment');
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
        <div className="max-w-2xl mx-auto space-y-6">
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

          {/* Step 1: Select Plan */}
          {step === 'plan' && (
            <div className="space-y-4">
              {plansLoading ? (
                <>
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </>
              ) : plans && plans.length > 0 ? (
                plans.filter((plan) => {
                  // Hide inscription plan if user already has active one
                  const isFee =
                    plan.category === 'membership_fee' ||
                    plan.name.toLowerCase().includes('social') ||
                    plan.name.toLowerCase().includes('inscrip') ||
                    Number(plan.price) === 500;
                  if (isFee && hasActiveMembershipFee) return false;
                  return true;
                }).map((plan) => {
                  // Define special categories
                  // We use the fields from backend: category, is_exclusive
                  const isMembershipFeePlan =
                    plan.category === 'membership_fee' ||
                    plan.name.toLowerCase().includes('social') ||
                    plan.name.toLowerCase().includes('inscrip') ||
                    Number(plan.price) === 500;

                  const isTrialPlan =
                    plan.category === 'trial' ||
                    plan.name.toLowerCase().includes('prueba') ||
                    plan.name.toLowerCase().includes('muestra') ||
                    plan.name.toLowerCase().includes('individual') ||
                    plan.name.toLowerCase().includes('drop');

                  // Lock logic: If no active fee, ONLY allow Fee plan or Trial plans
                  // If plan is marked exclusive OR (it is not a fee plan AND not a trial plan), it requires membership
                  // But we should stick to the "is_exclusive" flag if reliable. 
                  // If we want to enforce the rule: "All packages require membership except Trial and Fee itself":
                  const requiresMembership = plan.is_exclusive || (!isMembershipFeePlan && !isTrialPlan);

                  const isLocked = !hasActiveMembershipFee && requiresMembership;

                  console.log(`Plan: ${plan.name} | isLocked: ${isLocked} | hasActiveFee: ${hasActiveMembershipFee}`);

                  return (
                    <Card
                      key={plan.id}
                      className={`transition-all relative overflow-hidden ${selectedPlanId === plan.id ? 'border-primary ring-2 ring-primary' : ''
                        } ${isLocked ? 'opacity-70 bg-muted/20' : 'cursor-pointer hover:border-primary'}`}
                      onClick={() => !isLocked && handlePlanSelect(plan.id)}
                    >
                      {isLocked && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 text-center p-4">
                          <div className="bg-background/90 p-2 rounded-full shadow-sm mb-2">
                            <Sparkles className="h-6 w-6 text-warning" />
                          </div>
                          <p className="font-semibold text-sm">Requiere Social Fee</p>
                          <p className="text-xs text-muted-foreground">Debes pagar tu inscripción anual primero</p>
                        </div>
                      )}

                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {plan.name}
                              {plan.category === 'membership_fee' && <Badge variant="secondary" className="text-xs">Acceso Anual</Badge>}
                            </CardTitle>
                            {plan.description && (
                              <CardDescription>{plan.description}</CardDescription>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {formatPrice(plan.price)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {plan.duration_days} días
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-4 w-4" />
                            {plan.is_unlimited
                              ? 'Clases ilimitadas'
                              : plan.class_limit
                                ? `${plan.class_limit} clases`
                                : 'Acceso membresía'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      No hay planes disponibles en este momento.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

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
