
import React from "react";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductRating from "@/components/marketplace/product-item/ProductRating";
import { formatProductPrice } from "./productUtils";

interface ProductDetailsProps {
  product: {
    title: string;
    price: number;
    stars?: number;
    num_reviews?: number;
    category?: string;
    brand?: string;
  };
  onClick?: () => void;
  basePrice?: number;
  viewMode?: "grid" | "list";
  onAddToCart?: (e: React.MouseEvent) => void;
}

const ProductDetails = ({ 
  product, 
  onClick, 
  basePrice,
  viewMode = "grid",
  onAddToCart 
}: ProductDetailsProps) => {
  // Clean up Amazon-style titles
  const getCleanTitle = (title: string): string => {
    // Remove excessive capitalization
    if(title == undefined) return "";
    let cleanTitle = title.replace(/\b[A-Z]{2,}\b/g, (match) => 
      match.charAt(0) + match.slice(1).toLowerCase()
    );
    
    // Remove brand names from beginning if they're duplicated in product name
    if (product.category) {
      const categoryWords = product.category.split(' ');
      categoryWords.forEach(word => {
        if (word.length > 2 && cleanTitle.toLowerCase().includes(word.toLowerCase() + " " + word.toLowerCase())) {
          cleanTitle = cleanTitle.replace(new RegExp(`${word} ${word}`, 'i'), word);
        }
      });
    }
    
    // Truncate title if too long
    if (cleanTitle.length > 60) {
      cleanTitle = cleanTitle.substring(0, 57) + "...";
    }
    
    return cleanTitle;
  };

  const handleClick = onClick ? onClick : () => {};
  const handleAddToCart = onAddToCart ? onAddToCart : (e: React.MouseEvent) => {
    e.stopPropagation();
    // Default implementation if none provided
    console.log("Add to cart clicked for", product.title);
  };

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <h3 className="text-lg font-medium line-clamp-2 mb-1">
        {getCleanTitle(product?.title || "")}
      </h3>
      
      {product.brand && (
        <p className="text-gray-500 text-sm mb-1">
          {product.brand}
        </p>
      )}
      
      <div className="font-bold text-xl mt-2 mb-2">
        ${formatProductPrice(product.price)}
      </div>
      
      <ProductRating 
        rating={product.stars} 
        reviewCount={product.num_reviews} 
        size="md" 
        className="mb-3"
      />
      
      <div className="mt-1">
        <Button 
          size="sm" 
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCart(e);
          }}
        >
          <Gift className="h-4 w-4 mr-1" />
          Add To Cart
        </Button>
      </div>
    </div>
  );
};

export default ProductDetails;
