
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Gift, Check, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import ContextualHelp from "@/components/help/ContextualHelp";

interface OnboardingPreferencesProps {
  onNext: () => void;
  onSkip: () => void;
}

// Sample categories and interests - in a real app, these would come from an API
const CATEGORIES = [
  "Electronics", "Books", "Home & Kitchen", "Fashion", 
  "Beauty", "Toys & Games", "Sports & Outdoors", "Art Supplies"
];

const OCCASIONS = [
  "Birthday", "Anniversary", "Graduation", "Holiday", 
  "Wedding", "New Job", "New Home", "Just Because"
];

const OnboardingPreferences: React.FC<OnboardingPreferencesProps> = ({ onNext, onSkip }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([50]);
  const [giftNotifications, setGiftNotifications] = useState("all");
  
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const toggleOccasion = (occasion: string) => {
    setSelectedOccasions(prev =>
      prev.includes(occasion)
        ? prev.filter(o => o !== occasion)
        : [...prev, occasion]
    );
  };

  const handleNext = () => {
    // In a real app, we would save these preferences to the user's profile
    console.log({
      selectedCategories,
      selectedOccasions,
      priceRange: priceRange[0],
      giftNotifications
    });
    onNext();
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-purple-100 p-4 rounded-full">
          <Gift className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
        </div>
      </div>
      
      <h2 className="text-xl font-bold text-center mb-2">Gift Preferences</h2>
      <p className="text-muted-foreground text-center mb-6">
        Help us personalize your gifting experience
      </p>
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center mb-3">
            <h3 className="font-medium">Categories you're interested in</h3>
            <ContextualHelp 
              id="categories-help"
              content="Select categories you're interested in receiving gifts from. This helps friends find the perfect gift for you."
              title="Gift Categories"
              side="top"
              className="ml-1"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {CATEGORIES.map(category => (
              <div
                key={category}
                className={`
                  border p-2 rounded-md cursor-pointer transition-colors text-center
                  ${selectedCategories.includes(category) 
                    ? 'bg-purple-50 border-purple-200' 
                    : 'hover:bg-gray-50'}
                `}
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center justify-center h-full">
                  <span>{category}</span>
                  {selectedCategories.includes(category) && (
                    <Check className="ml-1 h-4 w-4 text-purple-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex items-center mb-3">
            <h3 className="font-medium">Special occasions</h3>
            <ContextualHelp 
              id="occasions-help"
              content="Select occasions you'd like to receive gifts for. We'll remind your connections about these special days."
              title="Special Occasions"
              side="top"
              className="ml-1"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {OCCASIONS.map(occasion => (
              <div
                key={occasion}
                className={`
                  border p-2 rounded-md cursor-pointer transition-colors text-center
                  ${selectedOccasions.includes(occasion) 
                    ? 'bg-purple-50 border-purple-200' 
                    : 'hover:bg-gray-50'}
                `}
                onClick={() => toggleOccasion(occasion)}
              >
                <div className="flex items-center justify-center h-full">
                  <span>{occasion}</span>
                  {selectedOccasions.includes(occasion) && (
                    <Check className="ml-1 h-4 w-4 text-purple-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex items-center mb-3">
            <h3 className="font-medium">Preferred price range</h3>
            <ContextualHelp 
              id="price-help"
              content="Set your preferred gift price range to help friends find gifts within their budget."
              title="Price Range"
              side="top"
              className="ml-1"
            />
          </div>
          <div className="px-2">
            <Slider 
              defaultValue={[50]} 
              max={500} 
              step={10} 
              onValueChange={setPriceRange}
              className="mb-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>$0</span>
              <span className="font-medium text-black">${priceRange[0]}</span>
              <span>$500+</span>
            </div>
          </div>
        </div>
        
        <div>
          <div className="flex items-center mb-3">
            <h3 className="font-medium">Gift notifications</h3>
            <ContextualHelp 
              id="notifications-help"
              content="Choose how you want to be notified about gifts. You can change this later in settings."
              title="Notifications"
              side="top"
              className="ml-1"
            />
          </div>
          <RadioGroup value={giftNotifications} onValueChange={setGiftNotifications}>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all">All notifications (Email + In-app)</Label>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="app-only" id="app-only" />
              <Label htmlFor="app-only">In-app notifications only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="important" id="important" />
              <Label htmlFor="important">Important notifications only</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button onClick={onSkip} variant="ghost" className="flex-1">
          Skip for Now
        </Button>
        <Button 
          onClick={handleNext} 
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          Continue <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default OnboardingPreferences;
