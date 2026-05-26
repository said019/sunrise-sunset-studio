import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, Eye, EyeOff, User, Phone, Cake } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { COUNTRIES, DEFAULT_COUNTRY, findCountryByISO } from '@/lib/country-codes';
import { PhoneInput } from '@/components/PhoneInput';

const COUNTRY_ISOS = COUNTRIES.map((c) => c.iso) as [string, ...string[]];

const registerSchema = z.object({
    displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    countryISO: z.enum(COUNTRY_ISOS),
    phoneNational: z
        .string()
        .regex(/^[0-9]{6,14}$/, 'Solo dígitos, entre 6 y 14 caracteres'),
    dateOfBirth: z.string().optional().or(z.literal('')),
    password: z
        .string()
        .min(8, 'Mínimo 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
    acceptsTerms: z.boolean().refine(val => val === true, 'Debes aceptar los términos'),
    acceptsCommunications: z.boolean().default(false),
    referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnUrl = searchParams.get('returnUrl');
    const { register: registerUser, isLoading, error, clearError, isAuthenticated, user } = useAuthStore();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            countryISO: DEFAULT_COUNTRY.iso,
            acceptsTerms: false,
            acceptsCommunications: false,
        },
    });

    const acceptsTerms = watch('acceptsTerms');
    const acceptsCommunications = watch('acceptsCommunications');
    const selectedISO = watch('countryISO') ?? DEFAULT_COUNTRY.iso;
    const phoneNationalValue = watch('phoneNational') ?? '';
    const selectedCountry = findCountryByISO(selectedISO) ?? DEFAULT_COUNTRY;

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            navigate(returnUrl || '/app', { replace: true });
        }
    }, [isAuthenticated, user, navigate, returnUrl]);

    // Clear error on unmount
    useEffect(() => {
        return () => clearError();
    }, [clearError]);

    const onSubmit = async (data: RegisterForm) => {
        const country = findCountryByISO(data.countryISO) ?? DEFAULT_COUNTRY;
        const fullPhone = `${country.dialCode}${data.phoneNational}`;
        try {
            await registerUser({
                email: data.email,
                password: data.password,
                displayName: data.displayName,
                phone: fullPhone,
                dateOfBirth: data.dateOfBirth || undefined,
                acceptsTerms: data.acceptsTerms,
                acceptsCommunications: data.acceptsCommunications,
                referralCode: data.referralCode || undefined,
            });
        } catch (err) {
            // Error is handled by the store
        }
    };

    const inputClass = "h-12 rounded-2xl border-chocolate/[0.12] bg-cream/[0.72] pl-11 text-chocolate placeholder:text-chocolate/[0.38] focus-visible:ring-coral";
    const iconClass = "absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-coral";

    return (
        <AuthShell
            eyebrow="Empieza aquí"
            title="Tu cuenta para reservar."
            copy="Crea tu perfil y deja listo tu acceso a clases, paquetes y eventos especiales del studio."
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {error && (
                    <Alert variant="destructive" className="rounded-2xl border-wine/20 bg-wine/10 text-wine">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    {/* Nombre */}
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="displayName" className="text-sm font-semibold text-chocolate">
                            Nombre completo
                        </Label>
                        <div className="relative">
                            <User className={iconClass} strokeWidth={1.7} />
                            <Input
                                id="displayName"
                                placeholder="Tu nombre"
                                className={inputClass}
                                {...register('displayName')}
                                disabled={isLoading}
                            />
                        </div>
                        {errors.displayName && (
                            <p className="text-sm text-destructive">{errors.displayName.message}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-chocolate">
                            Email
                        </Label>
                        <div className="relative">
                            <Mail className={iconClass} strokeWidth={1.7} />
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                className={inputClass}
                                {...register('email')}
                                disabled={isLoading}
                            />
                        </div>
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Teléfono — selector de país + número nacional (PhoneInput) */}
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="phoneNational" className="text-sm font-semibold text-chocolate">
                            Teléfono
                        </Label>
                        <PhoneInput
                            id="phoneNational"
                            countryISO={selectedISO}
                            phoneNational={phoneNationalValue}
                            onCountryChange={(v) => setValue('countryISO', v as RegisterForm['countryISO'], { shouldValidate: true })}
                            onPhoneChange={(v) => setValue('phoneNational', v, { shouldValidate: true })}
                            disabled={isLoading}
                            triggerClassName="h-12 w-[124px] rounded-2xl border-chocolate/[0.12] bg-cream/[0.72] text-chocolate focus:ring-coral"
                            inputClassName={inputClass}
                            inputAdornment={<Phone className={iconClass} strokeWidth={1.7} />}
                        />
                        {(errors.phoneNational || errors.countryISO) && (
                            <p className="text-sm text-destructive">
                                {errors.phoneNational?.message ?? errors.countryISO?.message}
                            </p>
                        )}
                        <p className="text-xs text-chocolate/[0.54]">
                            Se guardará como <span className="font-mono">{selectedCountry.dialCode}{phoneNationalValue || '…'}</span> en formato internacional.
                        </p>
                    </div>

                    {/* Fecha de nacimiento */}
                    <div className="space-y-2">
                        <Label htmlFor="dateOfBirth" className="text-sm font-semibold text-chocolate">
                            Fecha de nacimiento
                        </Label>
                        <div className="relative">
                            <Cake className={iconClass} strokeWidth={1.7} />
                            <Input
                                id="dateOfBirth"
                                type="date"
                                className={inputClass}
                                {...register('dateOfBirth')}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-semibold text-chocolate">
                            Contraseña
                        </Label>
                        <div className="relative">
                            <Lock className={iconClass} strokeWidth={1.7} />
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className={`${inputClass} pr-12`}
                                {...register('password')}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-chocolate/[0.52] transition-[transform,background-color,color] duration-200 ease-sunrise hover:bg-coral/10 hover:text-coral active:scale-[0.94]"
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-sm text-destructive">{errors.password.message}</p>
                        )}
                    </div>

                    {/* Confirm password */}
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-semibold text-chocolate">
                            Confirmar contraseña
                        </Label>
                        <div className="relative">
                            <Lock className={iconClass} strokeWidth={1.7} />
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className={`${inputClass} pr-12`}
                                {...register('confirmPassword')}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-chocolate/[0.52] transition-[transform,background-color,color] duration-200 ease-sunrise hover:bg-coral/10 hover:text-coral active:scale-[0.94]"
                                aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-3 rounded-2xl bg-cream/[0.58] p-4">
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="acceptsTerms"
                            checked={acceptsTerms}
                            onCheckedChange={(checked) => setValue('acceptsTerms', checked as boolean)}
                            disabled={isLoading}
                            className="mt-0.5 rounded-md border-chocolate/24 data-[state=checked]:bg-coral"
                        />
                        <label htmlFor="acceptsTerms" className="cursor-pointer text-sm leading-6 text-chocolate/[0.72]">
                            Acepto los{' '}
                            <Link to="/terms" className="font-medium text-coral transition-colors hover:text-wine">
                                términos
                            </Link>{' '}
                            y la{' '}
                            <Link to="/privacy" className="font-medium text-coral transition-colors hover:text-wine">
                                política de privacidad
                            </Link>
                        </label>
                    </div>
                    {errors.acceptsTerms && (
                        <p className="text-sm text-destructive">{errors.acceptsTerms.message}</p>
                    )}

                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="acceptsCommunications"
                            checked={acceptsCommunications}
                            onCheckedChange={(checked) => setValue('acceptsCommunications', checked as boolean)}
                            disabled={isLoading}
                            className="mt-0.5 rounded-md border-chocolate/24 data-[state=checked]:bg-coral"
                        />
                        <label htmlFor="acceptsCommunications" className="cursor-pointer text-sm leading-6 text-chocolate/[0.72]">
                            Quiero recibir novedades, workshops y promociones por email.
                        </label>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="referralCode" className="text-sm font-semibold text-chocolate">
                        Código de referido
                    </Label>
                    <Input
                        id="referralCode"
                        placeholder="Opcional"
                        {...register('referralCode')}
                        disabled={isLoading}
                        className="h-12 rounded-2xl border-chocolate/[0.12] bg-cream/[0.72] text-chocolate uppercase placeholder:normal-case placeholder:text-chocolate/[0.38] focus-visible:ring-coral"
                    />
                    <p className="text-xs leading-5 text-chocolate/[0.54]">
                        Si alguien te invitó, ingresa su código para que ambos ganen puntos.
                    </p>
                </div>

                <Button
                    type="submit"
                    className="h-12 w-full rounded-full bg-chocolate text-cream shadow-[0_16px_34px_hsla(24,46%,30%,0.18)] transition-[transform,background-color] duration-200 ease-sunrise hover:-translate-y-0.5 hover:bg-wine active:scale-[0.97]"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creando cuenta
                        </>
                    ) : (
                        'Crear cuenta'
                    )}
                </Button>

                <p className="text-center text-sm text-chocolate/[0.62]">
                    ¿Ya tienes cuenta?{' '}
                    <Link to={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'} className="font-semibold text-coral transition-colors hover:text-wine">
                        Inicia sesión
                    </Link>
                </p>
            </form>
        </AuthShell>
    );
}
