import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, Filter, X, ShoppingBag } from "lucide-react";
import { useProducts, Product } from "@/contexts/ProductContext";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductGalleryProps {
  initialProducts?: Product[];
  isGifteeView?: boolean; // Determines if this is for the giftee or giftor track
  onProductSelect?: (product: Product) => void;
}

const ProductGallery = ({ 
  initialProducts = [], 
  isGifteeView = true,
  onProductSelect 
}: ProductGalleryProps) => {
  const { products: contextProducts, isLoading: contextLoading } = useProducts();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [wishlistedProducts, setWishlistedProducts] = useState<number[]>([]);
  
  useEffect(() => {
    if (contextProducts && contextProducts.length > 0) {
      setProducts(contextProducts);
      setIsLoading(false);
      return;
    }
    
    if (initialProducts.length > 0) {
      setProducts(initialProducts);
      setIsLoading(false);
      return;
    }
    
    const savedProducts = localStorage.getItem('shopifyProducts');
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        setProducts(parsedProducts);
        setIsLoading(false);
        return;
      } catch (e) {
        console.error("Error parsing saved products:", e);
      }
    }
    
    const timer = setTimeout(() => {
      const mockProducts = [
        {
          id: 1,
          name: "Wireless Headphones",
          price: 129.99,
          category: "Electronics",
          image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
          vendor: "AudioTech",
          variants: ["Black", "White", "Blue"],
          description: "Premium wireless headphones with noise cancellation"
        },
        {
          id: 2,
          name: "Smart Watch",
          price: 249.99,
          category: "Electronics",
          image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80",
          vendor: "TechWear",
          variants: ["Black", "Silver"],
          description: "Smart watch with health tracking features"
        },
        {
          id: 3,
          name: "Scented Candle Set",
          price: 39.99,
          category: "Home",
          image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&q=80",
          vendor: "HomeScents",
          variants: ["Vanilla", "Lavender", "Ocean"],
          description: "Set of 3 premium scented candles"
        },
        {
          id: 4,
          name: "Coffee Mug",
          price: 19.99,
          category: "Home",
          image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&q=80",
          vendor: "KitchenGoods",
          variants: ["Black", "White", "Blue"],
          description: "Ceramic coffee mug with unique design"
        },
        {
          id: 5,
          name: "Designer Wallet",
          price: 89.99,
          category: "Accessories",
          image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80",
          vendor: "FashionHub",
          variants: ["Brown", "Black"],
          description: "Premium leather wallet with multiple card slots"
        },
        {
          id: 6,
          name: "Plant Pot",
          price: 24.99,
          category: "Home",
          image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&q=80",
          vendor: "GreenThumb",
          variants: ["Small", "Medium", "Large"],
          description: "Ceramic plant pot with drainage hole"
        },
        {
          id: 7,
          name: "Leather Notebook",
          price: 34.99,
          category: "Stationery",
          image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&q=80",
          vendor: "PaperWorks",
          description: "Premium leather-bound notebook with 200 pages"
        },
        {
          id: 8,
          name: "Essential Oil Diffuser",
          price: 49.99,
          category: "Home",
          image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&q=80",
          vendor: "WellnessHub",
          description: "Ultrasonic essential oil diffuser with LED lights"
        },
      ];
      
      setProducts(mockProducts);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [contextProducts, initialProducts]);
  
  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      searchTerm === "" || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    
    let matchesPrice = true;
    if (priceRange === "under25") matchesPrice = product.price < 25;
    else if (priceRange === "25to50") matchesPrice = product.price >= 25 && product.price <= 50;
    else if (priceRange === "50to100") matchesPrice = product.price > 50 && product.price <= 100;
    else if (priceRange === "over100") matchesPrice = product.price > 100;
    
    return matchesSearch && matchesCategory && matchesPrice;
  });
  
  useEffect(() => {
    const saved = localStorage.getItem('wishlistedProducts');
    if (saved) {
      try {
        setWishlistedProducts(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing saved wishlisted products:", e);
      }
    }
  }, []);
  
  const handleWishlistToggle = (productId: number) => {
    setWishlistedProducts(prev => {
      const newWishlisted = prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      localStorage.setItem('wishlistedProducts', JSON.stringify(newWishlisted));
      
      if (newWishlisted.includes(productId)) {
        toast.success("Added to wishlist");
      } else {
        toast.info("Removed from wishlist");
      }
      
      return newWishlisted;
    });
  };
  
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setPriceRange("all");
  };
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="aspect-square bg-gray-200 animate-pulse" />
            <CardContent className="p-4">
              <div className="h-5 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No products available</h3>
        <p className="text-muted-foreground mb-6">
          Connect your Shopify store in the Vendor Management section to import products.
        </p>
        <Button asChild>
          <a href="/vendor-management">Go to Vendor Management</a>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {contextProducts.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm flex items-center">
          <Badge className="bg-green-500 mr-2">Shopify</Badge>
          <span>Showing products from your connected Shopify store</span>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search gifts..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setFiltersVisible(!filtersVisible)}
            className={filtersVisible ? "bg-muted" : ""}
          >
            <Filter className="h-4 w-4" />
          </Button>
          
          {(searchTerm || selectedCategory !== "all" || priceRange !== "all") && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
      
      {filtersVisible && (
        <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-md">
          <div>
            <label className="text-sm font-medium block mb-1">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px]">
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
          </div>
          
          <div>
            <label className="text-sm font-medium block mb-1">Price Range</label>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under25">Under $25</SelectItem>
                <SelectItem value="25to50">$25 - $50</SelectItem>
                <SelectItem value="50to100">$50 - $100</SelectItem>
                <SelectItem value="over100">Over $100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      <div className="text-sm text-muted-foreground">
        {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <Card 
            key={product.id} 
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onProductSelect && onProductSelect(product)}
          >
            <div className="aspect-square relative overflow-hidden">
              <img 
                src={product.image} 
                alt={product.name}
                className="object-cover w-full h-full transform transition-transform hover:scale-105"
                loading="lazy"
              />
              
              {isGifteeView && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWishlistToggle(product.id);
                  }}
                >
                  <Heart 
                    className={`h-4 w-4 ${wishlistedProducts.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} 
                  />
                </Button>
              )}
            </div>
            <CardContent className="p-3">
              <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
              <p className="text-xs text-muted-foreground mb-1">{product.vendor}</p>
              <p className="font-semibold text-sm">${product.price.toFixed(2)}</p>
              
              {product.category && (
                <Badge variant="outline" className="mt-2 text-xs">
                  {product.category}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No products match your search criteria.</p>
          <Button variant="link" onClick={clearFilters}>Clear all filters</Button>
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
