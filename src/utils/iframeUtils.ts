
/**
 * Utility functions for iframe detection and handling
 */

export const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true; // If we can't access window.top, we're likely in an iframe
  }
};

export const getViewportHeight = (): number => {
  if (typeof window === 'undefined') return 600;
  
  // In iframe, use the iframe's height instead of viewport height
  if (isInIframe()) {
    try {
      return Math.max(window.innerHeight, 400); // Minimum height for usability
    } catch (e) {
      return 600; // Safe fallback
    }
  }
  
  return window.innerHeight;
};

export const getIframeSafeHeight = (height: "auto" | "min-screen" | "screen" | "large", isMobile: boolean): string => {
  if (height === "auto") return "";
  
  const vh = getViewportHeight();
  
  if (isInIframe()) {
    // Use fixed pixel heights for iframe environments
    switch (height) {
      case "min-screen":
        return `min-h-[${Math.max(vh, 400)}px]`;
      case "screen":
        return `h-[${vh}px]`;
      case "large":
        return isMobile ? "min-h-[400px]" : "min-h-[500px]";
      default:
        return "";
    }
  }
  
  // Use viewport units for normal windows
  const heightClasses = {
    "min-screen": "min-h-screen",
    "screen": "h-screen",
    "large": isMobile ? "min-h-[60vh]" : "min-h-[80vh]",
  };
  
  return heightClasses[height] || "";
};

// Iframe-safe navigation function
export const navigateInIframe = (path: string, navigate?: (path: string) => void) => {
  if (isInIframe()) {
    // Use history API for iframe navigation to prevent reload
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  } else {
    // Use React Router navigate if provided, otherwise fallback to location.href
    if (navigate) {
      navigate(path);
    } else {
      window.location.href = path;
    }
  }
};
