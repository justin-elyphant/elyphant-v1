
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, RotateCcw, CreditCard } from "lucide-react";

export const BenefitsSection = () => {
  return (
    <div className="grid md:grid-cols-3 gap-8 mb-24">
      <Card className="border-border bg-muted/30 rounded-none">
        <CardContent className="pt-8 pb-8">
          <div className="flex items-center mb-4">
            <div className="bg-muted p-3 rounded-full mr-4">
              <Sparkles className="h-6 w-6 text-foreground" />
            </div>
            <h2 className="font-sans text-xl font-semibold text-foreground">AI-Powered Matching</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nicole AI recommends your products to the right gift-givers at the right time — 
            based on recipient wishlists, preferences, and upcoming occasions.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border bg-muted/30 rounded-none">
        <CardContent className="pt-8 pb-8">
          <div className="flex items-center mb-4">
            <div className="bg-muted p-3 rounded-full mr-4">
              <RotateCcw className="h-6 w-6 text-foreground" />
            </div>
            <h2 className="font-sans text-xl font-semibold text-foreground">Near-Zero Returns</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Wishlist-driven purchasing means recipients get exactly what they want. 
            No more guessing, no more returns eating into your margins.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border bg-muted/30 rounded-none">
        <CardContent className="pt-8 pb-8">
          <div className="flex items-center mb-4">
            <div className="bg-muted p-3 rounded-full mr-4">
              <CreditCard className="h-6 w-6 text-foreground" />
            </div>
            <h2 className="font-sans text-xl font-semibold text-foreground">Free to Start</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your first 10 product listings are completely free. Expand with affordable 
            credit-based pricing — no upfront costs, no monthly fees.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
