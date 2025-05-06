import { Product } from "@/contexts/ProductContext";
/**
 * Helper functions for working with product categories
 */

// Maps category URL parameters to display names
export const getCategoryName = (categoryUrl: string | null) => {
  const categoryList = [
    { url: "electronics", name: "Electronics" },
    { url: "clothing", name: "Clothing" },
    { url: "home", name: "Home & Kitchen" },
    { url: "books", name: "Books" },
    { url: "toys", name: "Toys & Games" },
    { url: "beauty", name: "Beauty & Personal Care" },
    { url: "sports", name: "Sports & Outdoors" },
    { url: "automotive", name: "Automotive" },
    { url: "baby", name: "Baby" },
    { url: "health", name: "Health & Household" },
  ];
  
  const category = categoryList.find(c => c.url === categoryUrl);
  return category ? category.name : "All Products";
};

// Get category-specific filters
export const getCategoryFilters = (categoryUrl: string | null) => {
  // Common filters for all categories
  const commonFilters = {
    price: {
      type: 'range',
      label: 'Price',
      options: [
        { value: 'all', label: 'All Prices' },
        { value: 'under25', label: 'Under $25' },
        { value: '25to50', label: '$25 - $50' },
        { value: '50to100', label: '$50 - $100' },
        { value: 'over100', label: 'Over $100' }
      ]
    },
    rating: {
      type: 'select',
      label: 'Rating',
      options: [
        { value: 'all', label: 'All Ratings' },
        { value: '4up', label: '4★ & Up' },
        { value: '3up', label: '3★ & Up' },
        { value: '2up', label: '2★ & Up' }
      ]
    },
    shipping: {
      type: 'toggle',
      label: 'Free Shipping',
      options: [
        { value: 'free', label: 'Free Shipping' }
      ]
    }
  };
  
  // Category-specific filters
  switch (categoryUrl) {
    case 'electronics':
      return {
        ...commonFilters,
        brand: {
          type: 'select',
          label: 'Brand',
          options: [
            { value: 'all', label: 'All Brands' },
            { value: 'apple', label: 'Apple' },
            { value: 'samsung', label: 'Samsung' },
            { value: 'sony', label: 'Sony' },
            { value: 'microsoft', label: 'Microsoft' },
            { value: 'lg', label: 'LG' },
            { value: 'dell', label: 'Dell' }
          ]
        },
        features: {
          type: 'checkbox',
          label: 'Features',
          options: [
            { value: 'wireless', label: 'Wireless' },
            { value: 'bluetooth', label: 'Bluetooth' },
            { value: 'touchscreen', label: 'Touchscreen' },
            { value: '5g', label: '5G Compatible' },
            { value: 'waterproof', label: 'Waterproof' }
          ]
        }
      };
    
    case 'clothing':
      return {
        ...commonFilters,
        brand: {
          type: 'select',
          label: 'Brand',
          options: [
            { value: 'all', label: 'All Brands' },
            { value: 'nike', label: 'Nike' },
            { value: 'adidas', label: 'Adidas' },
            { value: 'levis', label: 'Levi\'s' },
            { value: 'gap', label: 'Gap' },
            { value: 'hm', label: 'H&M' },
            { value: 'zara', label: 'Zara' }
          ]
        },
        size: {
          type: 'select',
          label: 'Size',
          options: [
            { value: 'all', label: 'All Sizes' },
            { value: 'xs', label: 'XS' },
            { value: 's', label: 'S' },
            { value: 'm', label: 'M' },
            { value: 'l', label: 'L' },
            { value: 'xl', label: 'XL' },
            { value: 'xxl', label: 'XXL' }
          ]
        },
        color: {
          type: 'checkbox',
          label: 'Color',
          options: [
            { value: 'black', label: 'Black' },
            { value: 'white', label: 'White' },
            { value: 'blue', label: 'Blue' },
            { value: 'red', label: 'Red' },
            { value: 'green', label: 'Green' }
          ]
        }
      };
      
    case 'home':
      return {
        ...commonFilters,
        brand: {
          type: 'select',
          label: 'Brand',
          options: [
            { value: 'all', label: 'All Brands' },
            { value: 'cuisinart', label: 'Cuisinart' },
            { value: 'kitchenaid', label: 'KitchenAid' },
            { value: 'ninja', label: 'Ninja' },
            { value: 'ikea', label: 'IKEA' },
            { value: 'dyson', label: 'Dyson' }
          ]
        },
        room: {
          type: 'select',
          label: 'Room',
          options: [
            { value: 'all', label: 'All Rooms' },
            { value: 'kitchen', label: 'Kitchen' },
            { value: 'bathroom', label: 'Bathroom' },
            { value: 'bedroom', label: 'Bedroom' },
            { value: 'livingroom', label: 'Living Room' }
          ]
        }
      };
      
    case 'sports':
      return {
        ...commonFilters,
        brand: {
          type: 'select',
          label: 'Brand',
          options: [
            { value: 'all', label: 'All Brands' },
            { value: 'nike', label: 'Nike' },
            { value: 'adidas', label: 'Adidas' },
            { value: 'underarmour', label: 'Under Armour' },
            { value: 'wilson', label: 'Wilson' },
            { value: 'callaway', label: 'Callaway' }
          ]
        },
        sport: {
          type: 'select',
          label: 'Sport',
          options: [
            { value: 'all', label: 'All Sports' },
            { value: 'basketball', label: 'Basketball' },
            { value: 'football', label: 'Football' },
            { value: 'soccer', label: 'Soccer' },
            { value: 'baseball', label: 'Baseball' },
            { value: 'golf', label: 'Golf' },
            { value: 'tennis', label: 'Tennis' }
          ]
        }
      };
    
    default:
      return commonFilters;
  }
};

// Get sort options for products
export const getSortOptions = () => {
  return [
    { value: 'relevance', label: 'Relevance' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'reviews', label: 'Most Reviews' },
    { value: 'newest', label: 'Newest' }
  ];
};

// Sort products based on the selected sort option
export const sortProducts = (products: Product[], sortOption: string) => {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return [];
  }
  
  const productsCopy = [...products];
  
  switch (sortOption) {
    case 'price-low':
      return productsCopy.sort((a, b) => {
        const priceA = typeof a.price === 'number' ? a.price : 0;
        const priceB = typeof b.price === 'number' ? b.price : 0;
        return priceA - priceB;
      });
    case 'price-high':
      return productsCopy.sort((a, b) => {
        const priceA = typeof a.price === 'number' ? a.price : 0;
        const priceB = typeof b.price === 'number' ? b.price : 0;
        return priceB - priceA;
      });
    case 'rating':
      return productsCopy.sort((a, b) => {
        const ratingA = a.stars || a.rating || 0;
        const ratingB = b.stars || b.rating || 0;
        return ratingB - ratingA;
      });
    case 'reviews':
      return productsCopy.sort((a, b) => (b.num_reviews || 0) - (a.num_reviews || 0));
    case 'newest':
      // For demo purposes, we'll just shuffle the products
      return productsCopy.sort(() => Math.random() - 0.5);
    case 'relevance':
    default:
      return productsCopy;
  }
};
