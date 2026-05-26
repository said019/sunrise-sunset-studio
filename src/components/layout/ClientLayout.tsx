import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ClientLayoutProps {
    children: ReactNode;
    /** Hide the floating action button (default: visible on Dashboard-like surfaces only via prop control). */
    fab?: { to: string; label: string; icon?: string } | null;
}

/** Top + bottom navigation shell for the authenticated client area. */
const navItems = [
    { href: '/app',         label: 'Inicio',   icon: 'home' },
    { href: '/app/book',    label: 'Reservar', icon: 'calendar_today' },
    { href: '/app/wallet',  label: 'Wallet',   icon: 'account_balance_wallet' },
    { href: '/app/profile', label: 'Perfil',   icon: 'person' },
] as const;

/** Desktop top-nav extras (still accessible from Profile/dashboard on mobile). */
const desktopExtras = [
    { href: '/app/classes',  label: 'Mis Clases' },
    { href: '/app/checkout', label: 'Comprar'    },
] as const;

export function ClientLayout({ children, fab }: ClientLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const initials = (user?.display_name || '?')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const isActive = (href: string) =>
        location.pathname === href || location.pathname.startsWith(`${href}/`);

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Top App Bar — fixed, editorial */}
            <header
                className="fixed top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border/40"
                style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
                <div className="flex h-20 items-center justify-between px-5 md:px-16 max-w-[1200px] mx-auto">
                    {/* Left: user avatar (opens dropdown) + brand */}
                    {/* Left: logo */}
                    <Link to="/app" aria-label="Sunrise Sunset · Inicio" className="block shrink-0">
                        <img
                            src="/logo-wordmark.svg"
                            alt="Sunrise Sunset"
                            className="h-12 w-auto rounded-lg select-none"
                            draggable={false}
                        />
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    'flex items-center gap-1 text-sm font-medium tracking-wide transition-opacity hover:opacity-100',
                                    isActive(item.href) ? 'text-coral opacity-100 font-semibold' : 'text-foreground/70 opacity-80'
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                        {desktopExtras.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    'text-sm font-medium tracking-wide transition-opacity hover:opacity-100',
                                    isActive(item.href) ? 'text-coral opacity-100 font-semibold' : 'text-foreground/60 opacity-80'
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right: bell + user menu (estándar — controles de usuario a la derecha) */}
                    <div className="flex items-center gap-1 shrink-0">
                        <Link
                            to="/app/notifications"
                            aria-label="Notificaciones"
                            className="text-coral hover:opacity-80 transition-opacity active:scale-95 duration-200 p-2"
                        >
                            <span className="material-symbols-outlined text-2xl">notifications</span>
                        </Link>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="w-10 h-10 rounded-full bg-cream overflow-hidden border border-border/40 transition-transform active:scale-95 ml-1"
                                    aria-label="Menú de usuario"
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user?.photo_url || undefined} alt={user?.display_name} />
                                        <AvatarFallback className="bg-coral text-cream font-heading text-sm">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-semibold leading-none">{user?.display_name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/app/profile" className="cursor-pointer">
                                        <span className="material-symbols-outlined text-base mr-2">person</span>
                                        <span>Mi Perfil</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/app/classes" className="cursor-pointer">
                                        <span className="material-symbols-outlined text-base mr-2">event_note</span>
                                        <span>Mis Clases</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/app/orders" className="cursor-pointer">
                                        <span className="material-symbols-outlined text-base mr-2">receipt_long</span>
                                        <span>Mis Órdenes</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/app/checkout" className="cursor-pointer">
                                        <span className="material-symbols-outlined text-base mr-2">shopping_bag</span>
                                        <span>Comprar</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                                    <span className="material-symbols-outlined text-base mr-2">logout</span>
                                    <span>Cerrar Sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="pt-24 pb-32 md:pb-16 px-5 md:px-16 max-w-[1200px] mx-auto">{children}</main>

            {/* Floating Action Button (contextual, page passes config) */}
            {fab && (
                <Link
                    to={fab.to}
                    aria-label={fab.label}
                    className="fixed bottom-28 right-6 md:hidden w-14 h-14 bg-coral text-cream rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform duration-200 z-40"
                >
                    <span className="material-symbols-outlined text-2xl">{fab.icon || 'add'}</span>
                </Link>
            )}

            {/* Mobile bottom nav — 4 items, editorial */}
            <nav
                className="fixed bottom-0 left-0 w-full z-50 md:hidden bg-card shadow-[0_-4px_20px_-10px_hsla(14,47%,35%,0.08)] rounded-t-xl flex justify-around items-center px-4 pt-3 pb-6"
                style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            >
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center transition-all duration-150 relative px-3',
                                active
                                    ? 'text-coral scale-100'
                                    : 'text-foreground/60 hover:text-foreground/90'
                            )}
                        >
                            <span
                                className={cn(
                                    'material-symbols-outlined text-[24px]',
                                    active && 'filled'
                                )}
                            >
                                {item.icon}
                            </span>
                            <span className="text-[11px] font-medium mt-1 tracking-wide">{item.label}</span>
                            {active && (
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-coral" />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
