
// This file serves as a centralized location for toast-related functionality
import { useToast as useShadcnToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";

// Re-export the useToast hook
export const useToast = useShadcnToast;

// Re-export the toast function
export const toast = sonnerToast;
