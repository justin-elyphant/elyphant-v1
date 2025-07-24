import React from "react";
import { Card } from "@/components/ui/card";
import { getBrandData } from "@/constants/brandData";

interface BrandHeroSectionProps {
  brandName: string;
  productCount: number;
}

const BrandHeroSection: React.FC<BrandHeroSectionProps> = ({ brandName, productCount }) => {
  const brandData = getBrandData(brandName);

  if (!brandData) {
    // Fallback for unknown brands
    return (
      <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-slate-900">
              {brandName} Products
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Found {productCount} {productCount === 1 ? 'product' : 'products'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="mb-8 overflow-hidden animate-fade-in">
      <div 
        className="relative p-8 md:p-12"
        style={{ 
          background: brandData.backgroundGradient,
          borderRadius: "0.75rem"
        }}
      >
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Brand Logo */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl shadow-lg flex items-center justify-center p-4">
              <img 
                src={brandData.logo} 
                alt={`${brandData.name} logo`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>

          {/* Brand Content */}
          <div className="flex-1 text-center md:text-left">
            <h1 
              className="text-3xl md:text-4xl font-bold mb-2 animate-scale-in"
              style={{ color: brandData.primaryColor }}
            >
              {brandData.heroTagline}
            </h1>
            
            <p 
              className="text-lg md:text-xl mb-4 max-w-2xl opacity-90"
              style={{ color: brandData.primaryColor }}
            >
              {brandData.description}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <div 
                className="px-4 py-2 rounded-full text-sm font-medium shadow-sm border"
                style={{ 
                  backgroundColor: brandData.secondaryColor,
                  color: brandData.primaryColor,
                  borderColor: brandData.primaryColor + '20'
                }}
              >
                {productCount} {productCount === 1 ? 'Product' : 'Products'} Available
              </div>
              
              <div 
                className="text-sm font-medium opacity-75"
                style={{ color: brandData.primaryColor }}
              >
                ✨ Curated Collection
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="hidden lg:block absolute top-4 right-4 opacity-10">
            <div 
              className="w-32 h-32 rounded-full"
              style={{ backgroundColor: brandData.primaryColor }}
            />
          </div>
          <div className="hidden lg:block absolute bottom-4 right-12 opacity-5">
            <div 
              className="w-20 h-20 rounded-full"
              style={{ backgroundColor: brandData.secondaryColor }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BrandHeroSection;