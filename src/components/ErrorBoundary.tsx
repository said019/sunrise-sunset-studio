import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary]', error, info);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (!this.state.hasError) return this.props.children;
        if (this.props.fallback) return this.props.fallback;

        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <div className="max-w-md w-full text-center space-y-5">
                    <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                        <h1 className="font-heading text-2xl text-foreground mb-2">
                            Algo salió mal
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            La pagina no pudo cargarse. Intenta recargar; si vuelve a pasar, escribenos por WhatsApp.
                        </p>
                    </div>
                    {this.state.error?.message && (
                        <details className="text-left bg-muted/50 rounded-lg p-3 text-xs">
                            <summary className="cursor-pointer text-muted-foreground">
                                Detalle tecnico
                            </summary>
                            <pre className="mt-2 whitespace-pre-wrap break-words text-foreground/70">
                                {this.state.error.message}
                            </pre>
                        </details>
                    )}
                    <Button onClick={this.handleReload} variant="default">
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Recargar
                    </Button>
                </div>
            </div>
        );
    }
}
