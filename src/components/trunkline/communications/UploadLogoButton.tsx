import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const UploadLogoButton = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);

  const handleUpload = async () => {
    try {
      setIsUploading(true);

      // Fetch the local logo file
      const response = await fetch("/images/email/elyphant-logo.png");
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from("email-assets")
        .upload("elyphant-logo.png", blob, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      setIsUploaded(true);
      toast.success("Logo uploaded successfully!");
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Button
      onClick={handleUpload}
      disabled={isUploading || isUploaded}
      variant={isUploaded ? "outline" : "default"}
      size="sm"
    >
      {isUploaded ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Logo Uploaded
        </>
      ) : (
        <>
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload Elyphant Logo"}
        </>
      )}
    </Button>
  );
};
