
import React from "react";
import { CommandItem } from "@/components/ui/command";
import { Package } from "lucide-react";

interface ProductResultItemProps {
  product: {
    id: string | number;
    title?: string;
    name?: string;
    image?: string;
    price?: number;
    brand?: string;
    category?: string;
  };
  onSelect: () => void;
}

const ProductResultItem = ({ product, onSelect }: ProductResultItemProps) => {
  const productName = product.title || product.name || "Unknown Product";
  const productImage = product.image || "/placeholder.svg";
  const formattedPrice = product.price 
    ? `$${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}` 
    : "";
  
  return (
    <CommandItem 
      key={product.id} 
      value={productName}
      onSelect={onSelect}
      className="flex items-center gap-2"
    >
      {productImage ? (
        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
          <img 
            src={productImage} 
            alt={productName} 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image fails to load
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        </div>
      ) : (
        <Package className="h-4 w-4 mr-2" />
      )}
      
      <div className="flex flex-col">
        <span className="line-clamp-1">{productName}</span>
        {(product.brand || product.category || formattedPrice) && (
          <span className="text-xs text-muted-foreground line-clamp-1">
            {[
              product.brand, 
              product.category,
              formattedPrice
            ].filter(Boolean).join(" • ")}
          </span>
        )}
      </div>
    </CommandItem>
  );
};

export default ProductResultItem;
