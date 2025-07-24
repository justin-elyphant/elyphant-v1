
import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Brand = {
  id: number;
  name: string;
  logo: string;
  featured: boolean;
};

type BrandsProps = {
  brands: Brand[];
};

const FeaturedBrands = ({ brands = [] }: BrandsProps) => {
  const navigate = useNavigate();
  const [loadingBrand, setLoadingBrand] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter to only show featured brands
  const featuredBrands = brands.filter(brand => brand.featured);
  
  // Carousel scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  // Handle brand click with multi-category search
  const handleBrandClick = async (e: React.MouseEvent, brandName: string) => {
    e.preventDefault();
    setLoadingBrand(brandName);
    
    // Navigate to marketplace with brand category search
    navigate(`/marketplace?brandCategories=${encodeURIComponent(brandName)}`, {
      state: { fromBrandCategories: true }
    });
    
    // Reset loading state after navigation
    setTimeout(() => setLoadingBrand(null), 1000);
  };
  
  if (!featuredBrands || featuredBrands.length === 0) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Featured Brands</h2>
        <div className="flex items-center justify-center p-8 bg-gray-50 rounded-md">
          <p className="text-muted-foreground">No featured brands available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Featured Brands</h2>
        <div className="flex items-center gap-4">
          {/* Carousel Navigation Arrows */}
          <div className="flex gap-2">
            <button
              onClick={scrollLeft}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={scrollRight}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          <Link to="/marketplace" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
            View all brands
          </Link>
        </div>
      </div>
      
      {/* Horizontal Scrolling Container */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {featuredBrands.map((brand) => (
          <Link 
            key={brand.id} 
            to={`/marketplace?brandCategories=${encodeURIComponent(brand.name)}`}
            onClick={(e) => handleBrandClick(e, brand.name)}
            className="flex-shrink-0 w-48 bg-white rounded-lg p-6 flex flex-col items-center justify-center hover:shadow-md transition-shadow border border-gray-100 group relative"
          >
            {loadingBrand === brand.name && (
              <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                <p className="text-sm text-purple-600">Loading...</p>
              </div>
            )}
            <div className="h-16 flex items-center justify-center mb-2">
              <img 
                src={brand.logo} 
                alt={brand.name}
                className="max-h-12 max-w-full object-contain"
              />
            </div>
            <p className="text-sm font-medium mt-2 text-center text-gray-600 group-hover:text-purple-600">
              Shop {brand.name}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedBrands;
