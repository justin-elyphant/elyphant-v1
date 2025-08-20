import React from "react";
import { cn } from "@/lib/utils";

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
}

export const Heading1 = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <h1
      ref={ref}
      className={cn("text-heading-1", className)}
      {...props}
    >
      {children}
    </h1>
  )
);
Heading1.displayName = "Heading1";

export const Heading2 = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-heading-2", className)}
      {...props}
    >
      {children}
    </h2>
  )
);
Heading2.displayName = "Heading2";

export const Heading3 = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-heading-3", className)}
      {...props}
    >
      {children}
    </h3>
  )
);
Heading3.displayName = "Heading3";

export const Heading4 = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <h4
      ref={ref}
      className={cn("text-heading-4", className)}
      {...props}
    >
      {children}
    </h4>
  )
);
Heading4.displayName = "Heading4";

export const BodyLarge = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-body-lg", className)}
      {...props}
    >
      {children}
    </p>
  )
);
BodyLarge.displayName = "BodyLarge";

export const Body = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-body", className)}
      {...props}
    >
      {children}
    </p>
  )
);
Body.displayName = "Body";

export const BodySmall = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-body-sm", className)}
      {...props}
    >
      {children}
    </p>
  )
);
BodySmall.displayName = "BodySmall";

export const Caption = React.forwardRef<HTMLSpanElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("text-caption", className)}
      {...props}
    >
      {children}
    </span>
  )
);
Caption.displayName = "Caption";