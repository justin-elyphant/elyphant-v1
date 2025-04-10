
import React from "react";
import { useZincIntegration } from "./useZincIntegration";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, RefreshCcw } from "lucide-react";
import ZincProductsTab from "./ZincProductsTab";

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
            <p className="text-sm text-muted-foreground">
              Enter your Zinc API key to connect. Don't have one? Sign up at{" "}
              <a
                href="https://zinc.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                zinc.io
              </a>
              . For testing, you can enter any string with at least 10 characters.
            </p>
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
