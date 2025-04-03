
/**
 * Generate product title based on query, category, brand, and an index
 */
export function generateTitle(query: string, category: string, brand?: string, index?: number): string {
  // Default index to 0 if not provided
  const idx = index || 0;
  
  // Standard title patterns
  const baseTitle = brand ? `${brand} ` : '';
  
  if (category === 'iPhone' || query.toLowerCase().includes('iphone')) {
    const models = ['13', '13 Pro', '13 Pro Max', '14', '14 Plus', '14 Pro', '14 Pro Max', '15', '15 Plus', '15 Pro'];
    const colors = ['Midnight', 'Starlight', 'Blue', 'Purple', 'Yellow', 'Green', 'Black', 'Silver', 'Gold'];
    const storage = ['64GB', '128GB', '256GB', '512GB', '1TB'];
    
    const model = models[idx % models.length];
    const color = colors[Math.floor(idx / models.length) % colors.length];
    const size = storage[Math.floor(idx / (models.length * colors.length)) % storage.length];
    
    return `Apple iPhone ${model} ${size} - ${color}`;
  }
  
  if (category === 'MacBook' || 
      query.toLowerCase().includes('macbook') || 
      query.toLowerCase().includes('mackbook')) {
    const models = ['Air', 'Pro 13"', 'Pro 14"', 'Pro 16"'];
    const specs = ['M1', 'M2', 'M3', 'M2 Pro', 'M3 Pro', 'M3 Max'];
    const storage = ['256GB', '512GB', '1TB', '2TB'];
    const colors = ['Space Gray', 'Silver', 'Midnight', 'Starlight'];
    
    const model = models[idx % models.length];
    const spec = specs[Math.floor(idx / models.length) % specs.length];
    const size = storage[Math.floor(idx / (models.length * specs.length)) % storage.length];
    const color = colors[Math.floor(idx / (models.length * specs.length * storage.length)) % colors.length];
    
    return `Apple MacBook ${model} ${spec} ${size} ${color}`;
  }
  
  if (category === 'Nike' || category === 'Footwear' || query.toLowerCase().includes('nike')) {
    const models = ['Air Max', 'Air Force 1', 'React', 'Dunk', 'Jordan', 'Revolution', 'Free Run', 'Pegasus', 'ZoomX'];
    const types = ['Running', 'Basketball', 'Training', 'Lifestyle', 'Walking', 'Tennis'];
    const colors = ['Black/White', 'White/Black', 'Gray/Blue', 'Red/Black', 'Navy/White', 'Green/Yellow'];
    
    const model = models[idx % models.length];
    const type = types[Math.floor(idx / models.length) % types.length];
    const color = colors[Math.floor(idx / (models.length * types.length)) % colors.length];
    
    return `Nike ${model} ${type} Shoes - ${color}`;
  }
  
  if (category === 'Samsung' || category === 'SamsungPhone' || query.toLowerCase().includes('samsung')) {
    const models = ['Galaxy S23', 'Galaxy S23+', 'Galaxy S23 Ultra', 'Galaxy S22', 'Galaxy A53', 'Galaxy Z Flip4', 'Galaxy Z Fold4'];
    const colors = ['Phantom Black', 'Phantom White', 'Green', 'Lavender', 'Graphite', 'Burgundy'];
    const storage = ['128GB', '256GB', '512GB', '1TB'];
    
    const model = models[idx % models.length];
    const color = colors[Math.floor(idx / models.length) % colors.length];
    const size = storage[Math.floor(idx / (models.length * colors.length)) % storage.length];
    
    return `Samsung ${model} ${size} - ${color}`;
  }
  
  // Default to a generic title pattern
  const adjectives = ['Premium', 'Deluxe', 'Ultra', 'Pro', 'Advanced', 'Essential', 'Compact', 'Wireless'];
  const features = ['with Fast Charging', 'Waterproof', 'Slim Design', 'Extended Battery', 'Portable', 'Lightweight'];
  
  const adjective = adjectives[idx % adjectives.length];
  const feature = features[Math.floor(idx / adjectives.length) % features.length];
  
  return `${baseTitle}${adjective} ${query} ${feature}`;
}
