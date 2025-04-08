
// This file serves as a centralized location for toast-related functionality
import { toast as sonnerToast } from "sonner";

// Re-export the toast function
export const toast = sonnerToast;

// Helper function that correctly formats toast without 'title' property
export const showToast = (
  type: 'success' | 'error' | 'info' | 'loading', 
  message: string, 
  description?: string,
  duration?: number
) => {
  if (type === 'success') {
    sonnerToast.success(message, { description, duration });
  } else if (type === 'error') {
    sonnerToast.error(message, { description, duration });
  } else if (type === 'info') {
    sonnerToast.info(message, { description, duration });
  } else if (type === 'loading') {
    sonnerToast.loading(message, { description, duration });
  }
};
