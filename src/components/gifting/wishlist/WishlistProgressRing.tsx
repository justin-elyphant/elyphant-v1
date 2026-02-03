import React from "react";
import { cn } from "@/lib/utils";

interface WishlistProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

const WishlistProgressRing: React.FC<WishlistProgressRingProps> = ({
  percentage,
  size = 100,
  strokeWidth = 4,
  className,
  showLabel = true
}) => {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  
  // Calculate SVG parameters
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;
  
  // Don't render if percentage is 0
  if (clampedPercentage === 0) {
    return null;
  }

  const isComplete = clampedPercentage === 100;

  return (
    <div className={cn("absolute inset-0 pointer-events-none z-10", className)}>
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle - subtle gray */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeOpacity={0.3}
        />
        
        {/* Progress circle - purple gradient effect */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Percentage label in center */}
      {showLabel && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: 'translateY(-2px)' }}
        >
          <div className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-sm",
            isComplete 
              ? "bg-primary/90 text-primary-foreground" 
              : "bg-background/80 text-foreground"
          )}>
            {isComplete ? "100% Gifted" : `${Math.round(clampedPercentage)}%`}
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistProgressRing;
