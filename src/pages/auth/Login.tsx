import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, Eye, EyeOff, Share, PlusSquare } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnUrl = searchParams.get('returnUrl');
    const { login, isLoading, error, clearError, isAuthenticated, user } = useAuthStore();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            if (returnUrl) {
                navigate(returnUrl, { replace: true });
            } else if (user.role === 'admin') {
                navigate('/admin/dashboard', { replace: true });
            } else if (user.role === 'instructor') {
                navigate('/coach', { replace: true });
            } else {
                navigate('/app', { replace: true });
            }
        }
    }, [isAuthenticated, user, navigate, returnUrl]);

    // Clear error on unmount
    useEffect(() => {
        return () => clearError();
    }, [clearError]);

    const onSubmit = async (data: LoginForm) => {
        try {
            await login(data as any);
        } catch (err) {
            // Error is handled by the store
        }
    };

    return (
        <AuthShell
            eyebrow="Bienvenida"
            title="Vuelve a tu ritual."
            copy="Entra para reservar, revisar tus clases y mantener tu pausa bonita lista para la semana."
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {error && (
                    <Alert variant="destructive" className="rounded-2xl border-wine/20 bg-wine/10 text-wine">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-chocolate">
                        Email
                    </Label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-coral" strokeWidth={1.7} />
                        <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            className="h-12 rounded-2xl border-chocolate/[0.12] bg-cream/[0.72] pl-11 text-chocolate placeholder:text-chocolate/[0.38] focus-visible:ring-coral"
                            {...register('email')}
                            disabled={isLoading}
                        />
                    </div>
                    {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="password" className="text-sm font-semibold text-chocolate">
                            Contraseña
                        </Label>
                        <Link
                            to="/forgot-password"
                            className="text-sm font-medium text-coral transition-colors hover:text-wine"
                        >
                            Recuperar
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-coral" strokeWidth={1.7} />
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="h-12 rounded-2xl border-chocolate/[0.12] bg-cream/[0.72] pl-11 pr-12 text-chocolate placeholder:text-chocolate/[0.38] focus-visible:ring-coral"
                            {...register('password')}
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-chocolate/[0.52] transition-[transform,background-color,color] duration-200 ease-sunrise hover:bg-coral/10 hover:text-coral active:scale-[0.94]"
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                </div>

                <Button
                    type="submit"
                    className="h-12 w-full rounded-full bg-chocolate text-cream shadow-[0_16px_34px_hsla(24,46%,30%,0.18)] transition-[transform,background-color] duration-200 ease-sunrise hover:-translate-y-0.5 hover:bg-wine active:scale-[0.97]"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Iniciando sesión
                        </>
                    ) : (
                        'Iniciar sesión'
                    )}
                </Button>

                <p className="text-center text-sm text-chocolate/[0.62]">
                    ¿Primera vez en Sunrise Sunset?{' '}
                    <Link to={returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : '/register'} className="font-semibold text-coral transition-colors hover:text-wine">
                        Crear cuenta
                    </Link>
                </p>

                <div className="mt-2 space-y-1 rounded-2xl bg-cream/[0.58] p-4 text-center sm:hidden">
                    <p className="text-xs font-semibold text-chocolate/80">
                        Instala la app en tu celular
                    </p>
                    <p className="text-[11px] leading-relaxed text-chocolate/[0.58]">
                        <strong>iPhone:</strong> toca <Share className="inline h-3 w-3 -mt-0.5" /> y luego <em>"Agregar a inicio"</em>
                        <br />
                        <strong>Android:</strong> toca <PlusSquare className="inline h-3 w-3 -mt-0.5" /> o el menú y <em>"Instalar app"</em>
                    </p>
                </div>
            </form>
        </AuthShell>
    );
}
