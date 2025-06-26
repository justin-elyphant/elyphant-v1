
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ZincIntegration from "@/components/marketplace/zinc/ZincIntegration";
import PricingControlsCard from "./pricing/PricingControlsCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, HelpCircle, Info, ExternalLink, CornerDownRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TrunklineZincTab = () => {
  // Since we're now relying on server-side validation, we'll check if there's an API key stored
  // This is mainly for UI display purposes - the actual validation happens server-side
  const [hasApiKey, setHasApiKey] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([
    "No sync logs available yet. Connect to Zinc API and perform a search or sync to generate logs."
  ]);

  useEffect(() => {
    // Check if there's any API key configuration (for UI display only)
    // The actual API validation happens on the server side via edge functions
    const checkApiKeyExists = async () => {
      try {
        // This is just for UI - actual validation is server-side
        setHasApiKey(true); // Assume API key exists since validation is server-side
      } catch (error) {
        console.log('API key check for UI display failed, but validation is server-side');
        setHasApiKey(false);
      }
    };
    
    checkApiKeyExists();
  }, []);

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
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-800" />
            <AlertTitle className="text-blue-800">Server-Side API Validation</AlertTitle>
            <AlertDescription className="text-blue-700">
              <p>Your Zinc API key is validated server-side via Supabase Edge Functions for security.</p>
              <p className="mt-2 font-medium">Product searches will automatically use the configured API key.</p>
              <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-md">
                <p className="text-green-700 flex items-start">
                  <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Enhanced Security:</strong> API calls are processed through secure edge functions 
                    using the <code className="bg-slate-100 px-1 py-0.5 rounded-sm">ZINC_API_KEY</code> from Supabase secrets.
                  </span>
                </p>
              </div>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-md">
                <p className="text-amber-700 flex items-start">
                  <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Try Product Search:</strong> Visit the marketplace and search for products like 
                    "Nike Shoes", "Headphones", or "Padres Hat" to test the API integration.
                  </span>
                </p>
              </div>
            </AlertDescription>
          </Alert>
          
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
