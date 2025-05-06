
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ZincIntegration from "@/components/marketplace/zinc/ZincIntegration";
import PricingControlsCard from "./pricing/PricingControlsCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { hasValidZincToken } from "@/components/marketplace/zinc/zincCore";
import { AlertCircle, HelpCircle, Info, ExternalLink, CornerDownRight } from "lucide-react";
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
                      <strong>Zinc API Token Format:</strong> Enter just the token provided by Zinc 
                      (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded-sm">5B394AAF6CD03728E9E33DDF</code>). 
                      Do not include a colon or any other characters.
                    </span>
                  </p>
                </div>
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
                  <p className="text-red-700 flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Important Browser Limitation:</strong> Browser security (CORS) prevents direct browser-to-API calls. 
                      Even with a valid API token, you may see "Failed to fetch" errors in the console.
                    </span>
                  </p>
                  <p className="text-red-700 mt-2 ml-6 flex items-start">
                    <CornerDownRight className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      To use the live API in a production environment, you'll need to create a server-side proxy that 
                      forwards requests to the Zinc API. This app will fall back to mock data when direct API calls fail.
                    </span>
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {hasToken && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-800" />
              <AlertTitle className="text-green-800">API Token Saved</AlertTitle>
              <AlertDescription className="text-green-700">
                <p>Your Zinc API token is saved. Product searches will attempt to use the live API.</p>
                <p className="mt-2">
                  <span className="font-medium">Try these searches: </span>
                  "Nike Shoes", "Headphones", "Padres Hat", or other products.
                </p>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <p className="text-blue-700 flex items-start">
                    <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>API Authentication:</strong> Using Basic Authentication with your provided API token.
                      Format: <code className="bg-slate-100 px-1 py-0.5 rounded-sm">Authorization: Basic {btoa("5B394AAF6CD03728E9E33DDF:")}</code>
                    </span>
                  </p>
                </div>
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
                  <p className="text-red-700 flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Browser Security Warning:</strong> Even with a valid token, browser security (CORS) may still
                      prevent direct API calls. If this happens, the system will fall back to mock data.
                    </span>
                  </p>
                  <p className="text-red-700 mt-2 ml-6 flex items-start">
                    <CornerDownRight className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      For production use, implement a server-side proxy that forwards requests to Zinc's API 
                      and returns responses with proper CORS headers.
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
