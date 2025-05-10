
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Gift, BadgePlus, X, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";

interface OnboardingPreferencesProps {
  onNext: () => void;
  onSkip: () => void;
}

const OnboardingPreferences: React.FC<OnboardingPreferencesProps> = ({ onNext, onSkip }) => {
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);
  
  const popularInterests = [
    "Books", "Gaming", "Fashion", "Cooking", "Technology", 
    "Sports", "Music", "Art", "Travel", "Fitness"
  ];

  const handleAddInterest = (interest: string) => {
    if (!interest.trim()) return;
    
    if (interests.includes(interest.trim())) return;
    
    setInterests([...interests, interest.trim()]);
    setNewInterest("");
  };

  const handleRemoveInterest = (index: number) => {
    setInterests(interests.filter((_, i) => i !== index));
  };

  const handleAddPopularInterest = (interest: string) => {
    if (interests.includes(interest)) return;
    setInterests([...interests, interest]);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-rose-100 p-4 rounded-full">
          <Heart className="h-8 w-8 text-rose-600" />
        </div>
      </div>
      
      <h2 className="text-xl font-bold text-center mb-2">Your Gift Preferences</h2>
      <p className="text-muted-foreground text-center mb-6">
        Help us understand your interests for better gift recommendations
      </p>
      
      <div className="space-y-6 mb-6">
        <div>
          <p className="text-sm font-medium mb-2">When's your birthday?</p>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <DatePicker date={birthday} setDate={setBirthday} />
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium mb-2">Add your interests</p>
          <div className="flex gap-2 mb-3">
            <Input 
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="e.g. Photography, Coffee, Hiking..."
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddInterest(newInterest);
                  e.preventDefault();
                }
              }}
            />
            <Button 
              onClick={() => handleAddInterest(newInterest)}
              variant="outline"
            >
              <BadgePlus className="h-4 w-4" />
            </Button>
          </div>
          
          {interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {interests.map((interest, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1 text-sm py-1.5">
                  {interest}
                  <button 
                    onClick={() => handleRemoveInterest(index)}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          
          <div>
            <p className="text-xs text-muted-foreground mb-2">Popular interests</p>
            <div className="flex flex-wrap gap-2">
              {popularInterests
                .filter(interest => !interests.includes(interest))
                .slice(0, 8)
                .map((interest, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => handleAddPopularInterest(interest)}
                  >
                    + {interest}
                  </Badge>
                ))
              }
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-3">
        <Button onClick={onSkip} variant="ghost" className="flex-1">
          Skip for Now
        </Button>
        <Button onClick={onNext} className="flex-1 bg-rose-600 hover:bg-rose-700">
          Continue
        </Button>
      </div>
    </div>
  );
};

export default OnboardingPreferences;
