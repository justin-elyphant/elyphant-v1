
import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  onError?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class NicoleOnboardingErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Nicole Onboarding Error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleSkip = () => {
    localStorage.setItem("userIntent", "explorer");
    localStorage.setItem("showingIntentModal", "false");
    this.props.onError?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold">Something went wrong</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Nicole encountered an issue during setup. You can try again or skip this step.
            </p>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={this.handleRetry} className="flex-1">
                Try Again
              </Button>
              <Button onClick={this.handleSkip} className="flex-1">
                Skip Setup
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default NicoleOnboardingErrorBoundary;
