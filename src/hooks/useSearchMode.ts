
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export type SearchMode = "search" | "nicole";

export const useSearchMode = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setModeState] = useState<SearchMode>("search");

  // Initialize mode from URL params
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "nicole" || urlMode === "search") {
      setModeState(urlMode);
    }
  }, [searchParams]);

  const setMode = (newMode: SearchMode) => {
    setModeState(newMode);
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (newMode === "nicole") {
      newParams.set("mode", "nicole");
    } else {
      newParams.delete("mode");
    }
    setSearchParams(newParams, { replace: true });
  };

  const isNicoleMode = mode === "nicole";

  return {
    mode,
    setMode,
    isNicoleMode
  };
};
