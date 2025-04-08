
// Update import paths to use the new Sonner-based toast implementation
import { toast } from "sonner";
export { toast };

// Export a simplified useToast hook that matches what components expect
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
