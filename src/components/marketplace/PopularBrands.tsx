import React from "react";
import { useNavigate } from "react-router-dom";
import { triggerHapticFeedback } from "@/utils/haptics";
import { motion } from "framer-motion";

interface Brand {
  id: string;
  name: string;
  logo: string;
  searchTerm: string;
}

const PopularBrands = () => {
  const navigate = useNavigate();
  
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
    },
    {
      id: "yeti",
      name: "Yeti",
      logo: "/images/brands/yeti-logo.svg",
      searchTerm: "yeti"
    },
    {
      id: "playstation",
      name: "PlayStation",
      logo: "/images/brands/playstation-logo.png",
      searchTerm: "playstation"
    }
  ];

  const handleBrandClick = (brand: Brand) => {
    triggerHapticFeedback('light');
    navigate(`/marketplace?brandCategories=${encodeURIComponent(brand.id)}`);
  };

  return (
    <div className="space-y-6 mb-12">
      <h2 className="text-2xl font-semibold tracking-tight">Popular Brands</h2>
      
      {/* Grid layout for mobile-first approach */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
        {brands.map((brand) => (
          <motion.div 
            key={brand.id} 
            className="aspect-[2/1] bg-white rounded-lg flex items-center justify-center shadow-sm border px-3 cursor-pointer min-h-[48px] touch-manipulation"
            onClick={() => handleBrandClick(brand)}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <img 
              src={brand.logo} 
              alt={brand.name} 
              className="max-h-8 max-w-full object-contain"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PopularBrands;
