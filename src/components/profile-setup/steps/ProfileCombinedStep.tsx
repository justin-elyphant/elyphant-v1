
import React, { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Camera, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProfileCombinedStepProps {
  name: string;
  username: string;
  email: string;
  profileImage: string | null;
  onUsernameChange: (username: string) => void;
  onProfileImageChange: (imageUrl: string | null) => void;
}

const ProfileCombinedStep: React.FC<ProfileCombinedStepProps> = ({
  name,
  username,
  email,
  profileImage,
  onUsernameChange,
  onProfileImageChange
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [suggestedUsernames, setSuggestedUsernames] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate suggested usernames based on email and name
  useEffect(() => {
    if (email || name) {
      const emailPrefix = email ? email.split('@')[0] : '';
      const nameBase = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
      
      const suggestions = [
        emailPrefix,
        nameBase,
        `${nameBase}${Math.floor(Math.random() * 100)}`,
        `${emailPrefix}_${Math.floor(Math.random() * 100)}`,
        `${emailPrefix}${Math.floor(Math.random() * 1000)}`
      ].filter(Boolean);
      
      // Remove duplicates
      setSuggestedUsernames([...new Set(suggestions)]);
    }
  }, [email, name]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    onUsernameChange(newUsername);
  };

  const selectSuggestion = (username: string) => {
    onUsernameChange(username);
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      // First, check if the profiles table exists and has a username column
      const { data: tableInfo, error: tableError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      // If there's no error with the query, proceed to check for username
      if (!tableError) {
        // Try to check if username column exists and if the username is taken
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .maybeSingle();

          if (error && error.code === 'PGRST204') {
            // The username column doesn't exist, so all usernames are "available"
            console.log("Username column doesn't exist yet, all usernames are available");
            setIsAvailable(true);
          } else if (error) {
            throw error;
          } else {
            setIsAvailable(!data);
          }
        } catch (error) {
          console.error("Error checking username:", error);
          // If there's an error, just assume the username is available
          setIsAvailable(true);
        }
      } else {
        console.log("Couldn't query profiles table:", tableError);
        // If profiles table doesn't exist or can't be queried, assume username is available
        setIsAvailable(true);
      }
    } catch (error) {
      console.error("Error in username availability check:", error);
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  // Debounced username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (username) {
        checkUsernameAvailability(username);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
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
      reader.onload = (event) => {
        if (event.target?.result) {
          onProfileImageChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      toast.success("Profile image selected");
    } catch (error) {
      console.error("Error handling image:", error);
      toast.error("Failed to process image");
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveImage = () => {
    onProfileImageChange(null);
    toast.success("Profile image removed");
  };
  
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Personalize your profile</h3>
        <p className="text-sm text-muted-foreground">
          Add a username and profile photo to make your account uniquely yours
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 items-center">
        {/* Profile Photo Section */}
        <div className="flex-shrink-0 flex flex-col items-center gap-4">
          <div className="relative group">
            <Avatar className="h-32 w-32">
              {profileImage ? (
                <AvatarImage src={profileImage} alt="Profile" />
              ) : (
                <AvatarFallback className="bg-purple-100 text-purple-600 text-3xl">
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
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-3 w-3 mr-1" />
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
            
            {profileImage && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={handleRemoveImage}
                disabled={isUploading}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
        
        {/* Username Section */}
        <div className="flex-1 space-y-4 w-full max-w-md">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                placeholder="Choose a username"
                value={username}
                onChange={handleChange}
                className={`pr-10 ${isAvailable === true ? 'border-green-500' : isAvailable === false ? 'border-red-500' : ''}`}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : isAvailable === true ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : isAvailable === false ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : null}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Usernames can only contain lowercase letters, numbers, and underscores
            </p>
            {isAvailable === false && (
              <p className="text-xs text-red-500">
                This username is already taken. Please choose another one.
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">Suggested usernames</Label>
            <div className="flex flex-wrap gap-2">
              {suggestedUsernames.map((suggestedUsername, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => selectSuggestion(suggestedUsername)}
                  className="text-xs"
                >
                  {suggestedUsername}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCombinedStep;
