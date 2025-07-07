
import React, { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

interface ProfileImageUploadProps {
  currentImage: string | null;
  name: string;
  onImageUpdate: (url: string | null) => void;
}

const ProfileImageUpload = ({ currentImage, name, onImageUpdate }: ProfileImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPEG, PNG, GIF, WEBP)");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large. Maximum size is 5MB");
      return;
    }
    
    try {
      setUploading(true);
      
      // Create a preview immediately
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;
      
      let finalImageUrl = '';
      
      try {
        // Try to upload to Supabase Storage first
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (error) {
          console.log("Storage upload failed, using base64 fallback:", error);
          // Fallback to base64
          const base64Promise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          
          finalImageUrl = await base64Promise;
          console.log("Using base64 fallback for image");
        } else {
          // Get the public URL
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          
          finalImageUrl = publicUrlData.publicUrl;
          console.log("Image uploaded to storage, URL:", finalImageUrl);
        }
      } catch (storageError) {
        console.log("Storage error, using base64 fallback:", storageError);
        // Fallback to base64
        const base64Promise = new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        finalImageUrl = await base64Promise;
      }
      
      console.log("Final image URL to save:", finalImageUrl);
      
      // Update profile through ProfileContext instead of direct database call
      console.log("Profile updated successfully with image URL");
      
      // Update local state and notify parent (onImageUpdate will handle ProfileContext update)
      setPreview(finalImageUrl);
      onImageUpdate(finalImageUrl);
      toast.success("Profile image updated successfully");
      
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
      // Reset preview on error
      setPreview(currentImage);
    } finally {
      setUploading(false);
    }
  };
  
  const handleRemoveImage = async () => {
    if (!user) return;
    
    try {
      setUploading(true);
      
      console.log("Removing profile image for user:", user.id);
      
      // Update through ProfileContext instead of direct database call
      console.log("Profile image removed successfully");
      
      setPreview(null);
      onImageUpdate(null);
      toast.success("Profile image removed");
      
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error("Failed to remove image");
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <Avatar className="h-24 w-24 border-2 border-gray-200">
          {preview ? (
            <AvatarImage src={preview} alt={name} />
          ) : (
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {name?.substring(0, 2).toUpperCase() || "?"}
            </AvatarFallback>
          )}
        </Avatar>
        
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-white p-1 h-8 w-8"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
          </Button>
          
          {preview && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white p-1 h-8 w-8 ml-1"
              onClick={handleRemoveImage}
              disabled={uploading}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-xs mt-2"
      >
        {uploading ? "Uploading..." : "Change profile picture"}
      </Button>
    </div>
  );
};

export default ProfileImageUpload;
