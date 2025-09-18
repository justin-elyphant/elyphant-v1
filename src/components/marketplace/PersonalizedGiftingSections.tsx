import React, { useMemo } from "react";
import { Product } from "@/types/product";
import { CategorySection } from "./CategorySection";
import { useProductDisplay } from "./product-grid/hooks/useProductDisplay";

interface PersonalizedGiftingSectionsProps {
  products: Product[];
  recipientName: string;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onShare?: (product: Product) => void;
  className?: string;
}

export const PersonalizedGiftingSections: React.FC<PersonalizedGiftingSectionsProps> = ({
  products,
  recipientName,
  onProductClick,
  onAddToCart,
  onShare,
  className = ""
}) => {
  // Use the existing product display hook to group products by their source
  const { groupedProducts } = useProductDisplay(products, "default");
  
  console.log('🎁 [PersonalizedGiftingSections] Grouped products:', {
    wishlistItems: groupedProducts.wishlistItems.length,
    preferenceItems: groupedProducts.preferenceItems.length,
    regularItems: groupedProducts.regularItems.length,
    hasGrouping: groupedProducts.hasGrouping,
    totalProducts: products.length
  });

  // Determine section data based on what we have
  const sections = useMemo(() => {
    const sectionData = [];
    
    // Section 1: Wishlist items (highest priority)
    if (groupedProducts.wishlistItems.length > 0) {
      sectionData.push({
        key: "wishlist",
        title: `Gifts from ${recipientName}'s Wishlist`,
        subtitle: `Items ${recipientName} has added to their wishlist - perfect for guaranteed gift success`,
        products: groupedProducts.wishlistItems,
        priority: 1
      });
    }
    
    // Section 2: Interest-based items (medium priority)
    if (groupedProducts.preferenceItems.length > 0) {
      sectionData.push({
        key: "interests",
        title: `Gifts Based on ${recipientName}'s Interests`,
        subtitle: `Curated selections that match their hobbies, style, and preferences`,
        products: groupedProducts.preferenceItems,
        priority: 2
      });
    }
    
    // Section 3: AI picks (lower priority, but still good options)
    if (groupedProducts.regularItems.length > 0) {
      sectionData.push({
        key: "ai-picks",
        title: "Elyphant AI Picks",
        subtitle: `Smart recommendations based on gift trends and ${recipientName}'s profile`,
        products: groupedProducts.regularItems,
        priority: 3
      });
    }
    
    // If no grouping detected, show all products as AI picks
    if (!groupedProducts.hasGrouping && products.length > 0) {
      sectionData.push({
        key: "ai-picks",
        title: "Elyphant AI Picks",
        subtitle: `Personalized gift recommendations curated just for ${recipientName}`,
        products: products,
        priority: 3
      });
    }
    
    return sectionData.sort((a, b) => a.priority - b.priority);
  }, [groupedProducts, recipientName, products]);

  // If no products, don't render anything
  if (products.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-12 ${className}`}>
      {sections.map((section, index) => (
        <CategorySection
          key={section.key}
          title={section.title}
          subtitle={section.subtitle}
          products={section.products}
          onProductClick={onProductClick}
          onAddToCart={onAddToCart}
          onShare={onShare}
          showSeeAll={false} // Don't show "See All" for personalized sections
        />
      ))}
      
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-muted/20 rounded-lg border border-border/30">
          <h3 className="font-medium text-sm text-muted-foreground mb-2">Debug: Product Distribution</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Total Products: {products.length}</div>
            <div>Wishlist Items: {groupedProducts.wishlistItems.length}</div>
            <div>Interest-based: {groupedProducts.preferenceItems.length}</div>
            <div>AI Picks: {groupedProducts.regularItems.length}</div>
            <div>Has Grouping: {groupedProducts.hasGrouping ? 'Yes' : 'No'}</div>
            <div>Sections Rendered: {sections.length}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalizedGiftingSections;