
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
      logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg",
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
      logo: "https://cdn.shopify.com/s/files/1/0013/9949/4180/files/MadeIn_Logo_Black_320x.png",
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
      
      <div className="flex gap-4 overflow-x-auto py-2 pb-4 -mx-4 px-4 snap-x">
        {brands.map((brand) => (
          <div 
            key={brand.id}
            className="min-w-32 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm border px-4 hover:shadow-md transition-shadow cursor-pointer snap-start"
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
