import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

const VendorSettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your vendor account, shipping, and integrations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Account Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Settings className="h-10 w-10 text-muted-foreground/40 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">Settings page coming soon.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Account info, shipping config, and integrations will be available here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorSettingsPage;
