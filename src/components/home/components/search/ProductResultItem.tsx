
import React from "react";
import { CommandItem } from "@/components/ui/command";
import { Package } from "lucide-react";

interface ProductResultItemProps {
  product: {
    id: string | number;
    title?: string;
    name?: string;
    image?: string;
    price?: number | string;
    brand?: string;
    category?: string;
  };
  onSelect: () => void;
}

const ProductResultItem = ({ product, onSelect }: ProductResultItemProps) => {
  const productName = product.title || product.name || "Unknown Product";
  const productImage = product.image || "/placeholder.svg";
  const price = typeof product.price === 'number' ? product.price : 
               typeof product.price === 'string' ? parseFloat(product.price) : null;
  
  const formattedPrice = price !== null
    ? `$${price.toFixed(2)}` 
    : product.price 
      ? `$${product.price}` 
      : "";
  
  return (
    <CommandItem 
      key={product.id} 
      value={productName}
      onSelect={onSelect}
      className="flex items-center gap-2"
    >
      {productImage ? (
        <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-100">
          <img 
            src={productImage} 
            alt={productName} 
            className="w-full h-full object-cover"
            onError={(e) => {
              console.log(`Image failed to load: ${productImage}`);
              // Fallback if image fails to load
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        </div>
      ) : (
        <Package className="h-4 w-4 mr-2" />
      )}
      
      <div className="flex flex-col overflow-hidden">
        <span className="line-clamp-1 font-medium text-sm">{productName}</span>
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
