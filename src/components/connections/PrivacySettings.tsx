
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield, Users, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { usePrivacySettings } from "@/hooks/usePrivacySettings";
import { PrivacySettingsType } from "@/hooks/usePrivacySettings";

const PrivacySettings: React.FC = () => {
  const { 
    settings, 
    updateSetting,
    isOpen,
    setIsOpen,
    saveSettings
  } = usePrivacySettings();

  return (
    <>
      <Separator className="my-8" />
      
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-muted-foreground" />
            <h3 className="text-lg font-medium">Privacy Settings</h3>
          </div>
          <Button 
            onClick={() => setIsOpen(!isOpen)} 
            variant="outline"
          >
            {isOpen ? "Hide Settings" : "Show Settings"}
          </Button>
        </div>
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent className="space-y-6 mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Allow friend requests</p>
                  <p className="text-sm text-muted-foreground">Let others connect with you</p>
                </div>
                <Switch 
                  checked={settings.allowFriendRequests}
                  onCheckedChange={(checked) => updateSetting('allowFriendRequests', checked)}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Show mutual friends</p>
                  <p className="text-sm text-muted-foreground">Display the number of mutual friends on profiles</p>
                </div>
                <Switch 
                  checked={settings.showMutualFriends}
                  onCheckedChange={(checked) => updateSetting('showMutualFriends', checked)}
                />
              </div>
              
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Connection visibility</p>
                  <p className="text-sm text-muted-foreground">Control who can see your connections</p>
                </div>
                <div className="w-[180px]">
                  <Select 
                    value={settings.connectionVisibility}
                    onValueChange={(value) => {
                      // Cast to the specific type to avoid TypeScript error
                      const typedValue = value as PrivacySettingsType['connectionVisibility'];
                      updateSetting('connectionVisibility', typedValue);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Everyone</SelectItem>
                      <SelectItem value="friends">Friends only</SelectItem>
                      <SelectItem value="none">Only me</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Auto-Gifting Notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified about automatic gifts</p>
                </div>
                <Switch 
                  checked={settings.autoGiftingNotifications}
                  onCheckedChange={(checked) => updateSetting('autoGiftingNotifications', checked)}
                />
              </div>
              
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Friend suggestions</p>
                  <p className="text-sm text-muted-foreground">Allow us to suggest potential connections</p>
                </div>
                <div className="w-[180px]">
                  <Select 
                    value={settings.friendSuggestions}
                    onValueChange={(value) => {
                      // Cast to the specific type to avoid TypeScript error
                      const typedValue = value as PrivacySettingsType['friendSuggestions'];
                      updateSetting('friendSuggestions', typedValue);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="mutual-only">Mutual friends only</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full mt-4"
              onClick={saveSettings}
            >
              Save Privacy Settings
            </Button>
          </CollapsibleContent>
        </Collapsible>
        
        {!isOpen && (
          <p className="text-muted-foreground">
            Control who can see your connections and interact with you
          </p>
        )}
      </div>
    </>
  );
};

export default PrivacySettings;
