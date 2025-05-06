
import { getCommonFilters } from './commonFilters';

/**
 * Get category-specific filters
 */
export const getCategoryFilters = (categoryUrl: string | null) => {
  // Get common filters for all categories
  const commonFilters = getCommonFilters();
  
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
