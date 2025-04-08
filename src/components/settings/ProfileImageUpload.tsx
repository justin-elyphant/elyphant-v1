
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
    
    try {
      // Create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      // Upload to Supabase
      setUploading(true);
      
      // Generate a unique file name to prevent overwrites
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;
      
      // Check if storage bucket exists, if not we'll use base64 data
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .listBuckets();
      
      let imageUrl = '';
      
      // If the avatars bucket exists, upload to Supabase Storage
      if (bucketData && bucketData.some(bucket => bucket.name === 'avatars')) {
        const { data, error } = await supabase
          .storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (error) {
          throw error;
        }
        
        // Get the public URL
        const { data: publicUrlData } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrlData.publicUrl;
      } else {
        // Fallback to base64 if storage not configured
        imageUrl = preview || '';
      }
      
      // Update profile record
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          profile_image: imageUrl
        })
        .eq('id', user.id);
      
      if (updateError) {
        throw updateError;
      }
      
      onImageUpdate(imageUrl);
      toast.success("Profile image updated successfully");
      
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      // Fallback to base64 data on error
      if (preview) {
        onImageUpdate(preview);
      }
    } finally {
      setUploading(false);
    }
  };
  
  const handleRemoveImage = async () => {
    if (!user) return;
    
    try {
      setUploading(true);
      
      // Update profile to remove image reference
      const { error } = await supabase
        .from('profiles')
        .update({
          profile_image: null
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
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
