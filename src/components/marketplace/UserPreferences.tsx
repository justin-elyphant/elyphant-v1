
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";

interface PreferencesState {
  interests: string[];
  priceRanges: {
    min: number;
    max: number;
  };
  notifications: {
    priceDrops: boolean;
    newArrivals: boolean;
    recommendations: boolean;
  };
}

interface UserPreferencesProps {
  onPreferencesChange?: (preferences: PreferencesState) => void;
}

const UserPreferences = ({ onPreferencesChange }: UserPreferencesProps) => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [savedPreferences, setSavedPreferences] = useLocalStorage<PreferencesState>(
    "shopping_preferences", 
    {
      interests: [],
      priceRanges: { min: 0, max: 1000 },
      notifications: {
        priceDrops: true,
        newArrivals: false,
        recommendations: true
      }
    }
  );
  
  const [preferences, setPreferences] = useState<PreferencesState>(savedPreferences);
  const [newInterest, setNewInterest] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Popular interest categories for suggestions
  const suggestedInterests = [
    "Tech", "Fashion", "Home", "Beauty", "Sports", 
    "Books", "Cooking", "Gaming", "Kids", "Outdoors"
  ];
  
  // Load preferences from profile if available
  useEffect(() => {
    if (profile?.interests && profile.interests.length > 0) {
      setPreferences(prev => ({
        ...prev,
        interests: [...profile.interests]
      }));
    }
  }, [profile]);
  
  const handleInterestAdd = () => {
    if (newInterest.trim() && !preferences.interests.includes(newInterest.trim())) {
      setPreferences(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest("");
    }
  };
  
  const handleInterestRemove = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.filter(item => item !== interest)
    }));
  };
  
  const handleSuggestedInterestAdd = (interest: string) => {
    if (!preferences.interests.includes(interest)) {
      setPreferences(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }));
    }
  };
  
  const handlePriceRangeChange = (values: number[]) => {
    setPreferences(prev => ({
      ...prev,
      priceRanges: {
        min: values[0],
        max: values[1]
      }
    }));
  };
  
  const handleNotificationChange = (key: keyof PreferencesState['notifications'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };
  
  const savePreferences = async () => {
    setSaving(true);
    try {
      // Save to local storage
      setSavedPreferences(preferences);
      
      // If user is logged in, update profile
      if (user) {
        await updateProfile({
          interests: preferences.interests,
          // We could add more profile fields here
        });
      }
      
      // Notify parent component if callback provided
      if (onPreferencesChange) {
        onPreferencesChange(preferences);
      }
      
      toast.success("Preferences saved successfully");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Shopping Preferences</CardTitle>
        <CardDescription>
          Customize your shopping experience and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Interests section */}
        <div>
          <h3 className="text-sm font-medium mb-2">My Interests</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {preferences.interests.map((interest) => (
              <Badge key={interest} variant="secondary" className="px-2 py-1 gap-1">
                {interest}
                <button 
                  onClick={() => handleInterestRemove(interest)}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {preferences.interests.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No interests added yet</p>
            )}
          </div>
          
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="Add new interest"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleInterestAdd())}
            />
            <Button onClick={handleInterestAdd} size="sm">Add</Button>
          </div>
          
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-2">Suggested interests:</p>
            <div className="flex flex-wrap gap-1">
              {suggestedInterests
                .filter(interest => !preferences.interests.includes(interest))
                .map((interest) => (
                  <Badge 
                    key={interest}
                    variant="outline" 
                    className="cursor-pointer hover:bg-secondary"
                    onClick={() => handleSuggestedInterestAdd(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
        
        {/* Price range preferences */}
        <div>
          <h3 className="text-sm font-medium mb-2">Preferred Price Range</h3>
          <div className="px-3">
            <Slider 
              defaultValue={[preferences.priceRanges.min, preferences.priceRanges.max]} 
              max={1000}
              step={10}
              onValueChange={handlePriceRangeChange}
              className="my-6"
            />
            <div className="flex justify-between text-sm">
              <div>${preferences.priceRanges.min}</div>
              <div>${preferences.priceRanges.max}</div>
            </div>
          </div>
        </div>
        
        {/* Notification preferences */}
        <div>
          <h3 className="text-sm font-medium mb-2">Notification Preferences</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="price-drops" 
                checked={preferences.notifications.priceDrops}
                onCheckedChange={(checked) => 
                  handleNotificationChange('priceDrops', checked as boolean)
                }
              />
              <label htmlFor="price-drops" className="text-sm">
                Price drop alerts
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="new-arrivals" 
                checked={preferences.notifications.newArrivals}
                onCheckedChange={(checked) => 
                  handleNotificationChange('newArrivals', checked as boolean)
                }
              />
              <label htmlFor="new-arrivals" className="text-sm">
                New arrivals in my interests
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="recommendations" 
                checked={preferences.notifications.recommendations}
                onCheckedChange={(checked) => 
                  handleNotificationChange('recommendations', checked as boolean)
                }
              />
              <label htmlFor="recommendations" className="text-sm">
                Weekly recommendations
              </label>
            </div>
          </div>
        </div>
        
        <Button 
          className="w-full" 
          onClick={savePreferences}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UserPreferences;
