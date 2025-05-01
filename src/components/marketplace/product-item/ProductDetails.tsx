
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
  };
  onAddToCart: (e: React.MouseEvent) => void;
}

const ProductDetails = ({ product, onAddToCart }: ProductDetailsProps) => {
  // Clean up Amazon-style titles
  const getCleanTitle = (title: string): string => {
    // Remove excessive capitalization
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

  return (
    <div className="p-4 w-full">
      <h3 className="font-medium text-sm line-clamp-2 mb-1">{getCleanTitle(product.title || "")}</h3>
      <ProductRating rating={product.stars} reviewCount={product.num_reviews} size="sm" />
      <div className="font-bold mt-1">${formatProductPrice(product.price)}</div>
      <div className="mt-3 flex justify-between items-center">
        <Button 
          size="sm" 
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          onClick={onAddToCart}
        >
          <Gift className="h-4 w-4 mr-1" />
          Gift This
        </Button>
      </div>
    </div>
  );
};

export default ProductDetails;
