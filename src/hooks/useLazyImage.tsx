
import { useState, useEffect } from "react";

export interface UseLazyImageOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function useLazyImage(
  src: string | undefined,
  fallback: string = "/placeholder.svg",
  options: UseLazyImageOptions = {}
) {
  const [imageSrc, setImageSrc] = useState<string>(fallback);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const {
    threshold = 0.1,
    rootMargin = "0px",
    once = true
  } = options;
  
  useEffect(() => {
    if (!src) {
      setImageSrc(fallback);
      return;
    }
    
    // Don't load if we already loaded this image and once option is true
    if (once && isLoaded && imageSrc === src) {
      return;
    }
    
    let observer: IntersectionObserver;
    let observerTarget: HTMLDivElement | null = null;
    
    const loadImage = () => {
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
        setError(null);
      };
      
      img.onerror = () => {
        setImageSrc(fallback);
        setError(new Error("Failed to load image"));
      };
      
      img.src = src;
    };
    
    try {
      // Create a temporary element to observe
      observerTarget = document.createElement("div");
      document.body.appendChild(observerTarget);
      
      // Create intersection observer
      observer = new IntersectionObserver(
        (entries) => {
          // Load image when it enters viewport
          if (entries[0].isIntersecting) {
            loadImage();
            
            // Disconnect once image is loaded if once is true
            if (once) {
              observer.disconnect();
            }
          }
        },
        {
          threshold,
          rootMargin
        }
      );
      
      observer.observe(observerTarget);
    } catch (e) {
      // Fallback for environments without IntersectionObserver
      loadImage();
    }
    
    return () => {
      if (observer && observerTarget) {
        observer.disconnect();
        if (observerTarget.parentNode) {
          observerTarget.parentNode.removeChild(observerTarget);
        }
      }
    };
  }, [src, fallback, threshold, rootMargin, once]);
  
  return {
    src: imageSrc,
    isLoaded,
    error
  };
}
