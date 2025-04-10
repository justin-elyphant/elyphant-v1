
import React from "react";
import { useZincIntegration } from "./useZincIntegration";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, RefreshCcw, Info } from "lucide-react";
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
                Enter your Zinc API key to connect. Don't have one? Sign up at{" "}
                <a
                  href="https://zinc.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  zinc.io
                </a>
                . <span className="font-medium">For testing, you can enter any string with at least 10 characters.</span>
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
            {isLoading ? "Connecting..." : "Connect to Zinc"}
          </Button>

          {error && <p className="text-destructive text-sm">{error}</p>}
          
          {!hasValidZincToken() && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-amber-800 font-medium">Testing with Mock Data</p>
              <p className="text-amber-700 text-sm mt-1">
                Without a valid API token, all product searches will use mock data. Enter any 10+ character string above and click "Connect" to test with real data.
              </p>
            </div>
          )}
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
                        const newApiKey = prompt("Enter a new API key:");
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
