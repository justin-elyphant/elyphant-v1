
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ConnectShopifyFormProps {
  onConnect: (url: string) => void;
  isLoading: boolean;
}

const ConnectShopifyForm = ({ onConnect, isLoading }: ConnectShopifyFormProps) => {
  const [shopifyUrl, setShopifyUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(shopifyUrl);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Connect Your Shopify Store</h3>
        <p className="text-sm text-muted-foreground">
          Connect your Shopify store to import products. We'll handle all customer interactions and payments within the Elyphant platform.
        </p>
      </div>
      
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-sm">
          For this demo, you can enter any valid-looking store URL. In production, you'd need to go through Shopify's OAuth flow.
        </AlertDescription>
      </Alert>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="shopify-url" className="text-sm font-medium">Store URL</label>
            <div className="flex space-x-2">
              <Input
                id="shopify-url"
                placeholder="yourstore.myshopify.com"
                value={shopifyUrl}
                onChange={(e) => setShopifyUrl(e.target.value)}
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Connecting..." : "Connect"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Example: yourstore.myshopify.com or your-custom-domain.com
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Products will be listed with a 30% markup as part of our convenience fee model. You'll receive orders directly to fulfill.
          </p>
        </div>
      </form>
    </div>
  );
};

export default ConnectShopifyForm;
