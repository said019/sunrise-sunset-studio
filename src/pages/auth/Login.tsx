import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, Eye, EyeOff, Share, PlusSquare } from 'lucide-react';

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <img
                            src="/catarsis.jpg"
                            alt="Catarsis Studio"
                            className="h-16 w-16 rounded-full object-cover"
                        />
                    </div>
                    <CardTitle className="text-2xl font-heading">Bienvenido</CardTitle>
                    <CardDescription>
                        Ingresa a tu cuenta de Catarsis Studio
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

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

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Contraseña</Label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-primary hover:underline"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
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
                                    Iniciando sesión...
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </Button>

                        <p className="text-sm text-center text-muted-foreground">
                            ¿No tienes cuenta?{' '}
                            <Link to={returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : '/register'} className="text-primary hover:underline font-medium">
                                Regístrate
                            </Link>
                        </p>

                        {/* Install as app hint - only visible on mobile */}
                        <div className="sm:hidden mt-2 p-3 rounded-xl bg-muted/50 border border-border/50 text-center space-y-1">
                            <p className="text-xs font-semibold text-foreground/80">
                                Instala la app en tu celular
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                <strong>iPhone:</strong> Toca <Share className="inline h-3 w-3 -mt-0.5" /> y luego <em>"Agregar a inicio"</em>
                                <br />
                                <strong>Android:</strong> Toca <PlusSquare className="inline h-3 w-3 -mt-0.5" /> o el menú y <em>"Instalar app"</em>
                            </p>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
