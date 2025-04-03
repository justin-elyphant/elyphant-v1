
import React, { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { ImageOff } from "lucide-react";

interface ProductCarouselProps {
  images: string[];
  productName: string;
}

const ProductCarousel = ({ images, productName }: ProductCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const [uniqueImages, setUniqueImages] = useState<string[]>([]);
  
  // Process images to ensure they're unique
  useEffect(() => {
    // Use a Set to ensure uniqueness
    const uniqueImageSet = new Set(images);
    const uniqueImageArray = Array.from(uniqueImageSet);
    console.log(`ProcessedImages: ${uniqueImageArray.length} unique from ${images.length} total`);
    setUniqueImages(uniqueImageArray);
  }, [images]);
  
  // Filter out any images that failed to load
  const validImages = uniqueImages.filter((_, idx) => !failedImages[idx]);
  
  // If no images available, show placeholder
  if (validImages.length === 0) {
    return (
      <div className="aspect-square relative bg-gray-100 flex items-center justify-center">
        <ImageOff className="h-8 w-8 text-gray-400 mb-2" />
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
    console.error(`Image at index ${idx} failed to load:`, uniqueImages[idx]);
    setFailedImages(prev => ({...prev, [idx]: true}));
  };
  
  // Create a custom API ref to track slide changes
  const handleSlideChange = (api: any) => {
    const currentSlide = api?.selectedScrollSnap();
    if (typeof currentSlide === 'number') {
      setActiveIndex(currentSlide);
      console.log(`Carousel changed to image ${currentSlide}:`, uniqueImages[currentSlide]);
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
          {uniqueImages.map((img, idx) => (
            <CarouselItem key={`image-${idx}-${img.slice(-12)}`}>
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
                  {idx + 1}/{uniqueImages.length}
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
          {uniqueImages.map((_, idx) => (
            <div 
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === activeIndex ? 'bg-primary' : 'bg-gray-300'
              }`}
              role="button"
              tabIndex={0}
              onClick={() => {
                // Update the active index when a dot is clicked
                setActiveIndex(idx);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductCarousel;
