
import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";

interface ProductCarouselProps {
  images: string[];
  productName: string;
}

const ProductCarousel = ({ images, productName }: ProductCarouselProps) => {
  // If no images available, show placeholder
  if (images.length === 0) {
    return (
      <div className="aspect-square relative bg-gray-100 flex items-center justify-center">
        <span className="text-muted-foreground">No image available</span>
      </div>
    );
  }
  
  // If only one image, just show it directly
  if (images.length === 1) {
    return (
      <div className="aspect-square relative">
        <img 
          src={images[0]} 
          alt={productName}
          className="w-full h-full object-cover rounded-md"
          onError={(e) => {
            console.error("Image failed to load:", images[0]);
            e.currentTarget.src = "/placeholder.svg";
          }}
        />
      </div>
    );
  }

  // If multiple images, show carousel with navigation
  return (
    <Carousel className="w-full">
      <CarouselContent>
        {images.map((img, idx) => (
          <CarouselItem key={idx}>
            <div className="aspect-square relative">
              <img 
                src={img} 
                alt={`${productName} view ${idx + 1}`}
                className="w-full h-full object-cover rounded-md"
                onError={(e) => {
                  console.error("Image failed to load:", img);
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {images.length > 1 && (
        <>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </>
      )}
    </Carousel>
  );
};

export default ProductCarousel;
