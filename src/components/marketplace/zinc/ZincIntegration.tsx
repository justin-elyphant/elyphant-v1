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
import { hasValidZincToken } from "./zincCore";

const ZincIntegration = () => {
  const { 
    isConnected,
    isLoading,
    apiKey,
    setApiKey,
    enableAutoFulfillment,
    setEnableAutoFulfillment,
    handleConnect,
    handleDisconnect,
    lastSync,
    error
  } = useZincIntegration();

  const formatLastSyncTime = (timestamp: number | null) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {!isConnected ? (
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
            onClick={handleConnect}
            disabled={isLoading || !apiKey || apiKey.length < 10}
          >
            {isLoading ? "Connecting..." : "Connect to Zinc API"}
          </Button>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Connected to Zinc API</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                Last synced: {formatLastSyncTime(lastSync)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          </div>

          <Tabs defaultValue="products">
            <TabsList>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="products">
              <ZincProductsTab />
            </TabsContent>
            
            <TabsContent value="settings">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-fulfillment-toggle"
                      checked={enableAutoFulfillment}
                      onCheckedChange={setEnableAutoFulfillment}
                    />
                    <Label htmlFor="auto-fulfillment-toggle">
                      Enable auto-fulfillment
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    When enabled, orders will be automatically fulfilled through Zinc
                    without requiring manual approval.
                  </p>
                  
                  <div className="mt-4">
                    <Label htmlFor="current-api-key">Current API Key</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        id="current-api-key" 
                        type="password" 
                        value={apiKey} 
                        readOnly 
                        className="max-w-md bg-muted" 
                      />
                      <Button variant="outline" size="sm" onClick={() => {
                        const newApiKey = prompt("Enter a new API key (at least 10 characters):");
                        if (newApiKey && newApiKey.length >= 10) {
                          setApiKey(newApiKey);
                          handleConnect();
                        }
                      }}>
                        Change
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default ZincIntegration;
