import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

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
    <div className="min-h-[100dvh] flex flex-col bg-background pt-safe pb-safe">
      {/* Top bar with back button */}
      <div className="flex items-center px-4 py-3 md:py-4">
        {showBack && onBack ? (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-12 h-12 -ml-2 rounded-full hover:bg-muted active:bg-muted/80 touch-manipulation transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        ) : (
          <div className="w-12 h-12" />
        )}

        {/* Step dots */}
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

        <div className="w-12 h-12" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 md:px-0 md:max-w-md md:mx-auto md:w-full">
        <div className="pt-6 md:pt-12 pb-4">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            {heading}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
          )}
        </div>

        <div className="flex-1 py-4 space-y-4">{children}</div>

        {footer && <div className="py-2">{footer}</div>}
      </div>

      {/* Sticky bottom CTA */}
      {showNext && (
        <div className="sticky bottom-0 left-0 right-0 p-4 pb-safe bg-background border-t border-border md:border-0 md:max-w-md md:mx-auto md:w-full md:static md:pb-8">
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
