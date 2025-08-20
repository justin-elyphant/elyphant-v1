import React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const surfaceVariants = cva("transition-all duration-200", {
  variants: {
    variant: {
      primary: "surface-primary",
      secondary: "surface-secondary",
      elevated: "surface-elevated",
      sunken: "surface-sunken",
    },
    padding: {
      none: "",
      tight: "p-4",
      standard: "p-6",
      loose: "p-8",
    },
    rounded: {
      none: "",
      sm: "rounded-sm",
      default: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
    },
  },
  defaultVariants: {
    variant: "primary",
    padding: "standard",
    rounded: "default",
  },
});

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {
  children: React.ReactNode;
}

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, variant, padding, rounded, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(surfaceVariants({ variant, padding, rounded }), className)}
      {...props}
    >
      {children}
    </div>
  )
);
Surface.displayName = "Surface";