
import { useUserSearchHistory } from "@/hooks/useUserSearchHistory";

// Legacy functions for backward compatibility
export function getRecentSearches(): string[] {
  const stored = localStorage.getItem("recent_marketplace_searches");
  return stored ? JSON.parse(stored) : [];
}

export function addRecentSearch(term: string) {
  if (!term.trim()) return;
  const recent = getRecentSearches();
  const filtered = recent.filter((s) => s !== term);
  const updated = [term, ...filtered].slice(0, 5);
  localStorage.setItem("recent_marketplace_searches", JSON.stringify(updated));
}

// Modern hook-based approach
export function useRecentSearches() {
  return useUserSearchHistory();
}
