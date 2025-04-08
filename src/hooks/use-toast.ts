
// Update this hook to simply re-export from sonner
import { toast } from "sonner";
export { toast };

// Export a simplified useToast hook
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
