
/**
 * Get a product-specific fallback image based on name and category
 */
export const getProductFallbackImage = (name: string, category?: string): string => {
  const productName = name.toLowerCase();
  const productCategory = category?.toLowerCase() || '';
  
  // Apple products
  if (productName.includes('iphone')) {
    return 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=500&h=500&fit=crop'; // iPhone
  }
  if (productName.includes('macbook') || productName.includes('mac book')) {
    return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop'; // MacBook
  }
  if (productName.includes('airpods')) {
    return 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=500&h=500&fit=crop'; // AirPods
  }
  if (productName.includes('ipad')) {
    return 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop'; // iPad
  }
  if (productName.includes('apple watch') || productName.includes('watch') && productName.includes('apple')) {
    return 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop'; // Apple Watch
  }
  if (productName.includes('apple tv')) {
    return 'https://images.unsplash.com/photo-1528928441742-b4ccac1bb04c?w=500&h=500&fit=crop'; // Apple TV
  }
  if (productName.includes('apple pencil') || productName.includes('pencil') && productName.includes('apple')) {
    return 'https://images.unsplash.com/photo-1595411425732-e69c1aba47b3?w=500&h=500&fit=crop'; // Apple Pencil
  }
  
  // Samsung products
  if (productName.includes('samsung') && (productName.includes('galaxy') || productName.includes('phone'))) {
    return 'https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=500&h=500&fit=crop'; // Samsung Galaxy
  }
  if (productName.includes('samsung') && productName.includes('tv')) {
    return 'https://images.unsplash.com/photo-1601944179066-29786cb9d32a?w=500&h=500&fit=crop'; // Samsung TV
  }
  
  // Gaming/Console products
  if (productName.includes('playstation') || productName.includes('ps5') || productName.includes('ps4')) {
    return 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&h=500&fit=crop'; // PlayStation
  }
  if (productName.includes('xbox')) {
    return 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=500&h=500&fit=crop'; // Xbox
  }
  if (productName.includes('nintendo') || productName.includes('switch')) {
    return 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500&h=500&fit=crop'; // Nintendo Switch
  }
  
  // Headphones and Speakers
  if (productName.includes('headphone') || productName.includes('earphone') || productName.includes('earbud')) {
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop'; // Headphones
  }
  if (productName.includes('speaker') || productName.includes('echo') || productName.includes('alexa')) {
    return 'https://images.unsplash.com/photo-1558537348-c0f8e733989d?w=500&h=500&fit=crop'; // Speaker
  }
  
  // Footwear
  if (productName.includes('nike') || (productName.includes('shoe') && productName.includes('nike'))) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop'; // Nike shoes
  }
  if (productName.includes('adidas') || (productName.includes('shoe') && productName.includes('adidas'))) {
    return 'https://images.unsplash.com/photo-1518894950606-4642a0c087f9?w=500&h=500&fit=crop'; // Adidas shoes
  }
  
  // Category fallbacks (if no specific product match)
  if (productCategory.includes('electronics')) {
    return 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&h=500&fit=crop'; // Electronics
  }
  if (productCategory.includes('footwear') || productCategory.includes('shoes')) {
    return 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=500&h=500&fit=crop'; // Shoes
  }
  if (productCategory.includes('clothing') || productCategory.includes('apparel')) {
    return 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=500&h=500&fit=crop'; // Clothing
  }
  if (productCategory.includes('home') || productCategory.includes('kitchen')) {
    return 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=500&fit=crop'; // Home/Kitchen
  }
  if (productCategory.includes('sports')) {
    return 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500&h=500&fit=crop'; // Sports
  }
  
  // Generic product image if no specific match
  return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop';
};
