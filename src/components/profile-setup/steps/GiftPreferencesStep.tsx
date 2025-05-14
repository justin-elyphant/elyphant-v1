
import React from 'react';
import { GiftPreference } from '@/types/profile';
import CategorySection from './gift-preferences/CategorySection';
import { Button } from '@/components/ui/button';

export interface GiftPreferencesStepProps {
  preferences: GiftPreference[];
  onPreferencesChange: (preferences: GiftPreference[]) => void; // Add this prop
  onNext: () => void;
  onBack: () => void;
}

const GiftPreferencesStep: React.FC<GiftPreferencesStepProps> = ({
  preferences,
  onPreferencesChange,
  onNext,
  onBack,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Gift Preferences</h2>
        <p className="text-muted-foreground">
          Help us understand what kinds of gifts you like
        </p>
      </div>
      
      <CategorySection 
        preferences={preferences} 
        onChange={onPreferencesChange} 
      />

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default GiftPreferencesStep;
