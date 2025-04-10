
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ZincIntegration from "@/components/marketplace/zinc/ZincIntegration";
import PricingControlsCard from "./pricing/PricingControlsCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { hasValidZincToken } from "@/components/marketplace/zinc/zincCore";
import { AlertCircle, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TrunklineZincTab = () => {
  const hasToken = hasValidZincToken();
  const [syncLogs, setSyncLogs] = useState<string[]>([
    "No sync logs available yet. Connect to Zinc API and perform a search or sync to generate logs."
  ]);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Amazon Integration via Zinc</CardTitle>
          <CardDescription>
            Connect to Amazon's product catalog, process orders, handle returns, and manage Elephant Credits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasToken && (
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-800" />
              <AlertTitle className="text-amber-800">API Token Required for Live Data</AlertTitle>
              <AlertDescription className="text-amber-700">
                <p>Set up your Zinc API token below to enable <strong>real product search</strong> from Amazon.</p>
                <p className="mt-2 font-medium">For testing with the real API: Enter any string with at least 10 characters.</p>
                <p className="mt-1">Example token: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">test_zinc_token_12345abcde</code></p>
              </AlertDescription>
            </Alert>
          )}
          
          {hasToken && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-800" />
              <AlertTitle className="text-green-800">API Token Connected</AlertTitle>
              <AlertDescription className="text-green-700">
                <p>Your Zinc API token is connected. The search functionality will use the real Zinc API to find products.</p>
                <p className="mt-2">
                  <span className="font-medium">Try searches: </span>
                  Search for "Nike Shoes", "Headphones", or other products to see real results from Amazon.
                </p>
              </AlertDescription>
            </Alert>
          )}
          
          <ZincIntegration />
        </CardContent>
      </Card>
      
      <PricingControlsCard />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sync Status Logs</CardTitle>
            <CardDescription>
              View recent synchronization activities and any errors encountered
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="rounded-full p-1 hover:bg-muted">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm max-w-xs">
                  Logs show recent API calls, searches, and sync operations. Use this to troubleshoot connection issues.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent className="p-4 max-h-60 overflow-y-auto border-t">
          {syncLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Sync logs will appear here once Zinc integration is connected and products are synced.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {syncLogs.map((log, index) => (
                <div key={index} className="py-1 border-b border-dashed border-muted last:border-0">
                  <span className="text-xs text-muted-foreground mr-2">
                    {new Date().toLocaleTimeString()}:
                  </span>
                  {log}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrunklineZincTab;
