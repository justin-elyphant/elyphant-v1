
import { useState, useEffect } from 'react';
import { useProducts } from '@/contexts/ProductContext';

export const useZincSearch = (searchTerm: string) => {
  const [loading, setLoading] = useState(false);
  const [zincResults, setZincResults] = useState<any[]>([]);
  const { products } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchZincResults = async () => {
      // Reset results if search term is empty
      if (!searchTerm || searchTerm.trim().length < 2) {
        setZincResults([]);
        setFilteredProducts([]);
        return;
      }

      setLoading(true);
      
      try {
        // This is a mock implementation for now
        // In a real app, you would fetch from an API
        setTimeout(() => {
          // Generate mock zinc search results
          const mockZincResults = [
            {
              product_id: 'z1001',
              title: `${searchTerm} Product 1`,
              price: 99.99,
              image: 'https://source.unsplash.com/random/300x300/?product',
              rating: 4.5,
              review_count: 120,
            },
            {
              product_id: 'z1002',
              title: `${searchTerm} Product 2`,
              price: 149.99,
              image: 'https://source.unsplash.com/random/300x300/?electronics',
              rating: 4.2,
              review_count: 85,
            },
          ];
          
          setZincResults(mockZincResults);
          setLoading(false);
        }, 500);
        
        // Filter local products
        const term = searchTerm.toLowerCase();
        const filtered = products.filter(
          product => 
            product.name.toLowerCase().includes(term) || 
            (product.description && product.description.toLowerCase().includes(term))
        );
        setFilteredProducts(filtered);
        
      } catch (error) {
        console.error('Error searching Zinc API:', error);
        setLoading(false);
      }
    };

    fetchZincResults();
  }, [searchTerm, products]);

  return {
    loading,
    zincResults,
    filteredProducts,
    hasResults: zincResults.length > 0 || filteredProducts.length > 0
  };
};
