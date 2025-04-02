
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ConnectShopifyFormProps {
  onConnect: (url: string) => void;
  isLoading: boolean;
}

const ConnectShopifyForm = ({ onConnect, isLoading }: ConnectShopifyFormProps) => {
  const [shopifyUrl, setShopifyUrl] = useState("");

  const handleSubmit = () => {
    onConnect(shopifyUrl);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Connect your Shopify store to import products. We'll handle all customer interactions and payments within the Elyphant platform.
      </p>
      <div className="flex space-x-2">
        <Input
          placeholder="yourstorename.myshopify.com"
          value={shopifyUrl}
          onChange={(e) => setShopifyUrl(e.target.value)}
          disabled={isLoading}
        />
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Connecting..." : "Connect"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Products will be listed with a 30% markup as part of our convenience fee model. You'll receive orders directly to fulfill.
      </p>
    </div>
  );
};

export default ConnectShopifyForm;
