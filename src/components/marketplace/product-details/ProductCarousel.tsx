
import React, { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";

interface ProductCarouselProps {
  images: string[];
  productName: string;
}

const ProductCarousel = ({ images, productName }: ProductCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  
  // Filter out any images that failed to load
  const validImages = images.filter((_, idx) => !failedImages[idx]);
  
  // If no images available, show placeholder
  if (validImages.length === 0) {
    return (
      <div className="aspect-square relative bg-gray-100 flex items-center justify-center">
        <span className="text-muted-foreground">No image available</span>
      </div>
    );
  }
  
  // If only one image, just show it directly
  if (validImages.length === 1) {
    return (
      <div className="aspect-square relative">
        <img 
          src={validImages[0]} 
          alt={productName}
          className="w-full h-full object-contain rounded-md"
          onError={(e) => {
            console.error("Image failed to load:", validImages[0]);
            e.currentTarget.src = "/placeholder.svg";
          }}
        />
      </div>
    );
  }

  // Handle image loading errors
  const handleImageError = (idx: number) => {
    console.error(`Image at index ${idx} failed to load:`, images[idx]);
    setFailedImages(prev => ({...prev, [idx]: true}));
  };
  
  // Create a custom API ref to track slide changes
  const handleSlideChange = (api: any) => {
    const currentSlide = api?.selectedScrollSnap();
    if (typeof currentSlide === 'number') {
      setActiveIndex(currentSlide);
      console.log(`Carousel changed to image ${currentSlide}:`, images[currentSlide]);
    }
  };

  // If multiple images, show carousel with navigation
  return (
    <div className="space-y-2">
      <Carousel 
        className="w-full"
        opts={{
          loop: true,
          align: "start"
        }}
        setApi={(api) => {
          if (api) {
            api.on('select', () => handleSlideChange(api));
          }
        }}
      >
        <CarouselContent>
          {images.map((img, idx) => (
            <CarouselItem key={`image-${idx}-${img.slice(-8)}`}>
              <div className="aspect-square relative">
                <img 
                  src={img} 
                  alt={`${productName} view ${idx + 1}`}
                  className="w-full h-full object-contain rounded-md"
                  onError={() => handleImageError(idx)}
                />
                <Badge 
                  variant="secondary" 
                  className="absolute bottom-2 right-2 bg-black/70 text-white"
                >
                  {idx + 1}/{images.length}
                </Badge>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {validImages.length > 1 && (
          <>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </>
        )}
      </Carousel>
      
      {/* Thumbnail indicators */}
      {validImages.length > 1 && (
        <div className="flex justify-center gap-1 mt-2">
          {images.map((_, idx) => (
            <div 
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === activeIndex ? 'bg-primary' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductCarousel;
