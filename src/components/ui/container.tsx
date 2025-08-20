import React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const containerVariants = cva("mx-auto", {
  variants: {
    width: {
      content: "container-content",
      narrow: "container-narrow", 
      full: "container-full",
    },
    padding: {
      none: "",
      minimal: "px-4",
      standard: "px-6",
      large: "px-8",
    },
  },
  defaultVariants: {
    width: "content",
    padding: "standard",
  },
});

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  children: React.ReactNode;
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, width, padding, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(containerVariants({ width, padding }), className)}
      {...props}
    >
      {children}
    </div>
  )
);
Container.displayName = "Container";