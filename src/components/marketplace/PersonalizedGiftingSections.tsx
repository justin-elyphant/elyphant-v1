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
  

  // Determine section data based on what we have
  const sections = useMemo(() => {
    const sectionData = [];
    
    // Section 1: Wishlist items (highest priority)
    if (groupedProducts.wishlistItems.length > 0) {
      sectionData.push({
        key: "wishlist",
        title: `🎯 Gifts from ${recipientName}'s Wishlist`,
        subtitle: `Items ${recipientName} has added to their wishlist - perfect for guaranteed gift success`,
        products: groupedProducts.wishlistItems,
        priority: 1,
        isWishlistSection: true
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
    
    // Section 3: AI picks (always ensure a section exists)
    if (groupedProducts.regularItems.length > 0) {
      sectionData.push({
        key: "ai-picks",
        title: "Elyphant AI Picks",
        subtitle: `Smart recommendations based on gift trends and ${recipientName}'s profile`,
        products: groupedProducts.regularItems,
        priority: 3
      });
    }
    
    // Ensure AI Picks is present even if regularItems is empty
    if (!sectionData.some((s: any) => s.key === 'ai-picks') && products.length > 0) {
      const fallbackAIPicks = groupedProducts.regularItems.length > 0
        ? groupedProducts.regularItems
        : products.filter((p: any) => !p.fromWishlist && !p.fromPreferences);
      const aiProducts = fallbackAIPicks.length > 0 ? fallbackAIPicks : products;
      sectionData.push({
        key: "ai-picks",
        title: "Elyphant AI Picks",
        subtitle: `Personalized gift recommendations curated just for ${recipientName}`,
        products: aiProducts,
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
        <div 
          key={section.key}
          className={section.isWishlistSection ? "wishlist-cta-section" : ""}
        >
          <CategorySection
            title={section.title}
            subtitle={section.subtitle}
            products={section.products}
            onProductClick={onProductClick}
            onAddToCart={onAddToCart}
            onShare={onShare}
            showSeeAll={false} // Don't show "See All" for personalized sections
            maxItems={15} // Show 15 items per section as requested
          />
        </div>
      ))}
      
    </div>
  );
};

export default PersonalizedGiftingSections;