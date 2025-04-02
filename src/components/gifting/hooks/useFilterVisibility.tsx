
import { useState } from "react";

export const useFilterVisibility = () => {
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  return {
    filtersVisible,
    setFiltersVisible
  };
};
