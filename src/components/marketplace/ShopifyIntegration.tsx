
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const ShopifyIntegration = () => {
  const [shopifyUrl, setShopifyUrl] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  
  const handleConnect = () => {
    // This would typically involve OAuth with Shopify
    if (!shopifyUrl) {
      toast.error("Please enter a valid Shopify store URL");
      return;
    }
    
    // Simulate successful connection
    toast.success("Shopify store connected successfully!");
    setIsConnected(true);
  };
  
  const handleDisconnect = () => {
    setIsConnected(false);
    setShopifyUrl("");
    toast.info("Shopify store disconnected");
  };
  
  return (
    <div>
      {!isConnected ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Connect your Shopify store to import products and sync inventory.
          </p>
          <div className="flex space-x-2">
            <Input
              placeholder="yourstorename.myshopify.com"
              value={shopifyUrl}
              onChange={(e) => setShopifyUrl(e.target.value)}
            />
            <Button onClick={handleConnect}>Connect</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Note: You'll need a Shopify Partner account to create this integration.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-500">Connected</Badge>
              <span className="font-medium">{shopifyUrl}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
          
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Products</p>
                  <p className="font-medium">245</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Sync</p>
                  <p className="font-medium">5 mins ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">Sync Products</Button>
            <Button variant="outline" size="sm">Settings</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopifyIntegration;
