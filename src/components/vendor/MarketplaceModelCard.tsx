
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export const MarketplaceModelCard = () => {
  return (
    <Card className="bg-muted/30 border-muted">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">Our Marketplace Model</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Elyphant handles all shopper interactions, payments, and fulfillment coordination:
        </p>
        <ul className="text-sm text-muted-foreground space-y-2 mb-3">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>We import your products and display them on our marketplace</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Your first 10 product listings are free, with a credit system for additional listings</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>We handle all shopper payments through our integrated checkout</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>You receive orders directly and fulfill them to the shopper</span>
          </li>
        </ul>
        
        <Collapsible className="w-full">
          <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-left">
            <span>Payment Details</span>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="text-sm text-muted-foreground pt-2">
            <p>We process the full payment from shoppers. Your product revenue is transferred to you within 3-5 business days of successful delivery.</p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
