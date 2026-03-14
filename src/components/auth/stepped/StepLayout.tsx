import React from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepLayoutProps {
  heading: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
  showBack?: boolean;
  showNext?: boolean;
  stepIndex?: number;
  totalSteps?: number;
  footer?: React.ReactNode;
}

const StepLayout: React.FC<StepLayoutProps> = ({
  heading,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  isNextDisabled = false,
  isNextLoading = false,
  showBack = true,
  showNext = true,
  stepIndex,
  totalSteps,
  footer,
}) => {
  return (
    <div className="flex flex-col">
      {/* Top bar with back button + step dots */}
      <div className="flex items-center px-4 py-3">
        {showBack && onBack ? (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 -ml-1 rounded-full hover:bg-muted active:bg-muted/80 touch-manipulation transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
        ) : (
          <div className="w-10 h-10" />
        )}

        {stepIndex !== undefined && totalSteps !== undefined && (
          <div className="flex-1 flex justify-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i <= stepIndex ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        )}

        <div className="w-10 h-10" />
      </div>

      {/* Content */}
      <div className="px-6 md:px-8 pb-2">
        <div className="pb-3">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            {heading}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
          )}
        </div>

        <div className="py-3 space-y-4">{children}</div>

        {footer && <div className="py-2">{footer}</div>}
      </div>

      {/* Bottom CTA */}
      {showNext && (
        <div className="px-6 md:px-8 pb-6 pt-2">
          <Button
            onClick={onNext}
            disabled={isNextDisabled || isNextLoading}
            className="w-full h-12 text-base font-medium touch-manipulation rounded-lg"
            size="lg"
          >
            {isNextLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : (
              nextLabel
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default StepLayout;
