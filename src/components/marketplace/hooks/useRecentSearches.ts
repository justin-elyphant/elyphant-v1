
import { useCallback } from "react";

const RECENT_SEARCHES_KEY = "recent_marketplace_searches";
const MAX_RECENT = 5;

export function getRecentSearches(): string[] {
  const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addRecentSearch(term: string) {
  if (!term.trim()) return;
  const recent = getRecentSearches();
  // Remove duplicates and add to front
  const filtered = recent.filter((s) => s !== term);
  const updated = [term, ...filtered].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

export function useRecentSearches() {
  // Returns most recent set, and a function to add a searched term
  const get = useCallback(getRecentSearches, []);
  const add = useCallback(addRecentSearch, []);
  return { getRecentSearches: get, addRecentSearch: add };
}

