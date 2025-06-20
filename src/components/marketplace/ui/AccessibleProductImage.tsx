
import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, prefersHighContrast, announceToScreenReader } from "@/utils/accessibility";
import { AlertCircle, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccessibleProductImageProps {
  imageSrc: string;
  altText: string;
  enableZoom?: boolean;
  aspectRatio?: "square" | "4:3" | "16:9" | "auto";
  fallbackSrc?: string;
  className?: string;
  onImageLoad?: () => void;
  onImageError?: () => void;
  priority?: boolean;
}

const AccessibleProductImage: React.FC<AccessibleProductImageProps> = ({
  imageSrc,
  altText,
  enableZoom = true,
  aspectRatio = "square",
  fallbackSrc = "/placeholder.svg",
  className,
  onImageLoad,
  onImageError,
  priority = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const reducedMotion = prefersReducedMotion();
  const highContrast = prefersHighContrast();
  
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
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableZoom || !isZoomed || reducedMotion) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setPosition({ x, y });
  }, [enableZoom, isZoomed, reducedMotion]);
  
  // Handle image load
  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setImageError(false);
    onImageLoad?.();
    announceToScreenReader(`Image loaded: ${altText}`);
  }, [altText, onImageLoad]);
  
  // Handle image error
  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setImageError(true);
    onImageError?.();
    announceToScreenReader(`Failed to load image: ${altText}`, 'assertive');
  }, [altText, onImageError]);
  
  // Handle zoom toggle
  const toggleZoom = useCallback(() => {
    if (!enableZoom) return;
    
    const newZoomed = !isZoomed;
    setIsZoomed(newZoomed);
    setZoomLevel(newZoomed ? 2 : 1);
    
    announceToScreenReader(
      newZoomed ? `Image zoomed in: ${altText}` : `Image zoomed out: ${altText}`
    );
  }, [enableZoom, isZoomed, altText]);
  
  // Handle keyboard interaction
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        toggleZoom();
        break;
      case 'Escape':
        if (isZoomed) {
          e.preventDefault();
          setIsZoomed(false);
          setZoomLevel(1);
          announceToScreenReader(`Image zoom reset: ${altText}`);
        }
        break;
      case '+':
      case '=':
        if (enableZoom && isZoomed) {
          e.preventDefault();
          const newLevel = Math.min(zoomLevel + 0.5, 4);
          setZoomLevel(newLevel);
          announceToScreenReader(`Zoom level: ${Math.round(newLevel * 100)}%`);
        }
        break;
      case '-':
        if (enableZoom && isZoomed) {
          e.preventDefault();
          const newLevel = Math.max(zoomLevel - 0.5, 1);
          setZoomLevel(newLevel);
          if (newLevel === 1) {
            setIsZoomed(false);
          }
          announceToScreenReader(`Zoom level: ${Math.round(newLevel * 100)}%`);
        }
        break;
    }
  }, [enableZoom, isZoomed, zoomLevel, altText, toggleZoom]);
  
  // Set up zoom transform style with reduced motion consideration
  const zoomStyle = enableZoom && isZoomed && !reducedMotion ? {
    transform: `scale(${zoomLevel})`,
    transformOrigin: `${position.x}% ${position.y}%`,
    transition: 'transform 0.3s ease-out'
  } : {};
  
  // High contrast styles
  const highContrastStyles = highContrast ? {
    border: '2px solid #000000',
    filter: 'contrast(1.2)'
  } : {};

  if (imageError) {
    return (
      <div 
        className={cn(
          "flex flex-col items-center justify-center bg-gray-100 text-gray-600 p-4",
          getAspectRatioClass(),
          className
        )}
        style={highContrastStyles}
        role="img"
        aria-label={`Failed to load image: ${altText}`}
      >
        <AlertCircle className="h-8 w-8 mb-2" aria-hidden="true" />
        <p className="text-sm text-center font-medium">Image unavailable</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setImageError(false);
            setIsLoading(true);
            if (imageRef.current) {
              imageRef.current.src = imageSrc;
            }
          }}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "overflow-hidden relative group",
        getAspectRatioClass(),
        enableZoom && "cursor-pointer focus-within:ring-2 focus-within:ring-blue-500",
        className
      )}
      onMouseEnter={() => enableZoom && !reducedMotion && setIsZoomed(true)}
      onMouseLeave={() => enableZoom && !reducedMotion && setIsZoomed(false)}
      onMouseMove={handleMouseMove}
      onClick={toggleZoom}
      onKeyDown={handleKeyDown}
      tabIndex={enableZoom ? 0 : -1}
      role={enableZoom ? "button" : "img"}
      aria-label={enableZoom ? `${altText} - Click or press Enter to zoom` : altText}
      style={highContrastStyles}
    >
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="sr-only">Loading image</span>
        </div>
      )}
      
      {/* Main image */}
      <img 
        ref={imageRef}
        src={imageSrc}
        alt={altText}
        className={cn(
          "w-full h-full object-cover",
          !reducedMotion && "transition-transform duration-300 ease-out",
          isLoading && "opacity-0"
        )}
        style={zoomStyle}
        onLoad={handleImageLoad}
        onError={() => {
          // Try fallback first, then show error
          if (imageRef.current && imageRef.current.src !== fallbackSrc) {
            imageRef.current.src = fallbackSrc;
          } else {
            handleImageError();
          }
        }}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
      
      {/* Zoom overlay for reduced motion users */}
      {enableZoom && reducedMotion && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
      )}
      
      {/* Zoom controls */}
      {enableZoom && (
        <>
          {/* Zoom indicator */}
          <div className={cn(
            "absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            isZoomed && "opacity-100"
          )}>
            {isZoomed ? <ZoomOut className="h-3 w-3" /> : <ZoomIn className="h-3 w-3" />}
            <span className="sr-only">
              {isZoomed ? 'Zoom out' : 'Zoom in'} - Current zoom: {Math.round(zoomLevel * 100)}%
            </span>
          </div>
          
          {/* Keyboard hint */}
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs opacity-0 group-focus-within:opacity-100 transition-opacity duration-200">
            Press Enter to zoom
          </div>
        </>
      )}
      
      {/* High contrast outline */}
      {highContrast && (
        <div className="absolute inset-0 border-2 border-black pointer-events-none" />
      )}
    </div>
  );
};

export default AccessibleProductImage;
