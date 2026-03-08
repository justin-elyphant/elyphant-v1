
import React from "react";

export const HowItWorksSection = () => {
  return (
    <div className="mb-24">
      <h2 className="font-sans text-2xl md:text-3xl font-bold text-center mb-12 text-foreground tracking-tight">
        How It Works
      </h2>
      <div className="grid md:grid-cols-3 gap-12">
        <div className="flex flex-col items-center text-center">
          <div className="bg-foreground rounded-full w-16 h-16 flex items-center justify-center mb-5">
            <span className="text-2xl font-bold text-background">1</span>
          </div>
          <h3 className="font-sans text-lg font-semibold mb-2 text-foreground">Apply Online</h3>
          <p className="text-sm text-muted-foreground">
            Submit your application through our vendor portal — it takes less than 5 minutes.
          </p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="bg-foreground rounded-full w-16 h-16 flex items-center justify-center mb-5">
            <span className="text-2xl font-bold text-background">2</span>
          </div>
          <h3 className="font-sans text-lg font-semibold mb-2 text-foreground">Get Approved</h3>
          <p className="text-sm text-muted-foreground">
            Our team reviews every application within 72 hours and gets you set up fast.
          </p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="bg-foreground rounded-full w-16 h-16 flex items-center justify-center mb-5">
            <span className="text-2xl font-bold text-background">3</span>
          </div>
          <h3 className="font-sans text-lg font-semibold mb-2 text-foreground">Start Selling</h3>
          <p className="text-sm text-muted-foreground">
            Upload your products and let Nicole AI match them to the right gift-givers automatically.
          </p>
        </div>
      </div>
    </div>
  );
};
