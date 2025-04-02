
import { useState } from "react";

export const usePriceFilter = () => {
  const [priceRange, setPriceRange] = useState("all");
  
  return {
    priceRange,
    setPriceRange
  };
};
