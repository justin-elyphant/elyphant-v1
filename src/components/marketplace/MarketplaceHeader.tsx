
import React from "react";

interface MarketplaceHeaderProps {
  title: string;
  subtitle: string;
}

const MarketplaceHeader = ({ title, subtitle }: MarketplaceHeaderProps) => {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
};

export default MarketplaceHeader;
