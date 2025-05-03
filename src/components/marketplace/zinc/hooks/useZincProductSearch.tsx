
import { useState, useEffect, useRef } from 'react';
import { useProducts } from '@/contexts/ProductContext';
import { toast } from 'sonner';
import { Product } from '@/types/product';
import { searchProducts } from '@/components/marketplace/zinc/zincService';
import { useSearchParams } from 'react-router-dom';

export const useZincProductSearch = () => {
  const { products, setProducts } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [localSearchTerm, setLocalSearchTerm] = useState(searchParams.get('search') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [marketplaceProducts, setMarketplaceProducts] = useState<Product[]>([]);
  const [specialCaseProducts, setSpecialCaseProducts] = useState<Product[]>([]);
  const searchTimeoutRef = useRef<number | null>(null);

  // Sync URL search param with state
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch !== null && urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
      setLocalSearchTerm(urlSearch);
    }
  }, [searchParams]);

  // Handle search when searchTerm changes
  useEffect(() => {
    if (searchTerm && searchTerm.trim()) {
      handleSearch(searchTerm);
    }
  }, [searchTerm]);

  // Filter products when the global products list changes
  useEffect(() => {
    if (products.length > 0) {
      // Filter out special-case products like Apple
      const specials = products.filter(p => 
        p.brand?.toLowerCase() === 'apple' || 
        (p.name && p.name.toLowerCase().includes('apple '))
      );
      
      const regular = products.filter(p => 
        !(p.brand?.toLowerCase() === 'apple' || 
        (p.name && p.name.toLowerCase().includes('apple ')))
      );
      
      setSpecialCaseProducts(specials);
      setMarketplaceProducts(regular);
      
      console.log(`Filtered ${specials.length} special case products and ${regular.length} regular products from context`);
    } else {
      setSpecialCaseProducts([]);
      setMarketplaceProducts([]);
    }
  }, [products]);

  const handleSearch = async (term: string) => {
    if (!term || term.trim() === '') return;
    
    // Clear any pending search timeout
    if (searchTimeoutRef.current !== null) {
      window.clearTimeout(searchTimeoutRef.current);
    }
    
    setIsLoading(true);
    
    try {
      console.log(`Searching for products with term: "${term}"`);
      
      // Get search results using the shared service
      const results = await searchProducts(term);
      
      if (results && results.length > 0) {
        console.log(`Found ${results.length} products for search term "${term}"`);
        
        // Update products in context to make them available globally
        setProducts(prevProducts => {
          // Remove any existing products from this search to avoid duplicates
          const filteredProducts = prevProducts.filter(p => 
            !p.vendor?.includes("Amazon via Zinc") || 
            !p.id?.toString().includes("mock-")
          );
          
          // Add new products
          return [...filteredProducts, ...results];
        });
      } else {
        console.log(`No products found for search term "${term}"`);
        toast.error(`No products found`, {
          description: `No products found matching "${term}"`
        });
      }
    } catch (error) {
      console.error(`Error searching for products with term "${term}":`, error);
      toast.error(`Search error`, {
        description: "There was a problem processing your search request"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncProducts = () => {
    if (searchTerm) {
      toast.info("Syncing products", {
        description: `Refreshing products for "${searchTerm}"`
      });
      
      // Force refresh search results
      handleSearch(searchTerm);
    } else {
      toast.error("No search term", {
        description: "Please enter a search term to sync products"
      });
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    localSearchTerm, 
    setLocalSearchTerm,
    handleSearch,
    syncProducts,
    isLoading,
    marketplaceProducts,
    specialCaseProducts
  };
};
