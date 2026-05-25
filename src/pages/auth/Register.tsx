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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, Eye, EyeOff, User, Phone, Cake } from 'lucide-react';

const registerSchema = z.object({
    displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    phone: z
        .string()
        .regex(/^\+52[0-9]{10}$/, 'Formato: +52 seguido de 10 dígitos'),
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
            acceptsTerms: false,
            acceptsCommunications: false,
        },
    });

    const acceptsTerms = watch('acceptsTerms');
    const acceptsCommunications = watch('acceptsCommunications');

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

    // Format phone number as user types
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        // Remove non-digits except +
        value = value.replace(/[^\d+]/g, '');
        // Ensure starts with +52
        if (!value.startsWith('+52') && value.length > 0) {
            if (value.startsWith('52')) {
                value = '+' + value;
            } else if (value.startsWith('+')) {
                value = '+52' + value.substring(1);
            } else {
                value = '+52' + value;
            }
        }
        // Limit to +52 + 10 digits
        if (value.length > 13) {
            value = value.substring(0, 13);
        }
        e.target.value = value;
    };

    const onSubmit = async (data: RegisterForm) => {
        try {
            await registerUser({
                email: data.email,
                password: data.password,
                displayName: data.displayName,
                phone: data.phone,
                dateOfBirth: data.dateOfBirth || undefined,
                acceptsTerms: data.acceptsTerms,
                acceptsCommunications: data.acceptsCommunications,
                referralCode: data.referralCode || undefined,
            });
        } catch (err) {
            // Error is handled by the store
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4 py-8">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <img
                            src="/catarsis.jpg"
                            alt="Catarsis Studio"
                            className="h-16 w-16 rounded-full object-cover"
                        />
                    </div>
                    <CardTitle className="text-2xl font-heading">Crear Cuenta</CardTitle>
                    <CardDescription>
                        Únete a Catarsis Studio y comienza tu transformación
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Nombre completo</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="displayName"
                                    placeholder="Tu nombre"
                                    className="pl-10"
                                    {...register('displayName')}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.displayName && (
                                <p className="text-sm text-destructive">{errors.displayName.message}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    className="pl-10"
                                    {...register('email')}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+525512345678"
                                    className="pl-10"
                                    {...register('phone')}
                                    onChange={(e) => {
                                        handlePhoneChange(e);
                                        register('phone').onChange(e);
                                    }}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.phone && (
                                <p className="text-sm text-destructive">{errors.phone.message}</p>
                            )}
                        </div>

                        {/* Date of Birth */}
                        <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Fecha de nacimiento (opcional)</Label>
                            <div className="relative">
                                <Cake className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    className="pl-10"
                                    {...register('dateOfBirth')}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10"
                                    {...register('password')}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10"
                                    {...register('confirmPassword')}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {/* Terms */}
                        <div className="space-y-3">
                            <div className="flex items-start space-x-2">
                                <Checkbox
                                    id="acceptsTerms"
                                    checked={acceptsTerms}
                                    onCheckedChange={(checked) => setValue('acceptsTerms', checked as boolean)}
                                    disabled={isLoading}
                                />
                                <label htmlFor="acceptsTerms" className="text-sm leading-tight cursor-pointer">
                                    Acepto los{' '}
                                    <Link to="/terms" className="text-primary hover:underline">
                                        términos y condiciones
                                    </Link>{' '}
                                    y la{' '}
                                    <Link to="/privacy" className="text-primary hover:underline">
                                        política de privacidad
                                    </Link>
                                </label>
                            </div>
                            {errors.acceptsTerms && (
                                <p className="text-sm text-destructive">{errors.acceptsTerms.message}</p>
                            )}

                            <div className="flex items-start space-x-2">
                                <Checkbox
                                    id="acceptsCommunications"
                                    checked={acceptsCommunications}
                                    onCheckedChange={(checked) => setValue('acceptsCommunications', checked as boolean)}
                                    disabled={isLoading}
                                />
                                <label htmlFor="acceptsCommunications" className="text-sm leading-tight cursor-pointer">
                                    Deseo recibir promociones y novedades por email
                                </label>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="referralCode">¿Alguien te refirió? (opcional)</Label>
                                <Input
                                    id="referralCode"
                                    placeholder="Código de referido"
                                    {...register('referralCode')}
                                    disabled={isLoading}
                                    className="uppercase"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Si alguien te invitó, ingresa su código para que ambos ganen puntos.
                                </p>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creando cuenta...
                                </>
                            ) : (
                                'Crear Cuenta'
                            )}
                        </Button>

                        <p className="text-sm text-center text-muted-foreground">
                            ¿Ya tienes cuenta?{' '}
                            <Link to={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'} className="text-primary hover:underline font-medium">
                                Inicia sesión
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
