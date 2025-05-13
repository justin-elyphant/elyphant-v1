
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { toast } from "sonner";

interface ProfileImageSectionProps {
  currentImage: string | null;
  name: string;
  onImageUpdate: (url: string | null) => void;
}

const ProfileImageSection = ({ currentImage, name, onImageUpdate }: ProfileImageSectionProps) => {
  const [isUploading, setIsUploading] = useState(false);
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large", {
        description: "Maximum file size is 5MB"
      });
      return;
    }
    
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type", {
        description: "Only image files are allowed"
      });
      return;
    }
    
    setIsUploading(true);
    
    // For now, let's use a local file URL
    // In a real app, you'd upload this to Supabase Storage
    const fileUrl = URL.createObjectURL(file);
    onImageUpdate(fileUrl);
    
    // Simulate upload delay
    setTimeout(() => {
      setIsUploading(false);
      toast.success("Profile image updated");
    }, 1000);
  };
  
  const handleRemoveImage = () => {
    onImageUpdate(null);
    toast.success("Profile image removed");
  };
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col items-center">
      <Avatar className="h-32 w-32 mb-4">
        <AvatarImage src={currentImage || undefined} alt={name} />
        <AvatarFallback className="text-2xl bg-secondary">
          {getInitials(name || "User")}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="relative overflow-hidden"
          disabled={isUploading}
        >
          <Pencil className="h-4 w-4 mr-1" />
          <span>{isUploading ? "Uploading..." : "Upload"}</span>
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleImageUpload}
            accept="image/*"
            disabled={isUploading}
          />
        </Button>
        
        {currentImage && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveImage}
            disabled={isUploading}
          >
            <Trash className="h-4 w-4 mr-1" />
            <span>Remove</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProfileImageSection;
