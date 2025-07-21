
import React, { useRef } from "react";
import { Camera, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ProfileBubbleProps {
  imageUrl?: string | null;
  userName?: string;
  onImageSelect?: (file: File) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ProfileBubble: React.FC<ProfileBubbleProps> = ({
  imageUrl,
  userName = "",
  onImageSelect,
  size = "lg",
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  const handleClick = () => {
    console.log("Profile bubble clicked", { onImageSelect: !!onImageSelect });
    if (onImageSelect) {
      console.log("Triggering file input click");
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input changed", event.target.files);
    const file = event.target.files?.[0];
    if (file && onImageSelect) {
      console.log("Selected file:", file.name);
      onImageSelect(file);
    }
  };

  // Get initials from name
  const initials = userName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Debug: Log the component state on render
  console.log("ProfileBubble render:", { 
    hasOnImageSelect: !!onImageSelect, 
    imageUrl, 
    userName, 
    size 
  });

  return (
    <div className="relative group">
      <Avatar 
        className={cn(
          sizeClasses[size], 
          "cursor-pointer transition-all duration-200 hover:shadow-lg",
          onImageSelect && "hover:opacity-80",
          className
        )}
        onClick={handleClick}
      >
        <AvatarImage src={imageUrl || undefined} alt={userName} />
        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold text-lg">
          {initials || <User className={iconSizes[size]} />}
        </AvatarFallback>
      </Avatar>
      
      {onImageSelect && (
        <>
          {/* Overlay with camera icon on hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <Camera className={cn(iconSizes[size], "text-white")} />
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
            multiple={false}
          />
        </>
      )}
    </div>
  );
};

export default ProfileBubble;
