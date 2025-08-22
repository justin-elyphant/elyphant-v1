
import React, { useState } from "react";
import {
  Carousel,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import CarouselFallback from "./carousel/CarouselFallback";
import SingleImageView from "./carousel/SingleImageView";
import CarouselItems from "./carousel/CarouselItems";
import CarouselIndicators from "./carousel/CarouselIndicators";
import FullscreenImageModal from "./carousel/FullscreenImageModal";
import { useCarouselState } from "./carousel/useCarouselState";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductCarouselProps {
  images: string[];
  productName: string;
}

const ProductCarousel = ({ images, productName }: ProductCarouselProps) => {
  const isMobile = useIsMobile();
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  
  // Use our custom hook to manage carousel state
  const {
    activeIndex,
    setActiveIndex,
    handleImageError,
    handleSlideChange,
    validImages
  } = useCarouselState(images);

  const handleImageClick = (index: number) => {
    setFullscreenIndex(index);
    setIsFullscreenOpen(true);
  };

  const handleCloseFullscreen = () => {
    setIsFullscreenOpen(false);
  };
  
  // If no images available, show placeholder
  if (validImages.length === 0) {
    return <CarouselFallback />;
  }
  
  // If only one image, just show it directly
  if (validImages.length === 1) {
    return (
      <>
        <SingleImageView 
          imageSrc={validImages[0]} 
          altText={productName}
          onImageClick={() => handleImageClick(0)}
        />
        <FullscreenImageModal
          images={validImages}
          initialIndex={fullscreenIndex}
          isOpen={isFullscreenOpen}
          onClose={handleCloseFullscreen}
          productName={productName}
        />
      </>
    );
  }

  // If multiple images, show carousel with conditional navigation
  return (
    <>
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
          <CarouselItems 
            images={validImages} 
            productName={productName}
            onImageError={handleImageError}
            onImageClick={handleImageClick}
          />
          
          {/* Show navigation arrows only on desktop */}
          {!isMobile && validImages.length > 1 && (
            <>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </>
          )}
        </Carousel>
        
        {/* Thumbnail indicators - shown on both mobile and desktop */}
        <CarouselIndicators 
          totalImages={validImages.length}
          activeIndex={activeIndex}
          onIndicatorClick={setActiveIndex}
        />
      </div>
      
      <FullscreenImageModal
        images={validImages}
        initialIndex={fullscreenIndex}
        isOpen={isFullscreenOpen}
        onClose={handleCloseFullscreen}
        productName={productName}
      />
    </>
  );
};

export default ProductCarousel;
