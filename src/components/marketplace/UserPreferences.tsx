
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePreferences, PreferencesState } from "./preferences/usePreferences";
import UserInterests from "./preferences/UserInterests";
import PriceRangeSelector from "./preferences/PriceRangeSelector";
import NotificationPreferences from "./preferences/NotificationPreferences";

interface UserPreferencesProps {
  onPreferencesChange?: (preferences: PreferencesState) => void;
}

const UserPreferences = ({ onPreferencesChange }: UserPreferencesProps) => {
  const {
    preferences,
    saving,
    updateInterests,
    updatePriceRange,
    updateNotification,
    savePreferences
  } = usePreferences({ onPreferencesChange });
  
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
        <UserInterests 
          interests={preferences.interests}
          onInterestsChange={updateInterests}
        />
        
        {/* Price range preferences */}
        <PriceRangeSelector
          min={preferences.priceRanges.min}
          max={preferences.priceRanges.max}
          onChange={updatePriceRange}
        />
        
        {/* Notification preferences */}
        <NotificationPreferences 
          notifications={preferences.notifications}
          onChange={updateNotification}
        />
        
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
