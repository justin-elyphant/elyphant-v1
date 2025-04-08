
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useProfileImage = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImage = async (userId: string, imageData: string | null) => {
    if (!imageData || !imageData.startsWith('data:')) {
      return imageData;
    }

    try {
      // Extract file data from base64 string
      const fileExt = imageData.substring(imageData.indexOf('/') + 1, imageData.indexOf(';base64'));
      const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const fileData = imageData.replace(/^data:image\/\w+;base64,/, '');
      
      // Check if the bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'avatars');
      
      // If bucket doesn't exist, try to create it (this may fail due to permissions)
      if (!bucketExists) {
        try {
          const { error: createBucketError } = await supabase.storage
            .createBucket('avatars', { public: true });
          
          if (createBucketError) {
            console.warn("Unable to create avatars bucket:", createBucketError);
            return imageData; // Return the base64 data if we can't create the bucket
          }
        } catch (err) {
          console.warn("Error creating bucket:", err);
          return imageData; // Return the base64 data if we can't create the bucket
        }
      }
      
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
    } catch (err) {
      console.error("Error in upload process:", err);
      return imageData;
    }
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
