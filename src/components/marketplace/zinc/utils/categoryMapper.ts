
/**
 * Maps search terms to appropriate image categories to ensure correct images
 */
export const getImageCategory = (query: string): string => {
  const lowercaseQuery = query.toLowerCase().trim();
  
  // Apple products mapping
  if (lowercaseQuery.includes('iphone')) {
    return 'iPhone';
  }
  if (lowercaseQuery.includes('macbook') || 
      lowercaseQuery.includes('mackbook') || 
      (lowercaseQuery.includes('mac') && lowercaseQuery.includes('book'))) {
    return 'MacBook';
  }
  if (lowercaseQuery.includes('ipad')) {
    return 'iPad';
  }
  if (lowercaseQuery.includes('airpods')) {
    return 'AirPods';
  }
  if (lowercaseQuery.includes('apple') && lowercaseQuery.includes('watch')) {
    return 'AppleWatch';
  }
  
  // Samsung products mapping
  if (lowercaseQuery.includes('samsung') && 
      (lowercaseQuery.includes('galaxy') || lowercaseQuery.includes('phone'))) {
    return 'SamsungPhone';
  }
  if (lowercaseQuery.includes('samsung') && lowercaseQuery.includes('tv')) {
    return 'SamsungTV';
  }
  if (lowercaseQuery.includes('samsung')) {
    return 'Samsung';
  }
  
  // Gaming consoles
  if (lowercaseQuery.includes('playstation') || 
      lowercaseQuery.includes('ps5') || 
      lowercaseQuery.includes('ps4')) {
    return 'PlayStation';
  }
  if (lowercaseQuery.includes('xbox')) {
    return 'Xbox';
  }
  if (lowercaseQuery.includes('nintendo') || lowercaseQuery.includes('switch')) {
    return 'NintendoSwitch';
  }
  
  // Audio devices
  if (lowercaseQuery.includes('headphone') || 
      lowercaseQuery.includes('earphone') || 
      lowercaseQuery.includes('earbud')) {
    return 'Headphones';
  }
  if (lowercaseQuery.includes('speaker') || 
      lowercaseQuery.includes('echo') || 
      lowercaseQuery.includes('alexa')) {
    return 'Speakers';
  }
  
  // Footwear brands mapping
  if (lowercaseQuery.includes('nike') || 
      (lowercaseQuery.includes('shoe') && lowercaseQuery.includes('nike'))) {
    return 'NikeShoes';
  }
  if (lowercaseQuery.includes('adidas') || 
      (lowercaseQuery.includes('shoe') && lowercaseQuery.includes('adidas'))) {
    return 'AdidasShoes';
  }
  if (lowercaseQuery.includes('shoes') || 
      lowercaseQuery.includes('sneakers') ||
      lowercaseQuery.includes('footwear')) {
    return 'Footwear';
  }
  
  if (lowercaseQuery.includes('xbox') || 
      lowercaseQuery.includes('playstation') || 
      lowercaseQuery.includes('gaming')) {
    return 'Gaming';
  }
  
  if (lowercaseQuery.includes('dallas') || 
      lowercaseQuery.includes('cowboys')) {
    return 'Sports';
  }
  
  // Import and use the guessCategory function from categoryUtils
  const { guessCategory } = require('./categoryUtils');
  return guessCategory(lowercaseQuery);
};
