
import React from "react";
import { ImageOff } from "lucide-react";

interface CarouselFallbackProps {
  message?: string;
}

const CarouselFallback = ({ message = "No image available" }: CarouselFallbackProps) => {
  return (
    <div className="aspect-square relative bg-muted flex flex-col items-center justify-center">
      <ImageOff className="h-8 w-8 text-muted-foreground mb-2" />
      <span className="text-muted-foreground">{message}</span>
    </div>
  );
};

export default CarouselFallback;
