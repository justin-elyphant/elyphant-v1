
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation select-none tap-feedback",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95 focus-visible:ring-primary/50",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95 focus-visible:ring-destructive/50",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80 focus-visible:ring-accent/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/90 focus-visible:ring-secondary/50",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80 focus-visible:ring-accent/50",
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-primary/50",
        purple: "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white border-0 focus-visible:ring-purple/50",
      },
      size: {
        default: "h-10 px-4 py-2 min-h-[44px]",
        sm: "h-9 rounded-md px-3 min-h-[44px]",
        lg: "h-11 rounded-md px-8 min-h-[44px]",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
        touch: "h-12 px-6 py-3 min-h-[48px] text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  hapticFeedback?: keyof typeof HapticPatterns | false
  longPressAction?: () => void
  longPressDelay?: number
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    hapticFeedback = 'buttonTap',
    longPressAction,
    longPressDelay = 500,
    onClick,
    onTouchStart,
    onTouchEnd,
    onMouseDown,
    onMouseUp,
    children,
    disabled,
    'aria-label': ariaLabel,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    const [isLongPressing, setIsLongPressing] = React.useState(false)
    const longPressTimer = React.useRef<NodeJS.Timeout | null>(null)
    const startTime = React.useRef<number>(0)
    
    // Enhanced click handler with haptic feedback
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return
      
      // Only trigger haptic for regular clicks (not long presses)
      const duration = Date.now() - startTime.current
      if (duration < longPressDelay && hapticFeedback) {
        triggerHapticFeedback(HapticPatterns[hapticFeedback])
      }
      
      onClick?.(e)
    }, [disabled, hapticFeedback, longPressDelay, onClick])
    
    // Long press handlers
    const handlePressStart = React.useCallback((e: React.TouchEvent | React.MouseEvent) => {
      if (disabled || !longPressAction) return
      
      startTime.current = Date.now()
      setIsLongPressing(true)
      
      longPressTimer.current = setTimeout(() => {
        if (hapticFeedback) {
          triggerHapticFeedback('heavy')
        }
        longPressAction()
        setIsLongPressing(false)
      }, longPressDelay)
      
      // Call original handlers
      if ('touches' in e) {
        onTouchStart?.(e as React.TouchEvent<HTMLButtonElement>)
      } else {
        onMouseDown?.(e as React.MouseEvent<HTMLButtonElement>)
      }
    }, [disabled, longPressAction, longPressDelay, hapticFeedback, onTouchStart, onMouseDown])
    
    const handlePressEnd = React.useCallback((e: React.TouchEvent | React.MouseEvent) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      setIsLongPressing(false)
      
      // Call original handlers
      if ('touches' in e || 'changedTouches' in e) {
        onTouchEnd?.(e as React.TouchEvent<HTMLButtonElement>)
      } else {
        onMouseUp?.(e as React.MouseEvent<HTMLButtonElement>)
      }
    }, [onTouchEnd, onMouseUp])
    
    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
        }
      }
    }, [])
    
    // Enhanced accessibility
    const accessibilityProps = {
      'aria-label': ariaLabel || (typeof children === 'string' ? children : undefined),
      'aria-pressed': isLongPressing ? 'true' as const : undefined,
      'data-long-press': longPressAction ? 'true' : undefined,
    }
    
    // Handle children based on asChild prop
    const buttonContent = React.useMemo(() => {
      if (asChild) {
        // When using asChild, return children as-is to avoid React.Children.only error
        return children
      }
      
      // When not using asChild, we can add additional elements
      return (
        <>
          {children}
          {longPressAction && (
            <span className="sr-only">
              Long press for additional options
            </span>
          )}
        </>
      )
    }, [asChild, children, longPressAction])
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          isLongPressing && 'long-press-active',
          'safe-area-inset focus-visible'
        )}
        ref={ref}
        onClick={handleClick}
        onTouchStart={longPressAction ? handlePressStart : onTouchStart}
        onTouchEnd={longPressAction ? handlePressEnd : onTouchEnd}
        onMouseDown={longPressAction ? handlePressStart : onMouseDown}
        onMouseUp={longPressAction ? handlePressEnd : onMouseUp}
        disabled={disabled}
        {...accessibilityProps}
        {...props}
      >
        {buttonContent}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
