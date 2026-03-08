
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Code } from "lucide-react";

export const BusinessTypesSection = () => {
  return (
    <div className="mb-24">
      <h2 className="font-sans text-2xl md:text-3xl font-bold text-center mb-4 text-foreground tracking-tight">
        Two Ways to Connect
      </h2>
      <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
        Whether you're on Shopify or have your own system, we integrate with your existing workflow.
      </p>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="border-border rounded-none">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-center mb-4">
              <div className="bg-muted p-3 rounded-full mr-4">
                <ShoppingBag className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Shopify Sync</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Connect your Shopify store and we'll automatically sync your product catalog, 
              inventory, and pricing. Real-time updates via the Storefront API — no manual work required.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-foreground">✓</span> Automatic catalog sync
              </li>
              <li className="flex items-center gap-2">
                <span className="text-foreground">✓</span> Real-time inventory updates
              </li>
              <li className="flex items-center gap-2">
                <span className="text-foreground">✓</span> Zero maintenance
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border rounded-none">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-center mb-4">
              <div className="bg-muted p-3 rounded-full mr-4">
                <Code className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Direct API</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Integrate directly with our API and webhooks for full control over your product data 
              and order fulfillment. Built for teams with custom e-commerce stacks.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-foreground">✓</span> RESTful API & webhooks
              </li>
              <li className="flex items-center gap-2">
                <span className="text-foreground">✓</span> Custom fulfillment routing
              </li>
              <li className="flex items-center gap-2">
                <span className="text-foreground">✓</span> Full programmatic control
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
