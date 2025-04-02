
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import ProductCatalog from "./ProductCatalog";
import { useProducts, Product } from "@/contexts/ProductContext";
import ConnectShopifyForm from "./shopify/ConnectShopifyForm";
import ConnectionStatus from "./shopify/ConnectionStatus";
import SyncSettingsPanel from "./shopify/SyncSettingsPanel";

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
  
  const handleConnect = (url: string) => {
    if (!url) {
      toast.error("Please enter a valid Shopify store URL");
      return;
    }
    
    setIsLoading(true);
    setShopifyUrl(url);
    
    setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
      setLastSyncTime(new Date());
      
      localStorage.setItem('shopifyConnection', JSON.stringify({
        url,
        connected: true,
        syncTime: new Date().toISOString()
      }));
      
      const mockProducts: Product[] = [
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

  const handleSyncSettingChange = (key: string, value: any) => {
    setSyncSettings({
      ...syncSettings,
      [key]: value
    });
    toast.success(`Updated ${key} setting`);
  };
  
  return (
    <div>
      {!isConnected ? (
        <ConnectShopifyForm onConnect={handleConnect} isLoading={isLoading} />
      ) : (
        <div className="space-y-6">
          <ConnectionStatus 
            shopifyUrl={shopifyUrl} 
            onDisconnect={handleDisconnect} 
            isLoading={isLoading} 
          />
          
          <SyncSettingsPanel 
            products={products}
            lastSyncTime={lastSyncTime}
            syncSettings={syncSettings}
            onSyncSettingChange={handleSyncSettingChange}
            onSyncNow={handleSyncNow}
            isLoading={isLoading}
          />
          
          <ProductCatalog products={products} />
        </div>
      )}
    </div>
  );
};

export default ShopifyIntegration;
