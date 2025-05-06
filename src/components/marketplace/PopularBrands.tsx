
import React from "react";
import { useSearchParams } from "react-router-dom";

interface Brand {
  id: string;
  name: string;
  logo: string;
  searchTerm: string;
}

const PopularBrands = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const brands: Brand[] = [
    {
      id: "apple",
      name: "Apple",
      logo: "https://placehold.co/200x100/e2e8f0/64748b?text=Apple",
      searchTerm: "apple"
    },
    {
      id: "samsung",
      name: "Samsung",
      logo: "https://placehold.co/200x100/e2e8f0/64748b?text=Samsung",
      searchTerm: "samsung"
    },
    {
      id: "nike",
      name: "Nike",
      logo: "https://placehold.co/200x100/e2e8f0/64748b?text=Nike",
      searchTerm: "nike"
    },
    {
      id: "adidas",
      name: "Adidas",
      logo: "https://placehold.co/200x100/e2e8f0/64748b?text=Adidas",
      searchTerm: "adidas"
    },
    {
      id: "sony",
      name: "Sony",
      logo: "https://placehold.co/200x100/e2e8f0/64748b?text=Sony",
      searchTerm: "sony"
    }
  ];

  const handleBrandClick = (searchTerm: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("search", searchTerm);
    setSearchParams(params);
  };

  return (
    <div className="space-y-6 mb-12">
      <h2 className="text-2xl font-semibold tracking-tight">Popular Brands</h2>
      
      <div className="flex gap-4 overflow-x-auto py-2 pb-4 -mx-4 px-4 snap-x">
        {brands.map((brand) => (
          <div 
            key={brand.id}
            className="min-w-32 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm border px-4 hover:shadow-md transition-shadow cursor-pointer snap-start"
            onClick={() => handleBrandClick(brand.searchTerm)}
          >
            <img 
              src={brand.logo} 
              alt={brand.name} 
              className="max-h-10 max-w-28"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularBrands;
