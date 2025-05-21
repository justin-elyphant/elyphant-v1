
import React from "react";
import { cn } from "@/lib/utils";

/**
 * Card with soft glassmorphism effect
 */
const GlassCard: React.FC<
  React.PropsWithChildren<{ className?: string }>
> = ({ children, className }) => (
  <div
    className={cn(
      "glass-morphism rounded-3xl shadow-lg border border-white/20 bg-white/60 backdrop-blur-md",
      "p-6 md:p-10",
      className
    )}
    style={{
      // fallback for very subtle white fallback in case tailwind not enabled:
      background: "rgba(255,255,255,0.60)",
      backdropFilter: "blur(8px)"
    }}
  >
    {children}
  </div>
);

export default GlassCard;
