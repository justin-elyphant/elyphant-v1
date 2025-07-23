import React from "react";
import { Product } from "@/types/product";
import { ChevronRight, TrendingUp, MapPin, Star, Gift, Smartphone, Home, Cpu, Sparkles } from "lucide-react";
import AirbnbStyleProductCard from "./AirbnbStyleProductCard";
import { CATEGORY_CONFIGS, filterProductsByCategory, getGeneralBestSellers } from "./utils/productCategorization";

interface CategorySectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  products: Product[];
  onProductClick: (productId: string) => void;
  onSeeAll?: () => void;
  isLocal?: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  subtitle,
  icon,
  products,
  onProductClick,
  onSeeAll,
  isLocal = false
}) => {
  if (products.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && <div className="text-gray-700">{icon}</div>}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-gray-600 text-sm mt-1">{subtitle}</p>}
          </div>
        </div>
        
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="flex items-center text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors"
          >
            See all
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        )}
      </div>

      {/* Horizontal Scrolling Grid */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-4 min-w-max">
          {products.slice(0, 8).map((product) => {
            const productId = String(product.product_id || product.id);
            return (
              <div key={productId} className="w-72 flex-shrink-0">
                <AirbnbStyleProductCard
                  product={product}
                  onProductClick={() => onProductClick(productId)}
                  isLocal={isLocal}
                  statusBadge={getProductStatus(product)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Helper function for product status badges
const getProductStatus = (product: Product): { badge: string; color: string } | null => {
  if (product.isBestSeller) {
    return { badge: "Best Seller", color: "bg-amber-100 text-amber-800 border-amber-200" };
  }
  
  if (product.tags?.includes("trending")) {
    return { badge: "Trending", color: "bg-blue-100 text-blue-800 border-blue-200" };
  }
  
  if (product.tags?.includes("new")) {
    return { badge: "New", color: "bg-green-100 text-green-800 border-green-200" };
  }
  
  return null;
};

interface AirbnbStyleCategorySectionsProps {
  products: Product[];
  onProductClick: (productId: string) => void;
}

const AirbnbStyleCategorySections: React.FC<AirbnbStyleCategorySectionsProps> = ({
  products,
  onProductClick
}) => {
  // Get general best sellers for the main section
  const generalBestSellers = getGeneralBestSellers(products);
  
  // Get category-specific best sellers
  const electronicsProducts = filterProductsByCategory(products, 'electronics');
  const homeKitchenProducts = filterProductsByCategory(products, 'homeKitchen');
  const techProducts = filterProductsByCategory(products, 'tech');
  const beautyProducts = filterProductsByCategory(products, 'beauty');
  
  // Other categories (keeping existing logic)
  const newProducts = products.filter(p => p.tags?.includes("new") || (p.id && Number(p.id) > 9000));
  const localProducts = products.filter(p => p.vendor && !p.vendor.includes("Amazon") && !p.vendor.includes("Zinc"));
  const giftProducts = products.filter(p => 
    p.category?.toLowerCase().includes("gift") || 
    p.title?.toLowerCase().includes("gift") ||
    p.name?.toLowerCase().includes("gift")
  );

  return (
    <div className="space-y-12">
      {/* Main Best Selling Section */}
      {generalBestSellers.length > 0 && (
        <CategorySection
          title="Best Selling"
          subtitle="Our most popular products right now"
          icon={<TrendingUp className="h-6 w-6" />}
          products={generalBestSellers}
          onProductClick={onProductClick}
        />
      )}

      {/* Best Selling Electronics */}
      {electronicsProducts.length > 0 && (
        <CategorySection
          title={CATEGORY_CONFIGS.electronics.title}
          subtitle={CATEGORY_CONFIGS.electronics.subtitle}
          icon={<Smartphone className="h-6 w-6" />}
          products={electronicsProducts}
          onProductClick={onProductClick}
        />
      )}

      {/* Best Selling Home & Kitchen */}
      {homeKitchenProducts.length > 0 && (
        <CategorySection
          title={CATEGORY_CONFIGS.homeKitchen.title}
          subtitle={CATEGORY_CONFIGS.homeKitchen.subtitle}
          icon={<Home className="h-6 w-6" />}
          products={homeKitchenProducts}
          onProductClick={onProductClick}
        />
      )}

      {/* Best Selling Tech */}
      {techProducts.length > 0 && (
        <CategorySection
          title={CATEGORY_CONFIGS.tech.title}
          subtitle={CATEGORY_CONFIGS.tech.subtitle}
          icon={<Cpu className="h-6 w-6" />}
          products={techProducts}
          onProductClick={onProductClick}
        />
      )}

      {/* Best Selling Beauty */}
      {beautyProducts.length > 0 && (
        <CategorySection
          title={CATEGORY_CONFIGS.beauty.title}
          subtitle={CATEGORY_CONFIGS.beauty.subtitle}
          icon={<Sparkles className="h-6 w-6" />}
          products={beautyProducts}
          onProductClick={onProductClick}
        />
      )}

      {/* Local Vendors Section */}
      {localProducts.length > 0 && (
        <CategorySection
          title="Local vendors"
          subtitle="Support local businesses in your area"
          icon={<MapPin className="h-6 w-6" />}
          products={localProducts}
          onProductClick={onProductClick}
          isLocal={true}
        />
      )}

      {/* New Arrivals */}
      {newProducts.length > 0 && (
        <CategorySection
          title="New arrivals"
          subtitle="Fresh products just added"
          icon={<Star className="h-6 w-6" />}
          products={newProducts}
          onProductClick={onProductClick}
        />
      )}

      {/* Perfect Gifts */}
      {giftProducts.length > 0 && (
        <CategorySection
          title="Perfect gifts"
          subtitle="Thoughtful presents for every occasion"
          icon={<Gift className="h-6 w-6" />}
          products={giftProducts}
          onProductClick={onProductClick}
        />
      )}

      {/* All Products Grid */}
      {products.length > 8 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">All products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.slice(8).map((product) => {
              const productId = String(product.product_id || product.id);
              return (
                <AirbnbStyleProductCard
                  key={productId}
                  product={product}
                  onProductClick={() => onProductClick(productId)}
                  statusBadge={getProductStatus(product)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AirbnbStyleCategorySections;
