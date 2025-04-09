
import { toast } from "sonner";

// Export the toast function directly
export { toast };

// Export a simple useToast hook for compatibility with existing code
export const useToast = () => {
  return {
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        toast.dismiss(toastId);
      } else {
        toast.dismiss();
      }
    }
  };
};
