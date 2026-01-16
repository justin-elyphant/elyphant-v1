/**
 * Centralized URL utilities for generating shareable links
 * Ensures production URL (elyphant.ai) is used for sharing while allowing localhost for development
 */

/**
 * Returns the base URL for the application
 * Uses production URL for shared links, falls back to current origin for development
 */
export const getAppUrl = (): string => {
  const productionUrl = 'https://elyphant.ai';
  
  // For local development (localhost), use current origin
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      return window.location.origin;
    }
  }
  
  return productionUrl;
};

/**
 * Generate a shareable wishlist URL (for public sharing)
 */
export const getWishlistShareUrl = (wishlistId: string): string => {
  return `${getAppUrl()}/shared-wishlist/${wishlistId}`;
};

/**
 * Generate a direct wishlist URL (for logged-in users/internal links)
 */
export const getWishlistDirectUrl = (wishlistId: string): string => {
  return `${getAppUrl()}/wishlist/${wishlistId}`;
};

/**
 * Generate a profile URL with optional wishlist parameter
 */
export const getProfileUrl = (usernameOrId: string, wishlistId?: string): string => {
  const base = `${getAppUrl()}/profile/${usernameOrId}`;
  return wishlistId ? `${base}?wishlist=${wishlistId}` : base;
};
