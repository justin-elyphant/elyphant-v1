

## Search System Cleanup: Remove Dead Code from 10 Iterations

### What I Found

Your intuition is correct -- the search system has accumulated significant dead code from previous iterations. The current **live path** is clean and simple:

```text
AIEnhancedSearchBar (thin wrapper)
  -> NicoleDropdownProvider (context, still used by Nicole AI features)
    -> UnifiedSearchBar (the actual search UI)
      -> useSearchSuggestionsLive (edge function for suggestions)
      -> searchFriendsWithPrivacy (people search)
      -> RecentSearches (recent search history)
```

Everything else is leftover from past lives. Here is the full inventory:

### Dead Files to Delete (14 files)

**Services (4 files):**
- `src/services/search/enhancedFriendSearch.ts` -- Superseded by `privacyAwareFriendSearch`. Zero imports.
- `src/services/search/unifiedSearchService.ts` -- Old orchestrator. Zero imports.
- `src/services/search/searchDebouncer.ts` -- Custom debouncer class. Zero imports (UnifiedSearchBar uses its own setTimeout).
- `src/services/search/searchSuggestionsService.ts` -- Hardcoded mock suggestions (iPhone, Nike, etc). Zero imports.

**Components (7 files):**
- `src/components/search/SearchCapabilityRouter.tsx` -- Marked `@deprecated` in its own JSDoc. Zero imports.
- `src/components/search/UnifiedSearchSuggestions.tsx` -- Old suggestion dropdown. Zero imports.
- `src/components/search/CategoryFilterBar.tsx` -- Zero imports.
- `src/components/search/components/SearchResults.tsx` -- Old result renderer. Zero imports.
- `src/components/search/nicole/NicoleSearchDropdown.tsx` -- Never rendered anywhere (only self-references). Dead.
- `src/components/home/components/search/ResultGroups.tsx` -- Zero imports.
- `src/components/home/components/search/ProductResultItem.tsx` -- Zero imports (only used by ResultGroups which is also dead).

**Hooks (5 files):**
- `src/components/search/hooks/useSearchState.tsx` -- Zero imports.
- `src/components/search/hooks/useSearchHandlers.tsx` -- Zero imports.
- `src/hooks/useSearchMode.ts` -- Zero imports.
- `src/hooks/useResultGrouping.tsx` -- Zero imports.
- `src/hooks/useDebounceSearch.tsx` -- Zero imports.
- `src/hooks/useOptimizedSearchDebounce.tsx` -- Zero imports.

**Utilities (1 file):**
- `src/utils/searchQueryProcessing.ts` -- Only imported by `enhancedFriendSearch.ts` (which is itself dead). Entire dependency chain is unused.

**Likely dead home search directory (check remaining files):**
- `src/components/home/components/search/SearchFooter.tsx` -- Zero imports.
- `src/components/home/components/search/SearchGroup.tsx` -- Zero imports.
- `src/components/home/components/search/SearchPrompt.tsx` -- Zero imports.
- The entire `src/components/home/components/search/` directory can be deleted.

### Files to Keep (the live search system)
- `src/components/search/AIEnhancedSearchBar.tsx` -- Entry point wrapper (used by header)
- `src/components/search/unified/UnifiedSearchBar.tsx` -- The actual search bar
- `src/components/search/nicole/NicoleDropdownContext.tsx` -- Used by Nicole AI features across the app
- `src/components/search/RecentSearches.tsx` -- Used by UnifiedSearchBar
- `src/components/search/VoiceInputButton.tsx` -- Used by Connections page
- `src/components/search/results/FriendResultCard.tsx` -- Used by UnifiedSearchSuggestions (but that's dead too, so this becomes dead as well)
- `src/hooks/useSearchSuggestionsLive.ts` -- The live suggestions hook (active)
- `src/hooks/useSearchSuggestions.tsx` -- Re-export wrapper for backward compat (keep for safety)
- `src/hooks/useSpeechRecognition.tsx` -- Used by UnifiedSearchBar
- `src/hooks/useUserSearchHistory.tsx` -- Used by UnifiedSearchBar
- `src/services/search/privacyAwareFriendSearch.ts` -- Core people search (active)
- `src/services/search/connectionRequestService.ts` -- Used by Connections pages (active, not search-specific)
- `src/components/navigation/SearchIconTrigger.tsx` -- Imported by header but not rendered (imported but unused in JSX). Candidate for deletion but low risk to keep.

### What This Cleanup Achieves
- Removes ~18-20 files of dead code
- Eliminates ~1,500+ lines of unused search logic
- Makes the search system easy to understand: one bar, one suggestions hook, one people search service
- No functional changes -- everything deleted has zero active imports

### Technical Steps
1. Delete all dead files listed above
2. Verify build succeeds (no broken imports since nothing references these files)
3. Optionally remove `SearchIconTrigger` import from `ModernHeaderManager.tsx` since it is imported but never used in the JSX

