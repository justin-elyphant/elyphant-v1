
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ElyphantAmazonCredentialsManager from "@/components/admin/ElyphantAmazonCredentialsManager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Shield, ExternalLink } from "lucide-react";

const TrunklineAmazonTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Amazon Business Integration
          </CardTitle>
          <CardDescription>
            Manage Elyphant's centralized Amazon Business account credentials for order fulfillment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-800" />
            <AlertTitle className="text-blue-800">Centralized Amazon Business Account</AlertTitle>
            <AlertDescription className="text-blue-700">
              <p>These credentials are used for all customer order fulfillment through Amazon Business.</p>
              <p className="mt-2">
                <span className="font-medium">Key Features:</span>
              </p>
              <ul className="mt-2 ml-4 space-y-1 text-sm">
                <li>• Shared across all customer orders</li>
                <li>• Customers don't need their own Amazon accounts</li>
                <li>• Automatically verified on successful orders</li>
                <li>• Encrypted storage for security</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          <ElyphantAmazonCredentialsManager />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
          <CardDescription>
            Monitor the connection between Elyphant and Amazon Business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Integration Active</span>
              </div>
              <p className="text-sm text-green-700">
                Amazon Business integration is properly configured and ready for order processing.
              </p>
            </div>
            
            <div className="text-xs text-muted-foreground bg-amber-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Admin Guidelines:</p>
              <ul className="space-y-1">
                <li>• Keep credentials up-to-date to prevent order failures</li>
                <li>• Monitor verification status after credential updates</li>
                <li>• Use a dedicated Amazon Business account for best results</li>
                <li>• Contact support if verification fails repeatedly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrunklineAmazonTab;
