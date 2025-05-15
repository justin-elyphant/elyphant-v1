import React from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SettingsCard = () => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Settings className="h-5 w-5 mr-2 text-gray-500" />
          Account Settings
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Manage your preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Update your profile, privacy settings, and notification preferences.
          </p>
          <Button className="w-full" asChild>
            <Link to="/settings">Account Settings</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsCard;
