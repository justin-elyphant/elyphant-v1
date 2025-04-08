
// We should use the Sonner toaster component since we've migrated to using sonner
import { Toaster as SonnerToaster } from "sonner";

// This component wraps the Sonner toaster with our custom styles
export function Toaster() {
  return (
    <SonnerToaster 
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "bg-background border-border",
          title: "text-foreground",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }} 
    />
  );
}
