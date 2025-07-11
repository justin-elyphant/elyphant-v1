
import React, { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { useProfileImage } from "@/hooks/settings/profile/useProfileImage";
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
  const { handleProfileImageUpdate, handleRemoveImage } = useProfileImage();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("File selected:", file);
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
      console.log("Starting upload process...");
      setUploading(true);
      
      // Create a preview immediately
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      // Generate a unique file name with proper folder structure for RLS
      const fileExt = file.name.split('.').pop();
      const fileName = `profile-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${user.id}/${fileName}`;
      
      // Remove old profile image if it exists
      try {
        const { data: existingFiles } = await supabase.storage
          .from('avatars')
          .list(`profile-images/${user.id}`);
        
        if (existingFiles && existingFiles.length > 0) {
          const deletePromises = existingFiles.map(file => 
            supabase.storage
              .from('avatars')
              .remove([`profile-images/${user.id}/${file.name}`])
          );
          await Promise.all(deletePromises);
        }
      } catch (error) {
        console.log("No existing files to remove or error removing:", error);
      }
      
      // Try to upload to Supabase Storage
      console.log("Attempting to upload to path:", filePath);
      console.log("User ID:", user.id);
      console.log("File details:", { name: file.name, size: file.size, type: file.type });
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error("Storage upload failed:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        console.error("File path attempted:", filePath);
        toast.error(`Failed to upload image: ${error.message}`);
        setPreview(currentImage);
        return; // CRITICAL: Exit here - don't proceed to database update
      }
      
      console.log("Storage upload successful:", data);
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const finalImageUrl = publicUrlData.publicUrl;
      console.log("Generated public URL:", finalImageUrl);
      
      // Test if the URL is actually accessible
      try {
        const testResponse = await fetch(finalImageUrl, { method: 'HEAD' });
        if (!testResponse.ok) {
          throw new Error(`Image not accessible: ${testResponse.status}`);
        }
        console.log("Image URL verified as accessible");
      } catch (urlError) {
        console.error("Generated URL is not accessible:", urlError);
        toast.error("Image uploaded but not accessible. Please try again.");
        setPreview(currentImage);
        return;
      }
      
      // Only update profile if storage upload was successful AND URL is accessible
      await handleProfileImageUpdate(finalImageUrl);
      
      // Update local state and notify parent
      setPreview(finalImageUrl);
      onImageUpdate(finalImageUrl);
      toast.success("Profile image updated successfully");
      
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
      setPreview(currentImage);
    } finally {
      setUploading(false);
    }
  };
  
  const handleRemoveImageClick = async () => {
    if (!user) return;
    
    try {
      setUploading(true);
      
      // Update profile through the hook
      await handleRemoveImage();
      
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
              onClick={handleRemoveImageClick}
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
