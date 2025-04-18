
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Gift, X, ShoppingBag } from "lucide-react";
import { GiftPreference } from "@/types/supabase";
import { popularBrands } from "./utils";

interface PreferenceListProps {
  preferences: GiftPreference[];
  onRemove: (index: number) => void;
  experienceCategories: { label: string; emoji: string }[];
}

const PreferenceList: React.FC<PreferenceListProps> = ({ 
  preferences, 
  onRemove,
  experienceCategories
}) => {
  if (preferences.length === 0) return null;

  // Helper function to determine if a preference is an experience
  const isExperienceCategory = (category: string) => {
    return experienceCategories.some(exp => exp.label === category) || 
          category.toLowerCase().includes("experience") ||
          category.toLowerCase().includes("class") ||
          category.toLowerCase().includes("tour");
  };

  // Helper function to get emoji for experience
  const getExperienceEmoji = (category: string) => {
    const experience = experienceCategories.find(exp => exp.label === category);
    return experience ? experience.emoji : "🎁";
  };

  // Helper function to determine if a preference is a brand
  const isBrandCategory = (category: string) => {
    return popularBrands.some(brand => brand.label === category);
  };

  // Helper function to get logo URL for a brand
  const getBrandLogoUrl = (category: string) => {
    const brand = popularBrands.find(brand => brand.label === category);
    return brand ? brand.logoUrl : undefined;
  };

  return (
    <div className="mt-4">
      <Label className="text-sm mb-2 block">Your Gift Preferences</Label>
      <div className="flex flex-wrap gap-2">
        {preferences.map((pref, index) => (
          <Badge
            key={index}
            variant={pref.importance === "high" ? "default" : 
                   pref.importance === "medium" ? "secondary" : "outline"}
            className="flex items-center gap-1 px-3 py-1"
          >
            {isExperienceCategory(pref.category) ? (
              <span className="mr-1">{getExperienceEmoji(pref.category)}</span>
            ) : isBrandCategory(pref.category) ? (
              <div className="h-3.5 w-auto max-w-[20px] mr-1 flex items-center">
                {getBrandLogoUrl(pref.category) ? (
                  <img 
                    src={getBrandLogoUrl(pref.category)} 
                    alt={pref.category} 
                    className="h-3.5 w-auto max-w-[20px] object-contain" 
                  />
                ) : (
                  <ShoppingBag className="h-3 w-3" />
                )}
              </div>
            ) : (
              <Gift className="h-3 w-3" />
            )}
            <span>{pref.category}</span>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="h-4 w-4 p-0 ml-1"
              onClick={() => onRemove(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default PreferenceList;
