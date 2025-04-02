
import { useState } from "react";

export const useSearchFilter = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  return {
    searchTerm,
    setSearchTerm
  };
};
