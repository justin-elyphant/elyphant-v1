
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

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log("ProfileBubble clicked - Debug info:", { 
      onImageSelect: !!onImageSelect,
      fileInputRef: !!fileInputRef.current,
      eventType: event.type
    });
    
    if (onImageSelect && fileInputRef.current) {
      console.log("Triggering file input click");
      fileInputRef.current.click();
    } else {
      console.log("Cannot trigger file input:", { 
        hasOnImageSelect: !!onImageSelect, 
        hasFileInput: !!fileInputRef.current 
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input changed - Debug info:", {
      filesCount: event.target.files?.length || 0,
      firstFileName: event.target.files?.[0]?.name,
      firstFileSize: event.target.files?.[0]?.size,
      firstFileType: event.target.files?.[0]?.type
    });
    
    const file = event.target.files?.[0];
    if (file && onImageSelect) {
      console.log("Calling onImageSelect with file:", file.name);
      onImageSelect(file);
      // Clear the input value so the same file can be selected again if needed
      event.target.value = '';
    } else {
      console.log("Cannot process file:", { hasFile: !!file, hasCallback: !!onImageSelect });
    }
  };

  // Get initials from name
  const initials = userName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative group">
      <div 
        className={cn(
          "relative cursor-pointer",
          onImageSelect && "hover:opacity-80 transition-opacity duration-200"
        )}
        onClick={handleClick}
      >
        <Avatar className={cn(sizeClasses[size], className)}>
          <AvatarImage src={imageUrl || undefined} alt={userName} />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold text-lg">
            {initials || <User className={iconSizes[size]} />}
          </AvatarFallback>
        </Avatar>
        
        {onImageSelect && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <Camera className={cn(iconSizes[size], "text-white")} />
          </div>
        )}
      </div>
      
      {onImageSelect && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="hidden"
          multiple={false}
        />
      )}
    </div>
  );
};

export default ProfileBubble;
