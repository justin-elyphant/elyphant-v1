
import React, { forwardRef, useRef, useImperativeHandle } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, prefersHighContrast, handleKeyboardNavigation } from "@/utils/accessibility";

interface AccessibleButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  describedBy?: string;
  expandedState?: boolean;
  controlsId?: string;
  announcement?: string;
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    children,
    className,
    loading = false,
    loadingText = "Loading...",
    describedBy,
    expandedState,
    controlsId,
    announcement,
    disabled,
    onClick,
    onKeyDown,
    ...props
  }, ref) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const reducedMotion = prefersReducedMotion();
    const highContrast = prefersHighContrast();
    
    useImperativeHandle(ref, () => buttonRef.current!, []);
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;
      
      // Announce action to screen readers if specified
      if (announcement) {
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.className = 'sr-only';
        announcer.textContent = announcement;
        document.body.appendChild(announcer);
        setTimeout(() => document.body.removeChild(announcer), 1000);
      }
      
      onClick?.(e);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      handleKeyboardNavigation(e, {
        onEnter: () => !loading && !disabled && buttonRef.current?.click(),
        onSpace: () => !loading && !disabled && buttonRef.current?.click()
      });
      
      onKeyDown?.(e);
    };
    
    const accessibilityProps = {
      'aria-busy': loading,
      'aria-describedby': describedBy,
      'aria-expanded': expandedState !== undefined ? expandedState : undefined,
      'aria-controls': controlsId,
      'aria-disabled': disabled || loading
    };
    
    return (
      <Button
        ref={buttonRef}
        className={cn(
          // Base accessibility styles
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          
          // High contrast mode support
          highContrast && [
            "border-2 border-black",
            "disabled:border-gray-400",
            "focus-visible:ring-4 focus-visible:ring-black"
          ],
          
          // Reduced motion support
          !reducedMotion && "transition-all duration-200",
          
          // Loading state
          loading && "cursor-wait",
          
          className
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...accessibilityProps}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            <span>{loadingText}</span>
          </div>
        ) : (
          children
        )}
      </Button>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";

export { AccessibleButton };
export type { AccessibleButtonProps };
