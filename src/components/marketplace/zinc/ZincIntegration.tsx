
import React from "react";
import { useZincIntegration } from "./useZincIntegration";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, RefreshCcw, Info, ExternalLink, AlertTriangle } from "lucide-react";
import ZincProductsTab from "./ZincProductsTab";

const ZincIntegration = () => {
  const { 
    isLoading,
    apiKey,
    setApiKey,
    enableAutoFulfillment,
    setEnableAutoFulfillment,
    handleConnect,
    handleUpdate,
    error
  } = useZincIntegration();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-yellow-800">About Zinc API Access</h3>
              <p className="text-sm text-yellow-700 mt-1">
                This integration uses Basic Authentication to connect to the Zinc API. Enter only your
                API token in the field below (without any colon or other characters).
              </p>
              <p className="text-sm text-yellow-700 mt-2">
                Example token format: <code className="bg-yellow-100 px-1.5 py-0.5 rounded">5B394AAF6CD03728E9E33DDF</code>
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="apiKey">Zinc API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Zinc API key"
            className="max-w-md"
          />
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Enter your Zinc API key. You can obtain one from{" "}
              <a
                href="https://zinc.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center"
              >
                zinc.io <ExternalLink className="h-3 w-3 ml-0.5" />
              </a>
            </p>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground mt-1">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              For testing: Enter the token provided in your Zinc documentation (example: "5B394AAF6CD03728E9E33DDF")
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="auto-fulfillment"
            checked={enableAutoFulfillment}
            onCheckedChange={setEnableAutoFulfillment}
          />
          <Label htmlFor="auto-fulfillment">
            Enable auto-fulfillment (process orders automatically)
          </Label>
        </div>

        <Button
          className="mr-5"
          onClick={handleConnect}
          disabled={isLoading || !apiKey || apiKey.length < 10}
        >
          {isLoading ? "Connecting..." : "Test Zinc API"}
        </Button>

        <Button
          variant="destructive"
          onClick={handleUpdate}
          
        >
          {"Update Zinc API"}
        </Button>

        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
    </div>
  );
};

export default ZincIntegration;
