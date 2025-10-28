
import React from "react";

interface Brand {
  id: string;
  name: string;
  logo: string;
  searchTerm: string;
}

const PopularBrands = () => {
  const brands: Brand[] = [
    {
      id: "apple",
      name: "Apple",
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
      searchTerm: "apple"
    },
    {
      id: "samsung",
      name: "Samsung",
      logo: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Samsung_wordmark.svg",
      searchTerm: "samsung"
    },
    {
      id: "nike",
      name: "Nike",
      logo: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
      searchTerm: "nike"
    },
    {
      id: "adidas",
      name: "Adidas",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/2560px-Adidas_Logo.svg.png",
      searchTerm: "adidas"
    },
    {
      id: "sony",
      name: "Sony",
      logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg",
      searchTerm: "sony"
    },
    {
      id: "madein",
      name: "Made In",
      logo: "/lovable-uploads/fafc0202-32b9-4ea2-8754-fba313037ea7.png",
      searchTerm: "made in cookware"
    },
    {
      id: "lego",
      name: "Lego",
      logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/LEGO_logo.svg",
      searchTerm: "lego"
    }
  ];

  return (
    <div className="space-y-6 mb-12">
      <h2 className="text-2xl font-semibold tracking-tight">Popular Brands</h2>
      
      {/* Grid layout for mobile-first approach */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
        {brands.map((brand) => (
          <div 
            key={brand.id} 
            className="aspect-[2/1] bg-white rounded-lg flex items-center justify-center shadow-sm border px-3 hover:shadow-md transition-shadow cursor-pointer touch-target-48 touch-manipulation"
          >
            <img 
              src={brand.logo} 
              alt={brand.name} 
              className="max-h-8 max-w-full object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularBrands;
