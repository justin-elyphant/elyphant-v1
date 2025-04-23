
import React from "react";

const PopularBrandsSection = () => {
  const brands = [
    {
      name: "Nike",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png",
    },
    {
      name: "Lululemon",
      logo: "/lovable-uploads/f0a52aa3-9dcd-4367-9a66-0724e97f2641.png",
    },
    {
      name: "Apple",
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    },
    {
      name: "Made In",
      logo: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Made_In_Logo.png",
    },
    {
      name: "Stanley",
      logo: "https://upload.wikimedia.org/wikipedia/commons/8/89/Stanley_Black_%26_Decker_logo.svg",
    },
  ];

  return (
    <div className="py-16 bg-white">
      <div className="container px-4">
        <h2 className="text-3xl font-bold mb-3 text-center">Popular Brands</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Shop from trusted brands our customers love
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {brands.map((brand) => (
            <div 
              key={brand.name}
              className="flex items-center justify-center p-6 rounded-lg hover:shadow-md transition-shadow"
            >
              <img
                src={brand.logo}
                alt={`${brand.name} logo`}
                className="max-h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PopularBrandsSection;
