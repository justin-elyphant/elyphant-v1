
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
          Connect your Shopify store to import products. We'll handle customer interactions and payments within the platform.
        </p>
      </div>
      
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-sm">
          <span className="font-medium">Testing options:</span>
          <ul className="list-disc ml-5 mt-1">
            <li>Enter <strong>development</strong> to connect to a simulated store</li>
            <li>Enter your development store URL from Shopify Partners</li>
            <li>Enter a production store URL for a live integration</li>
          </ul>
        </AlertDescription>
      </Alert>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center">
              <label htmlFor="shopify-url" className="text-sm font-medium">Store URL</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      For testing, enter "development" or create a free development store in your Shopify Partners account
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex space-x-2">
              <Input
                id="shopify-url"
                placeholder="yourstore.myshopify.com or development"
                value={shopifyUrl}
                onChange={(e) => setShopifyUrl(e.target.value)}
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Connecting..." : "Connect"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Examples: yourstore.myshopify.com, development, your-custom-domain.com
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
