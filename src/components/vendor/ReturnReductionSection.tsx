
import React from "react";
import { TrendingDown, DollarSign, ShoppingCart, Target } from "lucide-react";

export const ReturnReductionSection = () => {
  return (
    <section className="py-20 mb-24 border-t border-b border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            The $850 Billion Problem We Solve Together
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Returns are crushing retail margins. Elyphant's wishlist technology helps you 
            dramatically reduce returns while increasing customer satisfaction.
          </p>
        </div>

        {/* Crisis Stats */}
        <div className="bg-muted/40 border border-border p-10 mb-16">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[hsl(0,84%,50%)] mb-2">$850B</div>
              <div className="text-foreground font-medium">Total US returns in 2025</div>
              <div className="text-sm text-muted-foreground mt-1">Source: NRF 2025</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[hsl(0,84%,50%)] mb-2">15.8%</div>
              <div className="text-foreground font-medium">Average return rate</div>
              <div className="text-sm text-muted-foreground mt-1">Nearly 1 in 6 purchases</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[hsl(0,84%,50%)] mb-2">25%+</div>
              <div className="text-foreground font-medium">Gift return rate</div>
              <div className="text-sm text-muted-foreground mt-1">Even higher during holidays</div>
            </div>
          </div>
        </div>

        {/* Solution Benefits */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <TrendingDown className="mx-auto mb-4 h-10 w-10 text-foreground" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">80% Fewer Returns</h3>
            <p className="text-muted-foreground text-sm">
              Wishlist-driven purchases ensure customers get exactly what they want.
            </p>
          </div>

          <div className="text-center">
            <DollarSign className="mx-auto mb-4 h-10 w-10 text-foreground" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">Higher Margins</h3>
            <p className="text-muted-foreground text-sm">
              Eliminate processing costs, restocking fees, and inventory write-offs.
            </p>
          </div>

          <div className="text-center">
            <ShoppingCart className="mx-auto mb-4 h-10 w-10 text-foreground" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">Confident Buyers</h3>
            <p className="text-muted-foreground text-sm">
              Gift-givers purchase knowing recipients actually want the items.
            </p>
          </div>

          <div className="text-center">
            <Target className="mx-auto mb-4 h-10 w-10 text-foreground" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">Rich Preference Data</h3>
            <p className="text-muted-foreground text-sm">
              Access wishlist and preference data to understand demand before it converts.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
