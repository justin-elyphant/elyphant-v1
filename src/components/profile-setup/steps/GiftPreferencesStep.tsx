
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Gift, Plus, X, Ticket, ShoppingBag } from "lucide-react";
import { GiftPreference } from "@/types/supabase";

interface GiftPreferencesStepProps {
  values: GiftPreference[];
  onChange: (preferences: GiftPreference[]) => void;
}

// Common interest categories with added brand categories
const suggestedCategories = [
  "Books", "Technology", "Fashion", "Home Decor", "Cooking", "Fitness",
  "Travel", "Music", "Art", "Gaming", "Beauty", "Outdoors", "Sports",
  // Brand categories
  "Apple", "Nike", "Adidas", "Samsung", "Sony", "Lego", "Nintendo", 
  "Amazon", "Sephora", "Nordstrom", "Target", "Ikea"
];

// Experiences with emoji representations
const experienceCategories = [
  { name: "Spa Day", emoji: "💆" },
  { name: "Concerts", emoji: "🎵" },
  { name: "Theater", emoji: "🎭" },
  { name: "Food Tours", emoji: "🍽️" },
  { name: "Cooking Classes", emoji: "👨‍🍳" },
  { name: "Golf", emoji: "⛳" },
  { name: "Adventure", emoji: "🧗" },
  { name: "Workshops", emoji: "🔨" },
  { name: "Wine Tasting", emoji: "🍷" },
  { name: "Experiences", emoji: "🎁" }
];

const GiftPreferencesStep: React.FC<GiftPreferencesStepProps> = ({ values, onChange }) => {
  const [newCategory, setNewCategory] = useState("");
  const [selectedImportance, setSelectedImportance] = useState<"high" | "medium" | "low">("medium");
  
  const handleAddPreference = () => {
    if (!newCategory.trim()) return;
    
    const newPreference = {
      category: newCategory.trim(),
      importance: selectedImportance
    };
    
    onChange([...values, newPreference]);
    setNewCategory("");
  };
  
  const handleRemovePreference = (index: number) => {
    const updatedPreferences = [...values];
    updatedPreferences.splice(index, 1);
    onChange(updatedPreferences);
  };
  
  const handleSelectSuggestion = (category: string) => {
    setNewCategory(category);
  };

  // Helper function to determine if a preference is an experience
  const isExperienceCategory = (category: string) => {
    return experienceCategories.some(exp => exp.name === category) || 
           category.toLowerCase().includes("experience") ||
           category.toLowerCase().includes("class") ||
           category.toLowerCase().includes("tour");
  };

  // Helper function to get emoji for experience
  const getExperienceEmoji = (category: string) => {
    const experience = experienceCategories.find(exp => exp.name === category);
    return experience ? experience.emoji : "🎁";
  };

  // Helper function to determine if a preference is a brand
  const isBrandCategory = (category: string) => {
    const brands = ["Apple", "Nike", "Adidas", "Samsung", "Sony", "Lego", "Nintendo", 
                    "Amazon", "Sephora", "Nordstrom", "Target", "Ikea"];
    return brands.includes(category);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">What gifts do you like?</h3>
        <p className="text-sm text-muted-foreground">
          Help your friends and family know what you'd appreciate receiving
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="category">Gift Category, Brand, or Interest</Label>
            <Input
              id="category"
              placeholder="e.g., Books, Nike, Spa Day, Theater Tickets"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
          </div>
          <Button type="button" size="icon" onClick={handleAddPreference}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div>
          <Label className="text-sm">Importance Level</Label>
          <RadioGroup 
            value={selectedImportance} 
            onValueChange={(val) => setSelectedImportance(val as "high" | "medium" | "low")}
            className="flex space-x-2 mt-2"
          >
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="low" id="low" />
              <Label htmlFor="low" className="text-sm font-normal">Low</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="medium" id="medium" />
              <Label htmlFor="medium" className="text-sm font-normal">Medium</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="high" id="high" />
              <Label htmlFor="high" className="text-sm font-normal">High</Label>
            </div>
          </RadioGroup>
        </div>
        
        {values.length > 0 && (
          <div className="mt-4">
            <Label className="text-sm mb-2 block">Your Gift Preferences</Label>
            <div className="flex flex-wrap gap-2">
              {values.map((pref, index) => (
                <Badge
                  key={index}
                  variant={pref.importance === "high" ? "default" : 
                         pref.importance === "medium" ? "secondary" : "outline"}
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {isExperienceCategory(pref.category) ? (
                    <span className="mr-1">{getExperienceEmoji(pref.category)}</span>
                  ) : isBrandCategory(pref.category) ? (
                    <ShoppingBag className="h-3 w-3" />
                  ) : (
                    <Gift className="h-3 w-3" />
                  )}
                  <span>{pref.category}</span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => handleRemovePreference(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6">
          <Label className="text-sm mb-2 block">Experiences</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Some people prefer experiences over physical gifts. Select any experiences you'd enjoy.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {experienceCategories.map(({ name, emoji }) => (
              <Button
                key={name}
                variant="outline"
                size="sm"
                onClick={() => handleSelectSuggestion(name)}
                className="rounded-full text-xs"
              >
                <span className="mr-1">{emoji}</span> {name}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="mt-4">
          <Label className="text-sm mb-2 block">Popular Brands</Label>
          <div className="flex flex-wrap gap-2 mb-4">
            {["Apple", "Nike", "Adidas", "Samsung", "Sony", "Lego", "Nintendo"].map((brand) => (
              <Button
                key={brand}
                variant="outline"
                size="sm"
                onClick={() => handleSelectSuggestion(brand)}
                className="rounded-full text-xs"
              >
                <ShoppingBag className="h-3 w-3 mr-1" />
                {brand}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="mt-4">
          <Label className="text-sm mb-2 block">Other Categories</Label>
          <div className="flex flex-wrap gap-2">
            {suggestedCategories
              .filter(category => 
                !experienceCategories.some(exp => exp.name === category) && 
                !["Apple", "Nike", "Adidas", "Samsung", "Sony", "Lego", "Nintendo"].includes(category)
              )
              .map((category) => (
              <Button
                key={category}
                variant="outline"
                size="sm"
                onClick={() => handleSelectSuggestion(category)}
                className="rounded-full text-xs"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftPreferencesStep;
