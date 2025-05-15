
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";

interface InitErrorStateProps {
  refreshing: boolean;
  onRetry: () => void;
}

const InitErrorState: React.FC<InitErrorStateProps> = ({ refreshing, onRetry }) => (
  <div className="bg-red-50 p-6 rounded-lg border border-red-200">
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Failed to Load Wishlists</h2>
      <p className="text-gray-600 mb-6">
        We couldn't load your wishlists. Please try again.
      </p>
      <Button
        onClick={onRetry}
        disabled={refreshing}
        className="flex items-center gap-2"
      >
        {refreshing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Try Again
      </Button>
    </div>
  </div>
);

export default InitErrorState;
