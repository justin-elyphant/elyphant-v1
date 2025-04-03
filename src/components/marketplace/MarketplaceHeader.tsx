
import React from "react";

interface MarketplaceHeaderProps {
  title: string;
  subtitle: string;
}

const MarketplaceHeader = ({ title, subtitle }: MarketplaceHeaderProps) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
};

export default MarketplaceHeader;
