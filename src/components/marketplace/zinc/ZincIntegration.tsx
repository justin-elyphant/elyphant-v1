
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useZincIntegration } from "./useZincIntegration";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, RefreshCw, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ZincProductsTab from "./ZincProductsTab";
import ZincOrdersTab from "./ZincOrdersTab";
import ZincReturnsTab from "./ZincReturnsTab";
import ZincCreditsTab from "./ZincCreditsTab";

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
    syncProducts,
    lastSync,
    error
  } = useZincIntegration();

  return (
    <div className="space-y-4">
      {!isConnected ? (
        <div className="space-y-4">
          <div className="grid gap-2">
            <label htmlFor="zinc-api-key" className="text-sm font-medium">Zinc API Key</label>
            <Input
              id="zinc-api-key"
              type="password"
              placeholder="Enter your Zinc API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your Zinc API key is used to access Amazon&apos;s product catalog and process orders. 
              Zinc charges $1 per transaction.
            </p>
          </div>
          <Button 
            onClick={handleConnect} 
            disabled={isLoading || !apiKey}
            className="w-full"
          >
            {isLoading ? "Connecting..." : "Connect to Zinc"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" /> Connected
              </Badge>
              {lastSync && (
                <span className="text-xs text-muted-foreground">
                  Last synced: {new Date(lastSync).toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={syncProducts} 
                disabled={isLoading}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync Products
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {}} 
                className="px-2"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium">Auto-Fulfillment</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically fulfill orders through Zinc
                  </p>
                </div>
                <Switch 
                  checked={enableAutoFulfillment} 
                  onCheckedChange={setEnableAutoFulfillment}
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                When enabled, orders will be automatically fulfilled through Zinc. 
                You will be charged $1 per transaction by Zinc in addition to the product cost.
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="products">
            <TabsList className="w-full">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="returns">Returns</TabsTrigger>
              <TabsTrigger value="credits">Elephant Credits</TabsTrigger>
            </TabsList>
            
            <TabsContent value="products">
              <ZincProductsTab />
            </TabsContent>
            
            <TabsContent value="orders">
              <ZincOrdersTab />
            </TabsContent>
            
            <TabsContent value="returns">
              <ZincReturnsTab />
            </TabsContent>
            
            <TabsContent value="credits">
              <ZincCreditsTab />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDisconnect}
            >
              Disconnect Zinc
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZincIntegration;
