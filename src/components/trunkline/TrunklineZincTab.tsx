
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ZincIntegration from "@/components/marketplace/zinc/ZincIntegration";
import PricingControlsCard from "./pricing/PricingControlsCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { hasValidZincToken } from "@/components/marketplace/zinc/zincCore";
import { AlertCircle, HelpCircle, Info, ExternalLink } from "lucide-react";
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
              <AlertTitle className="text-amber-800">API Key Required</AlertTitle>
              <AlertDescription className="text-amber-700">
                <p>You need to enter your Zinc API key to connect to Amazon's product catalog.</p>
                <p className="mt-2 font-medium">Enter your Zinc API token below to establish a connection.</p>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <p className="text-blue-700 flex items-start">
                    <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Example API Key:</strong> Just enter the token provided by Zinc (e.g. "5B394AAF6CD03728E9E33DDF").
                      Do not include a colon or any other characters.
                    </span>
                  </p>
                </div>
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
                  <p className="text-red-700 flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Important Limitation:</strong> Browser security (CORS) may prevent direct browser-to-API calls. 
                      If you get CORS errors, the application will fall back to using mock data.
                    </span>
                  </p>
                  <p className="text-red-700 mt-2 ml-6">
                    To use the live API in your own implementation, you may need to create a server-side proxy endpoint
                    that forwards requests to the Zinc API and returns the responses with proper CORS headers.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {hasToken && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-800" />
              <AlertTitle className="text-green-800">API Connection Active</AlertTitle>
              <AlertDescription className="text-green-700">
                <p>Your Zinc API token is connected. Product searches will attempt to use the live API.</p>
                <p className="mt-2">
                  <span className="font-medium">Try searches: </span>
                  Search for "Nike Shoes", "Headphones", "Padres Hat", or other products to see results.
                </p>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <p className="text-blue-700 flex items-start">
                    <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>API Authentication:</strong> Using Basic Authentication with your provided API token.
                      If you experience issues, verify your token is correct and that you're not including any extra characters.
                    </span>
                  </p>
                </div>
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
                  <p className="text-red-700 flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Important Note:</strong> If API calls fail due to CORS restrictions, 
                      the system will automatically fall back to mock data.
                    </span>
                  </p>
                </div>
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
