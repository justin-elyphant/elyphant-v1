
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    
    // Combine refs
    const combinedRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        // Update our internal ref
        inputRef.current = node;
        
        // Forward the ref
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );
    
    // Apply effect to prevent auto-selection behavior
    React.useEffect(() => {
      if (inputRef.current) {
        const input = inputRef.current;
        
        // Function to position cursor at the end when focusing
        const handleFocus = () => {
          setTimeout(() => {
            if (input && input.value) {
              const len = input.value.length;
              input.setSelectionRange(len, len);
            }
          }, 0);
        };
        
        // Add event listener for focus
        input.addEventListener('focus', handleFocus);
        
        // Clean up event listener
        return () => {
          input.removeEventListener('focus', handleFocus);
        };
      }
    }, []);
    
    return (
      <input
        type={type || "text"}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={combinedRef}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
