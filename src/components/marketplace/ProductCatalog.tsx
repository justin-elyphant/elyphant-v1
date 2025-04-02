
import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  vendor: string;
  variants: string[];
  description: string;
};

interface ProductCatalogProps {
  products: Product[];
}

const ProductCatalog = ({ products }: ProductCatalogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState("all");
  
  // Get unique categories and vendors for filters
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(product => product.category))];
    return ["all", ...uniqueCategories];
  }, [products]);
  
  const vendors = useMemo(() => {
    const uniqueVendors = [...new Set(products.map(product => product.vendor))];
    return ["all", ...uniqueVendors];
  }, [products]);
  
  // Filter products based on search term and selected filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesVendor = selectedVendor === "all" || product.vendor === selectedVendor;
      
      return matchesSearch && matchesCategory && matchesVendor;
    });
  }, [products, searchTerm, selectedCategory, selectedVendor]);
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search products..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedVendor} onValueChange={setSelectedVendor}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Vendor" />
            </SelectTrigger>
            <SelectContent>
              {vendors.map(vendor => (
                <SelectItem key={vendor} value={vendor}>
                  {vendor === "all" ? "All Vendors" : vendor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No products found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

// Product Card component for better organization
const ProductCard = ({ product }: { product: Product }) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square relative overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="object-cover w-full h-full transform transition-transform hover:scale-105"
          loading="lazy" // Lazy loading for better performance
        />
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium line-clamp-1">{product.name}</h3>
          <Badge variant="outline">{product.category}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-2">{product.vendor}</p>
        <p className="font-semibold mb-2">${product.price.toFixed(2)}</p>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
        
        {product.variants.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.variants.map((variant, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {variant}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCatalog;
