
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotificationSettings from "@/components/settings/NotificationSettings"; 
import NotificationPreferences from "@/components/marketplace/preferences/NotificationPreferences";
import { usePreferences } from "@/components/marketplace/preferences/usePreferences";
import PriceRangeSelector from "@/components/marketplace/preferences/PriceRangeSelector";
import { Button } from "@/components/ui/button";

const UserPreferences = () => {
  const {
    preferences,
    saving,
    updateInterests,
    updatePriceRange,
    updateNotification,
    savePreferences
  } = usePreferences();

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="notifications">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="shopping">Shopping</TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>
          
          <TabsContent value="shopping">
            <div className="space-y-6">
              <PriceRangeSelector 
                min={preferences.priceRanges.min}
                max={preferences.priceRanges.max}
                onChange={(range) => updatePriceRange(range)}
              />
              
              <NotificationPreferences 
                notifications={preferences.notifications}
                onChange={updateNotification}
              />
              
              <Button 
                onClick={savePreferences}
                disabled={saving}
                className="w-full mt-4"
              >
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserPreferences;
