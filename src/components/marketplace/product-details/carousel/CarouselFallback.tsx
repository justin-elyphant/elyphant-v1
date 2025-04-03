
import React from "react";
import { ImageOff } from "lucide-react";

interface CarouselFallbackProps {
  message?: string;
}

const CarouselFallback = ({ message = "No image available" }: CarouselFallbackProps) => {
  return (
    <div className="aspect-square relative bg-gray-100 flex flex-col items-center justify-center">
      <ImageOff className="h-8 w-8 text-gray-400 mb-2" />
      <span className="text-muted-foreground">{message}</span>
    </div>
  );
};

export default CarouselFallback;
