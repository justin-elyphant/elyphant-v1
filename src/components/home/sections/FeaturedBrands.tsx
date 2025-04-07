
import React from "react";
import { Link } from "react-router-dom";

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
  // Filter to only show featured brands
  const featuredBrands = brands.filter(brand => brand.featured);
  
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
        <Link to="/marketplace" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
          View all brands
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {featuredBrands.map((brand) => (
          <Link 
            key={brand.id} 
            to={`/marketplace?brand=${brand.name}`}
            className="bg-white rounded-lg p-6 flex items-center justify-center hover:shadow-md transition-shadow border border-gray-100"
          >
            <img 
              src={brand.logo} 
              alt={brand.name}
              className="max-h-12 max-w-full"
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedBrands;
