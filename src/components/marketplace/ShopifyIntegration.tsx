import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ProductCatalog from "./ProductCatalog";
import { useProducts } from "@/contexts/ProductContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ShopifyIntegration = () => {
  const [shopifyUrl, setShopifyUrl] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    markup: 30, // Default 30% markup
    importImages: true,
    importVariants: true,
  });
  
  const { products, setProducts } = useProducts();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  useEffect(() => {
    const savedConnection = localStorage.getItem('shopifyConnection');
    if (savedConnection) {
      const { url, connected, syncTime } = JSON.parse(savedConnection);
      setShopifyUrl(url || "");
      setIsConnected(connected || false);
      setLastSyncTime(syncTime ? new Date(syncTime) : null);
    }
  }, []);
  
  const handleConnect = () => {
    if (!shopifyUrl) {
      toast.error("Please enter a valid Shopify store URL");
      return;
    }
    
    setIsLoading(true);
    
    setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
      setLastSyncTime(new Date());
      
      localStorage.setItem('shopifyConnection', JSON.stringify({
        url: shopifyUrl,
        connected: true,
        syncTime: new Date().toISOString()
      }));
      
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
      ];
      
      setProducts(mockProducts);
      
      localStorage.setItem('shopifyProducts', JSON.stringify(mockProducts));
      
      toast.success("Shopify store connected successfully! We've imported your catalog.");
    }, 1500);
  };
  
  const handleDisconnect = () => {
    setIsConnected(false);
    setShopifyUrl("");
    setProducts([]);
    setLastSyncTime(null);
    
    localStorage.removeItem('shopifyConnection');
    localStorage.removeItem('shopifyProducts');
    
    toast.info("Shopify store disconnected");
  };
  
  const handleSyncNow = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLastSyncTime(new Date());
      
      const connection = JSON.parse(localStorage.getItem('shopifyConnection') || '{}');
      localStorage.setItem('shopifyConnection', JSON.stringify({
        ...connection,
        syncTime: new Date().toISOString()
      }));
      
      toast.success("Product sync completed. Your catalog is up to date.");
    }, 1500);
  };

  const handleSyncSettingChange = (key, value) => {
    setSyncSettings({
      ...syncSettings,
      [key]: value
    });
    toast.success(`Updated ${key} setting`);
  };
  
  const formatLastSyncTime = () => {
    if (!lastSyncTime) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };
  
  return (
    <div>
      {!isConnected ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Connect your Shopify store to import products. We'll handle all customer interactions and payments within the Elyphant platform.
          </p>
          <div className="flex space-x-2">
            <Input
              placeholder="yourstorename.myshopify.com"
              value={shopifyUrl}
              onChange={(e) => setShopifyUrl(e.target.value)}
              disabled={isLoading}
            />
            <Button onClick={handleConnect} disabled={isLoading}>
              {isLoading ? "Connecting..." : "Connect"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Products will be listed with a 30% markup as part of our convenience fee model. You'll receive orders directly to fulfill.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-500">Connected</Badge>
              <span className="font-medium">{shopifyUrl}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={isLoading}>
              Disconnect
            </Button>
          </div>
          
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Products</p>
                  <p className="font-medium">{products.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Sync</p>
                  <p className="font-medium">{formatLastSyncTime()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Price Markup</p>
                  <div className="flex items-center gap-2">
                    <Select 
                      defaultValue={syncSettings.markup.toString()} 
                      onValueChange={(value) => handleSyncSettingChange('markup', parseInt(value))}
                    >
                      <SelectTrigger className="h-7 w-20">
                        <SelectValue placeholder="Markup" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                        <SelectItem value="30">30%</SelectItem>
                        <SelectItem value="40">40%</SelectItem>
                        <SelectItem value="50">50%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Auto-Sync</p>
                  <p className="font-medium">{syncSettings.autoSync ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSyncNow} 
              disabled={isLoading}
            >
              {isLoading ? "Syncing..." : "Sync Now"}
            </Button>
            <Button variant="outline" size="sm">
              Product Settings
            </Button>
          </div>
          
          <ProductCatalog products={products} />
        </div>
      )}
    </div>
  );
};

export default ShopifyIntegration;
