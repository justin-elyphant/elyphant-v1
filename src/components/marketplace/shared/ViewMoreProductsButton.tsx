import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewMoreProductsButtonProps {
  onClick?: () => void;
  isLoading?: boolean;
  loadingLabel?: string;
  label?: string;
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  ariaLabel?: string;
}

/**
 * Lululemon-inspired "View More Products" CTA.
 * Single source of truth for the marketplace expansion button styling.
 *
 * Variants:
 *  - Desktop (default): fixed min-width pill (280px)
 *  - Mobile: pass `fullWidth` to stretch to container with safe touch sizing
 */
export const ViewMoreProductsButton: React.FC<ViewMoreProductsButtonProps> = ({
  onClick,
  isLoading = false,
  loadingLabel = "Searching...",
  label = "View More Products",
  fullWidth = false,
  className,
  disabled,
  type = "button",
  ariaLabel,
}) => {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      variant="outline"
      size="lg"
      aria-label={ariaLabel ?? label}
      className={cn(
        "min-h-[52px] uppercase tracking-wider text-xs font-semibold",
        "border-foreground/80 hover:bg-foreground hover:text-background",
        "touch-manipulation",
        fullWidth ? "w-full max-w-sm" : "min-w-[280px]",
        className,
      )}
    >
      {isLoading ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
};

export default ViewMoreProductsButton;
