import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center p-4">
                    <div className="max-w-md text-center space-y-4">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                            <AlertCircle className="h-10 w-10 text-destructive" />
                        </div>
                        <h1 className="text-2xl font-bold">Something went wrong</h1>
                        <p className="text-muted-foreground">
                            We're sorry, but something unexpected happened. Please try
                            refreshing the page.
                        </p>
                        {this.state.error && (
                            <details className="text-left">
                                <summary className="cursor-pointer text-sm text-muted-foreground">
                                    Error details
                                </summary>
                                <pre className="mt-2 rounded-lg bg-muted p-4 text-xs overflow-auto">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                        <Button
                            onClick={() => window.location.reload()}
                            className="mt-4"
                        >
                            Refresh Page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}