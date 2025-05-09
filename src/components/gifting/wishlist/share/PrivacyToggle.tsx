
import React from "react";
import { Globe, Lock, Info, ShieldAlert, ShieldCheck } from "lucide-react";
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center gap-2">
            Wishlist Privacy 
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  <p>Control who can see your wishlist. Public wishlists can be viewed by anyone with the link.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h3>
          <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded text-xs">
            {isPublic ? (
              <>
                <Globe className="h-3 w-3 text-green-500" />
                <span className="text-green-600 font-medium">Public</span>
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 text-gray-500" />
                <span className="text-gray-600 font-medium">Private</span>
              </>
            )}
          </div>
        </div>
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
            <ShieldCheck className="h-5 w-5" />
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

      <div className="flex flex-col pt-2 space-y-2">
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
        
        <div className={`px-3 py-2 rounded-md text-sm ${
          isPublic 
            ? "bg-green-50 text-green-800 border border-green-200" 
            : "bg-blue-50 text-blue-800 border border-blue-200"
        }`}>
          {isPublic ? (
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-xs">Anyone with the link can view this wishlist, but only you can edit it.</p>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-xs">This wishlist is private and only visible to you.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacyToggle;
