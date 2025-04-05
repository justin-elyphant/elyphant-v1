
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useProfileImage = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImage = async (userId: string, imageData: string | null) => {
    if (!imageData || !imageData.startsWith('data:')) {
      return imageData;
    }

    // Extract file data from base64 string
    const fileExt = imageData.substring(imageData.indexOf('/') + 1, imageData.indexOf(';base64'));
    const fileName = `${userId}.${fileExt}`;
    const fileData = imageData.replace(/^data:image\/\w+;base64,/, '');
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, decode(fileData), {
        contentType: `image/${fileExt}`,
        upsert: true
      });
      
    if (error) {
      console.error("Error uploading profile image:", error);
      return imageData;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
        
    return publicUrlData.publicUrl;
  };
  
  // Helper function to decode base64 to binary
  function decode(base64String: string): Uint8Array {
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  return {
    profileImage,
    setProfileImage,
    handleImageUpload,
    uploadProfileImage
  };
};
