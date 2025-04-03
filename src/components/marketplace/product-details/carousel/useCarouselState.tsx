
import { useState, useEffect } from "react";
import { processImages } from "./utils/imageUtils";
import { CarouselApi } from "@/components/ui/carousel";

export const useCarouselState = (images: string[]) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const [uniqueImages, setUniqueImages] = useState<string[]>([]);
  
  // Process images to ensure they're unique
  useEffect(() => {
    const processedImages = processImages(images);
    setUniqueImages(processedImages);
  }, [images]);
  
  // Handle image loading errors
  const handleImageError = (idx: number) => {
    console.error(`Image at index ${idx} failed to load:`, uniqueImages[idx]);
    setFailedImages(prev => ({...prev, [idx]: true}));
  };
  
  // Handle slide changes
  const handleSlideChange = (api: CarouselApi) => {
    const currentSlide = api?.selectedScrollSnap();
    if (typeof currentSlide === 'number') {
      setActiveIndex(currentSlide);
      console.log(`Carousel changed to image ${currentSlide}:`, uniqueImages[currentSlide]);
    }
  };
  
  // Filter out any images that failed to load
  const validImages = uniqueImages.filter((_, idx) => !failedImages[idx]);
  
  return {
    activeIndex,
    setActiveIndex,
    handleImageError,
    handleSlideChange,
    validImages
  };
};
