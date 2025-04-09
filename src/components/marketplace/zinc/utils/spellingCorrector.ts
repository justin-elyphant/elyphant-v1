
/**
 * Correct common misspellings in search queries
 */
export const correctMisspellings = (query: string): string => {
  const corrections: Record<string, string> = {
    // Brand corrections
    'nike': 'Nike',
    'addidas': 'Adidas',
    'adiddas': 'Adidas',
    'appl': 'Apple',
    'aple': 'Apple',
    'padres': 'Padres',
    'padrés': 'Padres',
    'sony': 'Sony',
    'samung': 'Samsung',
    'samsng': 'Samsung',
    'microsft': 'Microsoft',
    
    // Category corrections
    'labtop': 'laptop',
    'latop': 'laptop',
    'headfone': 'headphone',
    'headphne': 'headphone',
    'sneeker': 'sneaker',
    'sneaker': 'sneaker',
    'plantr': 'planter',
    'plnter': 'planter',
    'gardn': 'garden',
    'outdor': 'outdoor',
    
    // Product corrections
    'airpod': 'AirPods',
    'ear pod': 'EarPods',
    'macbok': 'MacBook',
    'mackbook': 'MacBook',
  };
  
  let correctedQuery = query;
  
  // Split the query into words
  const words = query.toLowerCase().split(/\s+/);
  
  // Check each word for corrections
  const correctedWords = words.map(word => {
    return corrections[word] || word;
  });
  
  // Join the words back together
  correctedQuery = correctedWords.join(' ');
  
  return correctedQuery;
};
