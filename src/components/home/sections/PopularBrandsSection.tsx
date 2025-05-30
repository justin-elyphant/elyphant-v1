
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { handleBrandProducts } from "@/utils/brandUtils";
import { toast } from "sonner";

const PopularBrandsSection = () => {
  const navigate = useNavigate();
  const { products, setProducts } = useProducts();
  const [loadingBrand, setLoadingBrand] = useState<string | null>(null);
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
      logo: "/lovable-uploads/c8d47b72-d4ff-4269-81b0-e53a01164c71.png",
    },
    {
      name: "Stanley",
      logo: "/lovable-uploads/7e6e1250-c215-402c-836b-e31420624764.png",
    },
    {
      name: "Lego",
      logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/LEGO_logo.svg",
    },
  ];

  const handleBrandClick = async (brandName: string) => {
    setLoadingBrand(brandName);
    const loadingToastId = `brand-loading-${brandName}`;
    toast.loading(`Loading ${brandName} products...`, { id: loadingToastId });
    
    try {
      await handleBrandProducts(brandName, products, setProducts);
      // Dismiss the loading toast on success
      toast.dismiss(loadingToastId);
    } catch (err) {
      // Dismiss the loading toast and show error
      toast.dismiss(loadingToastId);
      toast.error(`Failed to load ${brandName} products`);
    } finally {
      setLoadingBrand(null);
      // Navigate to marketplace with search parameter
      navigate(`/marketplace?search=${encodeURIComponent(brandName)}`);
    }
  };

  return (
    <div className="py-16 bg-white">
      <div className="container px-4">
        <h2 className="text-3xl font-bold mb-3 text-center">Popular Brands</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Shop from trusted brands our customers love
        </p>
        <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar justify-center px-2">
          {brands.map((brand) => (
            <div
              key={brand.name}
              className={`relative flex flex-col items-center justify-center p-3 md:p-4 rounded-xl bg-white border border-gray-100 hover:shadow-md hover:bg-purple-50 transition cursor-pointer ${loadingBrand === brand.name ? "pointer-events-none opacity-60" : ""}`}
              style={{ minWidth: 72, minHeight: 72 }}
              onClick={() => handleBrandClick(brand.name)}
            >
              <img
                src={brand.logo}
                alt={`${brand.name} logo`}
                className={`max-h-10 max-w-20 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity ${loadingBrand === brand.name ? "grayscale" : ""}`}
                loading="lazy"
                style={{ aspectRatio: "3/1", objectFit: "contain" }}
              />
              <span className="text-xs font-medium text-gray-700 mt-2">{brand.name}</span>
              {loadingBrand === brand.name && (
                <div className="absolute text-xs text-purple-700 font-medium left-1/2 -translate-x-1/2 mt-12">
                  Loading...
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PopularBrandsSection;
