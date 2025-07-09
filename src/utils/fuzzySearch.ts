// Simple fuzzy search utility for smart suggestions
export function calculateLevenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

export function fuzzySearch(query: string, options: string[], threshold: number = 0.6): string[] {
  if (!query || query.length < 2) return [];
  
  const queryLower = query.toLowerCase();
  const results: Array<{ item: string; score: number }> = [];
  
  for (const option of options) {
    const optionLower = option.toLowerCase();
    
    // Direct substring match gets highest priority
    if (optionLower.includes(queryLower)) {
      results.push({ item: option, score: 1.0 });
      continue;
    }
    
    // Fuzzy match using Levenshtein distance
    const distance = calculateLevenshteinDistance(queryLower, optionLower);
    const maxLength = Math.max(queryLower.length, optionLower.length);
    const similarity = 1 - (distance / maxLength);
    
    if (similarity >= threshold) {
      results.push({ item: option, score: similarity });
    }
  }
  
  // Sort by score (highest first) and return items
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 5) // Limit to top 5 suggestions
    .map(result => result.item);
}

export function getSpellingSuggestion(input: string, corrections: Record<string, string>): string | null {
  const inputLower = input.toLowerCase();
  
  // Direct match
  if (corrections[inputLower]) {
    return corrections[inputLower];
  }
  
  // Fuzzy match against correction keys
  const keys = Object.keys(corrections);
  const fuzzyMatches = fuzzySearch(inputLower, keys, 0.7);
  
  if (fuzzyMatches.length > 0) {
    return corrections[fuzzyMatches[0]];
  }
  
  return null;
}