
import React from "react";
import { 
  CarouselContent, 
  CarouselItem 
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { getHighResAmazonImage, getAmazonImageSrcSet } from "@/utils/amazonImageOptimizer";

interface CarouselItemsProps {
  images: string[];
  productName: string;
  onImageError: (index: number) => void;
  onImageClick?: (index: number) => void;
}

const CarouselItems = ({ images, productName, onImageError, onImageClick }: CarouselItemsProps) => {
  return (
    <CarouselContent>
      {images.map((img, idx) => (
        <CarouselItem key={`image-${idx}-${img.slice(-20)}`}>
          <div className="aspect-square relative group">
            <img 
              src={getHighResAmazonImage(img, 'detail')}
              srcSet={getAmazonImageSrcSet(img)}
              sizes="(max-width: 768px) 100vw, 60vw"
              alt={`${productName} view ${idx + 1}`}
              className="w-full h-full object-contain rounded-md cursor-pointer transition-transform hover:scale-105"
              onError={() => onImageError(idx)}
              onClick={() => onImageClick?.(idx)}
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
  );
};

export default CarouselItems;
