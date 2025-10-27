import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 ErrorBoundary caught an error:', error);
    console.error('🔴 Error message:', error.message);
    console.error('🔴 Error stack:', error.stack);
    console.error('🔴 Component stack:', errorInfo.componentStack);
    
    // Also log to help identify the issue
    if (error.message) {
      console.error('🔴 Full error details:', JSON.stringify({
        message: error.message,
        name: error.name,
        stack: error.stack
      }, null, 2));
    }
    
    // Check if it's a dynamic import error
    if (error.message.includes('Failed to fetch dynamically imported module')) {
      console.log('Dynamic import error detected, attempting recovery...');
      
      // Force reload after a short delay to clear cache
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-2">
              {this.state.error?.message.includes('Failed to fetch dynamically imported module')
                ? 'Loading failed. The page will refresh automatically to fix this issue.'
                : 'An unexpected error occurred. Please try refreshing the page.'}
            </p>
            {this.state.error && (
              <details className="text-left bg-muted/50 p-4 rounded-lg mb-6 text-xs">
                <summary className="cursor-pointer font-semibold text-red-600 mb-2">
                  Error Details (for debugging)
                </summary>
                <code className="block whitespace-pre-wrap break-all">
                  {this.state.error.message}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </code>
              </details>
            )}
            <div className="space-x-4">
              <Button onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;