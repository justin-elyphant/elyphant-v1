
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export const useSearchFilter = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();
  
  // Initialize search term from URL on mount
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, []);
  
  return {
    searchTerm,
    setSearchTerm
  };
};
