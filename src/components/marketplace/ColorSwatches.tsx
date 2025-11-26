import React from "react";
import { cn } from "@/lib/utils";

interface ColorSwatchesProps {
  colors?: string[];
  maxVisible?: number;
  selectedColor?: string;
  onColorSelect?: (color: string) => void;
  className?: string;
}

const ColorSwatches: React.FC<ColorSwatchesProps> = ({
  colors = [],
  maxVisible = 5,
  selectedColor,
  onColorSelect,
  className
}) => {
  if (!colors || colors.length === 0) return null;

  const visibleColors = colors.slice(0, maxVisible);
  const remainingCount = Math.max(0, colors.length - maxVisible);

  const getColorClass = (color: string): string => {
    const colorMap: Record<string, string> = {
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      black: "bg-black",
      white: "bg-white border-2 border-border",
      gray: "bg-gray-500",
      grey: "bg-gray-500",
      pink: "bg-pink-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      brown: "bg-amber-700",
      beige: "bg-amber-200",
      navy: "bg-blue-900",
      teal: "bg-teal-500",
      olive: "bg-lime-700"
    };

    const normalizedColor = color.toLowerCase();
    return colorMap[normalizedColor] || "bg-gray-300";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {visibleColors.map((color, index) => (
        <button
          key={`${color}-${index}`}
          onClick={(e) => {
            e.stopPropagation();
            onColorSelect?.(color);
          }}
          className={cn(
            "w-6 h-6 rounded-full transition-all shrink-0 relative",
            "min-w-[44px] min-h-[44px] flex items-center justify-center",
            getColorClass(color),
            selectedColor === color && "ring-2 ring-foreground ring-offset-2"
          )}
          aria-label={`Select ${color} color`}
        >
          {/* Inner circle for 44px tap target */}
          <span
            className={cn(
              "w-6 h-6 rounded-full absolute",
              getColorClass(color),
              selectedColor === color && "ring-2 ring-foreground"
            )}
          />
        </button>
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground font-medium">
          +{remainingCount}
        </span>
      )}
    </div>
  );
};

export default ColorSwatches;
