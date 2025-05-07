
/**
 * Map search queries to appropriate image categories 
 * for better search result presentation
 */
export const getImageCategory = (searchQuery: string): string => {
  const query = searchQuery.toLowerCase();
  
  if (query.includes("electronics") || query.includes("gadget") || 
      query.includes("laptop") || query.includes("phone") || 
      query.includes("camera") || query.includes("computer") ||
      query.includes("earbuds") || query.includes("headphones") ||
      query.includes("apple") || query.includes("samsung")) {
    return "Electronics";
  }
  
  if (query.includes("clothing") || query.includes("shirt") || 
      query.includes("pants") || query.includes("dress") || 
      query.includes("jacket") || query.includes("hat") ||
      query.includes("shoes") || query.includes("nike") ||
      query.includes("adidas") || query.includes("outfit") ||
      query.includes("fashion")) {
    return "Clothing";
  }
  
  if (query.includes("furniture") || query.includes("chair") || 
      query.includes("table") || query.includes("sofa") || 
      query.includes("desk") || query.includes("couch") ||
      query.includes("bed") || query.includes("mattress") ||
      query.includes("bookshelf") || query.includes("cabinet")) {
    return "Furniture";
  }
  
  if (query.includes("book") || query.includes("novel") || 
      query.includes("reading") || query.includes("textbook") || 
      query.includes("author") || query.includes("fiction") ||
      query.includes("bestseller")) {
    return "Books";
  }
  
  if (query.includes("kitchen") || query.includes("cookware") || 
      query.includes("appliance") || query.includes("utensil") || 
      query.includes("cooking") || query.includes("baking")) {
    return "Kitchen";
  }
  
  if (query.includes("gift") || query.includes("present")) {
    return "Gifts";
  }
  
  if (query.includes("toy") || query.includes("game") || 
      query.includes("kids") || query.includes("children")) {
    return "Toys";
  }
  
  // Default to Electronics as a common category
  return "Electronics";
};
