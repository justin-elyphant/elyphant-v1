import React, { useState, useEffect } from "react";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Ruler, Info } from "lucide-react";
import { toast } from "sonner";
import { UserSizes } from "@/types/user-sizes";

const MySizesSettings = () => {
  const { profile, updateProfile } = useProfile();
  const [sizes, setSizes] = useState<UserSizes>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Load existing sizes from profile.metadata.sizes (with type assertion for JSONB field)
  useEffect(() => {
    const profileMetadata = (profile as any)?.metadata?.sizes;
    if (profileMetadata) {
      setSizes(profileMetadata);
    }
  }, [profile]);
  
  const handleSizeChange = async (field: keyof UserSizes, value: string) => {
    const updatedSizes = { ...sizes, [field]: value };
    setSizes(updatedSizes);
    
    // Auto-save to database (cast for JSONB field)
    setIsSaving(true);
    try {
      const result = await updateProfile({
        metadata: {
          ...((profile as any)?.metadata || {}),
          sizes: updatedSizes
        }
      } as any);
      
      if (result.success) {
        toast.success("Size saved!", { duration: 2000 });
      }
    } catch (error) {
      toast.error("Failed to save size");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-muted-foreground" />
            <CardTitle>My Sizes</CardTitle>
          </div>
          <CardDescription>
            Help Nicole AI recommend the perfect gifts for you
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Tops Size */}
          <div className="space-y-2">
            <Label htmlFor="tops" className="text-sm font-medium">
              Tops & Shirts
            </Label>
            <Select 
              value={sizes.tops || ""} 
              onValueChange={(value) => handleSizeChange("tops", value)}
            >
              <SelectTrigger id="tops" className="h-11">
                <SelectValue placeholder="Select your size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="XS">XS - Extra Small</SelectItem>
                <SelectItem value="S">S - Small</SelectItem>
                <SelectItem value="M">M - Medium</SelectItem>
                <SelectItem value="L">L - Large</SelectItem>
                <SelectItem value="XL">XL - Extra Large</SelectItem>
                <SelectItem value="XXL">XXL - 2X Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Bottoms Size */}
          <div className="space-y-2">
            <Label htmlFor="bottoms" className="text-sm font-medium">
              Pants & Bottoms
            </Label>
            <Input
              id="bottoms"
              placeholder="e.g., 32x32 or 30"
              value={sizes.bottoms || ""}
              onChange={(e) => handleSizeChange("bottoms", e.target.value)}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Waist x Inseam (e.g., 32x32) or just waist size
            </p>
          </div>
          
          {/* Shoes Size */}
          <div className="space-y-2">
            <Label htmlFor="shoes" className="text-sm font-medium">
              Shoes
            </Label>
            <Select 
              value={sizes.shoes || ""} 
              onValueChange={(value) => handleSizeChange("shoes", value)}
            >
              <SelectTrigger id="shoes" className="h-11">
                <SelectValue placeholder="Select your size" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 18 }, (_, i) => 4 + i * 0.5).map((size) => (
                  <SelectItem key={size} value={`US ${size}`}>
                    US {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Ring Size */}
          <div className="space-y-2">
            <Label htmlFor="ring" className="text-sm font-medium">
              Ring Size
            </Label>
            <Select 
              value={sizes.ring || ""} 
              onValueChange={(value) => handleSizeChange("ring", value)}
            >
              <SelectTrigger id="ring" className="h-11">
                <SelectValue placeholder="Select your size" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 11 }, (_, i) => 4 + i).map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    Size {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Fit Preference */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Preferred Fit
            </Label>
            <RadioGroup 
              value={sizes.fit_preference || "regular"} 
              onValueChange={(value) => handleSizeChange("fit_preference", value as any)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="slim" id="slim" className="h-5 w-5" />
                <Label htmlFor="slim" className="font-normal cursor-pointer text-sm">
                  Slim - Fitted and tailored
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="regular" id="regular" className="h-5 w-5" />
                <Label htmlFor="regular" className="font-normal cursor-pointer text-sm">
                  Regular - Standard comfortable fit
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="relaxed" id="relaxed" className="h-5 w-5" />
                <Label htmlFor="relaxed" className="font-normal cursor-pointer text-sm">
                  Relaxed - Loose and comfortable
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg border border-border">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">
                How this helps
              </p>
              <p>
                Nicole AI uses your size information to filter gift recommendations and ensure AI gifts fit perfectly. Your sizes are private and only visible to you.
              </p>
            </div>
          </div>
          
          {/* Saving indicator */}
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MySizesSettings;
