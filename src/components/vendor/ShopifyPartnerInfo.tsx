
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ShopifyPartnerInfoProps {
  onHide: () => void;
}

const ShopifyPartnerInfo = ({ onHide }: ShopifyPartnerInfoProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Shopify Partner Testing Options</CardTitle>
        <CardDescription>
          Ways to test Shopify integration without a production store
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-medium">Option 1: Quick Simulated Store</h3>
              <p className="text-sm text-muted-foreground">
                Enter <strong>"development"</strong> in the store URL field to connect to our simulated store with test products.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Option 2: Real Development Store</h3>
              <p className="text-sm text-muted-foreground">
                Create a free development store in your Shopify Partners account for full API testing.
              </p>
              <a 
                href="https://partners.shopify.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-primary hover:underline mt-1"
              >
                Go to Shopify Partners <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Development Store Benefits:</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Free to create through Shopify Partners program</li>
              <li>Full access to Shopify APIs and testing tools</li>
              <li>Test payment gateways with test credit cards</li>
              <li>Can be converted to a paid store later if needed</li>
              <li>No time limit for development testing</li>
            </ul>
          </div>
          
          <div className="flex justify-between items-center">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onHide}
            >
              Hide Info
            </Button>
            
            <a 
              href="https://help.shopify.com/en/partners/dashboard/development-stores" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              Shopify Development Store Documentation <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopifyPartnerInfo;
