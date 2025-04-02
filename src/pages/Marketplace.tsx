import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import { useProducts } from "@/contexts/ProductContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categories } from "@/components/home/components/CategoriesDropdown";
import { Button } from "@/components/ui/button";
import { Grid, Filter, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Marketplace = () => {
  const location = useLocation();
  const { products } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get("category");
    setCurrentCategory(categoryParam);
    
    if (categoryParam) {
      const filtered = products.filter(product => 
        product.categories?.includes(categoryParam) || 
        product.category === categoryParam
      );
      setFilteredProducts(filtered.length ? filtered : products);
    } else {
      setFilteredProducts(products);
    }
  }, [location.search, products]);

  const categoryName = categories.find(c => c.url === currentCategory)?.name || "All Products";

  return (
    <div className="container mx-auto py-8">
      <MarketplaceHeader />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{categoryName}</h1>
        <p className="text-muted-foreground">
          Browse our collection of {currentCategory ? categoryName.toLowerCase() : "products"} from trusted vendors
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {showFilters && (
          <div className="w-full md:w-1/4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Price Range</h3>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        placeholder="Min" 
                        className="w-full px-3 py-2 border rounded-md"
                      />
                      <span>to</span>
                      <input 
                        type="number" 
                        placeholder="Max" 
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Free Shipping</h3>
                    <div className="flex items-center">
                      <input type="checkbox" id="freeShipping" className="mr-2" />
                      <label htmlFor="freeShipping">Free shipping</label>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Vendor</h3>
                    <select className="w-full px-3 py-2 border rounded-md">
                      <option>All Vendors</option>
                      <option>Premium Gifts Co.</option>
                      <option>Artisan Crafts</option>
                      <option>Luxury Gift Box</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className={`w-full ${showFilters ? 'md:w-3/4' : 'w-full'}`}>
          <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              
              <div className="flex border rounded-md">
                <Button 
                  variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredProducts.length} items
              </span>
              <Select defaultValue="relevance">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className={`${viewMode === 'grid' 
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' 
            : 'space-y-4'}`}
          >
            {filteredProducts.map((product, index) => (
              <div key={index} className={`${
                viewMode === 'grid' 
                  ? 'group border rounded-md overflow-hidden hover:shadow-md transition-shadow' 
                  : 'flex border rounded-md overflow-hidden hover:shadow-md transition-shadow'
              }`}>
                <div className={`${viewMode === 'list' ? 'w-1/3' : 'w-full'}`}>
                  <img 
                    src={product.imageUrl || '/placeholder.svg'} 
                    alt={product.name} 
                    className="w-full h-48 object-cover"
                  />
                </div>
                
                <div className={`p-4 ${viewMode === 'list' ? 'w-2/3' : 'w-full'}`}>
                  <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
                  <div className="text-sm text-muted-foreground mb-2">{product.vendor}</div>
                  <div className="font-bold">${product.price?.toFixed(2)}</div>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs text-green-600">Free shipping</span>
                    <Button size="sm" variant="outline">Add to Cart</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg font-medium">No products found</p>
              <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Vendor Portal</CardTitle>
            <CardDescription>
              Partner with Elyphant Marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Retailers: List your products on our marketplace and reach more customers. We handle all customer interactions and payments, making it seamless for you.
              </p>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Our Model:</span> We add a 30% convenience fee for users, handling all transactions through our integrated checkout system.
              </div>
              <a href="/vendor-signup" className="text-primary hover:underline text-sm font-medium flex items-center">
                Learn more about becoming a vendor
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Marketplace;
