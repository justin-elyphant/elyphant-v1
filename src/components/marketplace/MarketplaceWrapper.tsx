import React, { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useProducts } from "@/contexts/ProductContext";
import { Product } from "@/types/product";
import MarketplaceContent from "./MarketplaceContent";

const MarketplaceWrapper: React.FC = () => {
  return (
    <div className="marketplace-container">
      <MarketplaceContent />
    </div>
  );
};

export default MarketplaceWrapper;
