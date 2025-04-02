
import React, { useState } from "react";
import { Button } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";
import { toast } from "sonner";

const DirectAPIIntegration = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("sk_test_example_key_12345");
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };
  
  const regenerateKey = () => {
    setApiKey(`sk_test_${Math.random().toString(36).substring(2, 15)}`);
    toast.success("New API key generated!");
  };
  
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Use our direct API to connect your custom platform or e-commerce store.
      </p>
      
      <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
        <div className="font-mono text-xs truncate max-w-[220px]">
          {apiKey}
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => copyToClipboard(apiKey)}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={regenerateKey}
          >
            Regenerate
          </Button>
        </div>
      </div>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-md">
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium">
          API Documentation
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 pt-0 text-sm border-t">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold">Product Upload Endpoint</h4>
              <p className="text-muted-foreground mb-2">POST /api/v1/products</p>
              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                {`{
  "name": "Product Name",
  "description": "Product description",
  "price": 19.99,
  "image_url": "https://example.com/image.jpg",
  "category": "Electronics",
  "in_stock": true
}`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold">Webhook Setup</h4>
              <p className="text-muted-foreground mb-2">Configure webhooks to keep inventory in sync:</p>
              <Input 
                value="https://api.example.com/webhooks/products" 
                readOnly
                className="font-mono text-xs"
              />
            </div>
            
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs"
              onClick={() => window.open('/api-docs', '_blank')}
            >
              View full API documentation
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default DirectAPIIntegration;
