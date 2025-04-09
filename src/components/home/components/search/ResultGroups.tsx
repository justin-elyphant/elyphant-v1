
import React from "react";
import SearchGroup from "./SearchGroup";

interface ResultGroupsProps {
  searchTerm: string;
  groupedResults: any;
  filteredProducts: any[];
  friendsData: any[];
  experiencesData: any[];
  onSelect: (value: string) => void;
  loading: boolean;
}

/**
 * Component to render different groups of search results based on the search term
 */
const ResultGroups = ({
  searchTerm,
  groupedResults,
  filteredProducts,
  friendsData,
  experiencesData,
  onSelect,
  loading
}: ResultGroupsProps) => {
  if (loading || !searchTerm?.trim()) return null;
  
  return (
    <>
      {/* Render Apple MacBooks if applicable */}
      {searchTerm.toLowerCase().includes('macbook') && groupedResults.appleProducts?.length > 0 && (
        <SearchGroup 
          heading="Apple MacBooks" 
          items={groupedResults.appleProducts.map((product: any) => ({ 
            ...product,
            isTopSeller: true
          }))} 
          onSelect={onSelect} 
        />
      )}
      
      {/* Render other laptop brands if applicable */}
      {searchTerm.toLowerCase().includes('macbook') && groupedResults.otherBrandProducts?.length > 0 && (
        <SearchGroup 
          heading="Other Laptops" 
          items={groupedResults.otherBrandProducts} 
          onSelect={onSelect} 
        />
      )}
      
      {/* Render Padres hats if applicable */}
      {searchTerm.toLowerCase().includes('padres') && groupedResults.actualHats?.length > 0 && (
        <SearchGroup 
          heading="Padres Hats" 
          items={groupedResults.actualHats} 
          onSelect={onSelect} 
        />
      )}
      
      {/* Render other Padres items if applicable */}
      {searchTerm.toLowerCase().includes('padres') && groupedResults.otherProducts?.length > 0 && (
        <SearchGroup 
          heading="Other Padres Items" 
          items={groupedResults.otherProducts} 
          onSelect={onSelect} 
        />
      )}
      
      {/* Render top sellers for other searches */}
      {!searchTerm.toLowerCase().includes('macbook') && 
      !searchTerm.toLowerCase().includes('padres') && 
      groupedResults.topSellers?.length > 0 && (
        <SearchGroup 
          heading="Top Sellers" 
          items={groupedResults.topSellers.map((product: any) => ({ 
            ...product,
            isTopSeller: true
          }))} 
          onSelect={onSelect} 
        />
      )}
      
      {/* Render other products for other searches */}
      {!searchTerm.toLowerCase().includes('macbook') && 
      !searchTerm.toLowerCase().includes('padres') && 
      groupedResults.otherProducts?.length > 0 && (
        <SearchGroup 
          heading="More Products" 
          items={groupedResults.otherProducts} 
          onSelect={onSelect} 
        />
      )}
      
      {/* Render local store products if available */}
      {filteredProducts.length > 0 && (
        <SearchGroup 
          heading="Store Products" 
          items={filteredProducts.map((product) => ({ 
            id: `local-${product.id}`,
            name: product.name,
            image: product.image,
            rating: product.rating,
            reviewCount: product.reviewCount,
            originalProduct: product // Store the original product data
          }))} 
          onSelect={onSelect} 
        />
      )}
      
      {/* Additional groups for friends and experiences */}
      {searchTerm.trim().length > 1 && !loading && (
        <>
          <SearchGroup 
            heading="Friends" 
            items={friendsData} 
            onSelect={onSelect} 
          />
          
          <SearchGroup 
            heading="Experiences" 
            items={experiencesData} 
            onSelect={onSelect} 
          />
        </>
      )}
    </>
  );
};

export default ResultGroups;
