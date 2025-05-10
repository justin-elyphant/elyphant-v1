
import React from "react";
import { Globe, Lock, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PrivacyToggleProps {
  isPublic: boolean;
  onToggle: (isPublic: boolean) => void;
  disabled?: boolean;
}

const PrivacyToggle = ({ isPublic, onToggle, disabled = false }: PrivacyToggleProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h3 className="text-sm font-medium">Wishlist Privacy</h3>
        <p className="text-xs text-muted-foreground">
          Control who can see and access this wishlist
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div 
          className={`relative flex flex-col items-center p-3 rounded-lg border-2 ${
            !isPublic 
              ? "border-primary bg-primary/5" 
              : "border-gray-200 hover:border-gray-300 bg-white"
          } cursor-pointer transition-all`}
          onClick={() => !disabled && onToggle(false)}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
            !isPublic ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
          }`}>
            <Lock className="h-5 w-5" />
          </div>
          <span className={`text-sm font-medium ${!isPublic ? "text-primary" : "text-gray-700"}`}>
            Private
          </span>
          <span className="text-xs text-muted-foreground mt-1 text-center">
            Only you can see this wishlist
          </span>
          {!isPublic && (
            <div className="absolute top-2 right-2 h-3 w-3 bg-primary rounded-full"></div>
          )}
        </div>

        <div 
          className={`relative flex flex-col items-center p-3 rounded-lg border-2 ${
            isPublic 
              ? "border-primary bg-primary/5" 
              : "border-gray-200 hover:border-gray-300 bg-white"
          } cursor-pointer transition-all`}
          onClick={() => !disabled && onToggle(true)}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
            isPublic ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
          }`}>
            <Globe className="h-5 w-5" />
          </div>
          <span className={`text-sm font-medium ${isPublic ? "text-primary" : "text-gray-700"}`}>
            Public
          </span>
          <span className="text-xs text-muted-foreground mt-1 text-center">
            Anyone with the link can view
          </span>
          {isPublic && (
            <div className="absolute top-2 right-2 h-3 w-3 bg-primary rounded-full"></div>
          )}
        </div>
      </div>

      <div className="flex items-start pt-2">
        <div className="flex items-center space-x-2">
          <Switch 
            checked={isPublic} 
            onCheckedChange={onToggle}
            disabled={disabled}
            id="wishlist-privacy-toggle"
          />
          <Label htmlFor="wishlist-privacy-toggle" className="text-sm cursor-pointer">
            {isPublic ? "Public wishlist" : "Private wishlist"}
          </Label>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground ml-2 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-xs">
                {isPublic 
                  ? "Public wishlists can be viewed by anyone with the link. Items and details will be visible." 
                  : "Private wishlists are only visible to you. Make it public to share with others."}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default PrivacyToggle;
