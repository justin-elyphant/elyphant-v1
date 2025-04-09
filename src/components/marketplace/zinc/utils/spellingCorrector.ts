
/**
 * Corrects common misspellings in search queries
 */
export const correctSpelling = (query: string): string => {
  return correctMisspellings(query);
};

/**
 * Corrects common misspellings in search queries
 */
export const correctMisspellings = (query: string): string => {
  // Common brand name misspellings
  const misspellings: Record<string, string> = {
    // Apple variants
    "aple": "apple",
    "appl": "apple",
    "appel": "apple",
    "apppe": "apple",
    
    // MacBook variants
    "mackbook": "macbook",
    "macbok": "macbook",
    "makbook": "macbook",
    "macbuk": "macbook",
    
    // iPhone variants
    "ifone": "iphone",
    "ipone": "iphone",
    "iphne": "iphone",
    "iphon": "iphone",
    
    // Samsung variants
    "samsng": "samsung",
    "samsun": "samsung",
    "sansung": "samsung",
    "samson": "samsung",
    
    // Nike variants
    "nkie": "nike",
    "nikey": "nike",
    "nik": "nike",
    
    // Other common brands
    "guci": "gucci",
    "adiddas": "adidas",
    "addidas": "adidas",
    "adids": "adidas",
    "amazn": "amazon",
    "mikrosoft": "microsoft",
    "microsfot": "microsoft",
    "sonny": "sony"
  };
  
  // Split query into words and check each one
  const words = query.split(' ');
  const correctedWords = words.map(word => {
    // Check if this word is a known misspelling
    return misspellings[word] || word;
  });
  
  return correctedWords.join(' ');
};
