
/**
 * Common filters for all categories
 */
export const getCommonFilters = () => {
  return {
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
};
