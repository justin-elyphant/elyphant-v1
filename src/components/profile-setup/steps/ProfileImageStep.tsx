import React, { useRef, useState } from "react";
import { Camera, Upload, UserCircle, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

interface ProfileImageStepProps {
  value: string | null;
  onChange: (imageUrl: string | null) => void;
  name: string;
}

const ProfileImageStep: React.FC<ProfileImageStepProps> = ({ value, onChange, name }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
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
      setIsUploading(true);
      
      // Create a preview for immediate feedback
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          // Update preview immediately
          onChange(event.target.result as string);
          
          // Also update the user's profile in Supabase
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              profile_image: event.target.result as string
            })
            .eq('id', user.id);
            
          if (updateError) {
            console.error("Error updating profile image:", updateError);
            toast.error("Failed to save profile image");
          }
        }
      };
      reader.readAsDataURL(file);

      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;
      
      // Check if storage bucket exists
      const { data: bucketData } = await supabase.storage.listBuckets();
      
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
        
        if (error) throw error;
        
        // Get the public URL
        const { data: publicUrlData } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrlData.publicUrl;
        onChange(imageUrl);
        
        toast.success("Profile image uploaded successfully");
      } else {
        // Just keep the data URL for now
        toast.info("Using temporary image format. Image will be properly stored when you complete setup.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveImage = () => {
    onChange(null);
    toast.success("Profile image removed");
  };
  
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Add a profile picture</h3>
        <p className="text-sm text-muted-foreground">
          Help your friends recognize you with a profile picture
        </p>
      </div>
      
      <div className="flex flex-col items-center gap-6">
        <div className="relative group">
          <Avatar className="h-40 w-40">
            {value ? (
              <AvatarImage src={value} alt="Profile" />
            ) : (
              <AvatarFallback className="bg-purple-100 text-purple-600 text-4xl">
                {getInitials(name)}
              </AvatarFallback>
            )}
          </Avatar>
          
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:text-white hover:bg-black/30 rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Camera className="h-8 w-8" />
              )}
            </Button>
          </div>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload photo"}
          </Button>
          
          {value && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleRemoveImage}
              disabled={isUploading}
            >
              Remove photo
            </Button>
          )}
        </div>
        
        <div className="text-center text-sm text-muted-foreground max-w-xs">
          A profile picture helps friends identify you and makes your profile more personalized. 
          We support JPG, PNG, GIF and WebP formats.
        </div>
      </div>
    </div>
  );
};

export default ProfileImageStep;
