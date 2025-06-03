
import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  onError?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

class NicoleOnboardingErrorBoundary extends React.Component<Props, State> {
  private retryTimer?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Nicole Onboarding Error:", error, errorInfo);
    
    // Auto-retry once for transient errors
    if (this.state.retryCount === 0) {
      this.retryTimer = setTimeout(() => {
        this.handleRetry();
      }, 2000);
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  handleRetry = () => {
    console.log("Retrying Nicole onboarding");
    this.setState(prevState => ({ 
      hasError: false, 
      error: undefined, 
      retryCount: prevState.retryCount + 1 
    }));
  };

  handleSkip = () => {
    console.log("Skipping Nicole onboarding due to error");
    localStorage.setItem("userIntent", "explorer");
    localStorage.setItem("showingIntentModal", "false");
    this.props.onError?.();
  };

  handleForceComplete = () => {
    console.log("Force completing Nicole onboarding");
    localStorage.setItem("userIntent", "explorer");
    localStorage.removeItem("showingIntentModal");
    this.props.onError?.();
  };

  render() {
    if (this.state.hasError) {
      const { retryCount } = this.state;
      const isRecurringError = retryCount > 1;

      return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold">
                {isRecurringError ? "Persistent Issue Detected" : "Something went wrong"}
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              {isRecurringError 
                ? "Nicole is having trouble loading. You can continue to your dashboard or try one more time."
                : "Nicole encountered an issue during setup. This usually resolves quickly."
              }
            </p>
            
            <div className="flex gap-3">
              {!isRecurringError ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={this.handleRetry} 
                    className="flex-1"
                    disabled={retryCount > 2}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={this.handleSkip} className="flex-1">
                    Continue
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={this.handleRetry} 
                    className="flex-1"
                  >
                    One More Try
                  </Button>
                  <Button onClick={this.handleForceComplete} className="flex-1">
                    Continue to Dashboard
                  </Button>
                </>
              )}
            </div>
            
            {isRecurringError && (
              <p className="text-xs text-gray-500 mt-4 text-center">
                You can always access Nicole later from your dashboard
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default NicoleOnboardingErrorBoundary;
