
import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const PrivacySettings: React.FC = () => {
  return (
    <>
      <Separator className="my-8" />
      
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium mb-2">Privacy Settings</h3>
        <p className="text-muted-foreground mb-4">
          Control who can see your connections and interact with you
        </p>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Allow friend requests</p>
              <p className="text-sm text-muted-foreground">Let others connect with you</p>
            </div>
            <Button variant="outline">Manage</Button>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Connection visibility</p>
              <p className="text-sm text-muted-foreground">Control who can see your connections</p>
            </div>
            <Button variant="outline">Manage</Button>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Auto-Gifting Preferences</p>
              <p className="text-sm text-muted-foreground">Set up automatic gifting for special occasions</p>
            </div>
            <Button variant="outline">Manage</Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacySettings;
