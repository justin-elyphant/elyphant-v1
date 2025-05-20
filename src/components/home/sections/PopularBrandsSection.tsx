
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
  ];

  const handleBrandClick = async (brandName: string) => {
    setLoadingBrand(brandName);
    toast.loading(`Loading ${brandName} products ...`, { id: "brand-loading" });
    try {
      await handleBrandProducts(brandName, products, setProducts);
    } catch (err) {
      // The toast in brandUtils will handle errors, but let's be explicit
      toast.error(`Failed to load ${brandName} products`, { id: "brand-loading" });
    } finally {
      setLoadingBrand(null);
      // Always navigate after loading products (even if error, just like gifting/PopularBrands)
      const pageTitle = `${brandName} Products`;
      navigate(`/marketplace?brand=${encodeURIComponent(brandName)}&pageTitle=${encodeURIComponent(pageTitle)}`);
    }
  };

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
              className={`flex items-center justify-center p-6 rounded-lg hover:shadow-md transition-shadow cursor-pointer ${loadingBrand === brand.name ? "pointer-events-none opacity-60" : ""}`}
              onClick={() => handleBrandClick(brand.name)}
            >
              <img
                src={brand.logo}
                alt={`${brand.name} logo`}
                className={`max-h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity ${loadingBrand === brand.name ? "grayscale" : ""}`}
                loading="lazy"
              />
              {loadingBrand === brand.name && (
                <div className="absolute text-xs text-purple-700 font-medium left-1/2 -translate-x-1/2 mt-2">
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
