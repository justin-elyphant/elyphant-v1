/**
 * Utilities for personalized marketplace functionality
 */

export interface PersonalizedContext {
  recipientName: string;
  eventType?: string;
  relationship?: string;
  isPersonalized: boolean;
}

/**
 * Clear personalized marketplace data from session storage
 */
export const clearPersonalizedData = (): void => {
  try {
    sessionStorage.removeItem('personalized-products');
    sessionStorage.removeItem('personalized-context');
    console.log('🧹 Cleared personalized marketplace data');
  } catch (error) {
    console.warn('Failed to clear personalized data:', error);
  }
};

/**
 * Check if current session has personalized data
 */
export const hasPersonalizedData = (): boolean => {
  try {
    const products = sessionStorage.getItem('personalized-products');
    const context = sessionStorage.getItem('personalized-context');
    return !!(products && context);
  } catch (error) {
    return false;
  }
};

/**
 * Get personalized context from session storage
 */
export const getPersonalizedContext = (): PersonalizedContext | null => {
  try {
    const contextData = sessionStorage.getItem('personalized-context');
    return contextData ? JSON.parse(contextData) : null;
  } catch (error) {
    console.warn('Failed to get personalized context:', error);
    return null;
  }
};

/**
 * Format recipient name for URL
 */
export const formatRecipientNameForUrl = (name: string): string => {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

/**
 * Parse recipient name from URL
 */
export const parseRecipientNameFromUrl = (urlName: string): string => {
  return urlName
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize each word
};