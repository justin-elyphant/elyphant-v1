
import React, { useState } from "react";

interface EnhancedProductImageProps {
  imageSrc: string;
  altText: string;
  enableZoom?: boolean;
  aspectRatio?: "square" | "4:3" | "16:9" | "auto";
  fallbackSrc?: string;
}

const EnhancedProductImage: React.FC<EnhancedProductImageProps> = ({
  imageSrc,
  altText,
  enableZoom = true,
  aspectRatio = "square",
  fallbackSrc = "/placeholder.svg"
}) => {
  const [imageError, setImageError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Get aspect ratio class
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square": return "aspect-square";
      case "4:3": return "aspect-[4/3]";
      case "16:9": return "aspect-[16/9]";
      case "auto": return "";
      default: return "aspect-square";
    }
  };
  
  // Handle mouse move for zoom effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableZoom) return;
    
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setPosition({ x, y });
  };
  
  // Set up zoom transform style
  const zoomStyle = enableZoom && isZoomed ? {
    transform: 'scale(1.5)',
    transformOrigin: `${position.x}% ${position.y}%`,
  } : {};
  
  return (
    <div 
      className={`overflow-hidden relative ${getAspectRatioClass()} bg-gray-50`}
      onMouseEnter={() => enableZoom && setIsZoomed(true)}
      onMouseLeave={() => enableZoom && setIsZoomed(false)}
      onMouseMove={handleMouseMove}
    >
      <img 
        src={imageError ? fallbackSrc : imageSrc}
        alt={altText}
        className={`w-full h-full object-cover transition-transform duration-200`} 
        style={zoomStyle}
        onError={() => setImageError(true)}
        loading="lazy"
      />
      
      {enableZoom && (
        <div className={`absolute inset-0 bg-black pointer-events-none transition-opacity duration-200 ${isZoomed ? 'opacity-10' : 'opacity-0'}`}></div>
      )}
      
      {/* Cursor indicator for zoom */}
      {enableZoom && (
        <div className="absolute top-2 right-2 bg-white/70 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          Hover to zoom
        </div>
      )}
    </div>
  );
};

export default EnhancedProductImage;
