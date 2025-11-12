
import React, { useRef, useState } from "react";
import { Camera, User, Upload, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CameraCapture } from "@/components/ui/camera-capture";
import { cn } from "@/lib/utils";
import { normalizeImageUrl } from "@/utils/normalizeImageUrl";

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
  const [showCameraCapture, setShowCameraCapture] = useState(false);

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

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    // Defer opening to allow DropdownMenu to close cleanly (avoids immediate outside-click close)
    setTimeout(() => setShowCameraCapture(true), 75);
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

  const handleCameraCapture = (blob: Blob) => {
    if (!onImageSelect) return;
    
    // Convert blob to file
    const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
      type: 'image/jpeg'
    });
    
    console.log("Camera capture - calling onImageSelect with file:", file.name);
    onImageSelect(file);
    
    // Close camera modal immediately after capture
    setShowCameraCapture(false);
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
      <div className="relative">
        <Avatar className={cn(sizeClasses[size], className)}>
          <AvatarImage 
            src={normalizeImageUrl(imageUrl, { bucket: 'avatars' })} 
            alt={userName}
            onError={(e) => {
              console.warn('Failed to load avatar:', imageUrl);
              e.currentTarget.style.display = 'none';
            }}
          />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold text-lg">
            {initials || <User className={iconSizes[size]} />}
          </AvatarFallback>
        </Avatar>
        
        {onImageSelect && (
          <>
            {/* Always visible camera CTA button */}
            <div className="absolute -bottom-2 -right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-full shadow-lg border-2 border-background transition-colors">
                    <Camera className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  <DropdownMenuItem onClick={openCamera} className="cursor-pointer">
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openFileDialog} className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose from Library
                  </DropdownMenuItem>
                  {imageUrl && (
                    <DropdownMenuItem 
                      onClick={() => onImageSelect?.(new File([], ''))} 
                      className="cursor-pointer text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Photo
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Hover overlay (keeping for additional interaction) */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-white p-1 h-8 w-8 rounded-full hover:bg-white/20 transition-colors">
                    <Camera className={iconSizes[size]} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  <DropdownMenuItem onClick={openCamera} className="cursor-pointer">
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openFileDialog} className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose from Library
                  </DropdownMenuItem>
                  {imageUrl && (
                    <DropdownMenuItem 
                      onClick={() => onImageSelect?.(new File([], ''))} 
                      className="cursor-pointer text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Photo
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
      
      {onImageSelect && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
            multiple={false}
          />
          
          <CameraCapture
            isOpen={showCameraCapture}
            onClose={() => setShowCameraCapture(false)}
            onCapture={handleCameraCapture}
          />
        </>
      )}
    </div>
  );
};

export default ProfileBubble;
