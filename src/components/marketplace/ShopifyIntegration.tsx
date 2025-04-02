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
    // Check if we have a saved Shopify connection
    const savedConnection = localStorage.getItem('shopifyConnection');
    if (savedConnection) {
      try {
        const { url, connected, syncTime } = JSON.parse(savedConnection);
        setShopifyUrl(url || "");
        setIsConnected(connected || false);
        setLastSyncTime(syncTime ? new Date(syncTime) : null);
        
        // If we're connected, also try to load saved products
        if (connected) {
          const savedProducts = localStorage.getItem('shopifyProducts');
          if (savedProducts) {
            try {
              const parsedProducts = JSON.parse(savedProducts);
              console.log(`ShopifyIntegration: Loaded ${parsedProducts.length} products from localStorage`);
              
              // Only update products if we found Shopify products
              if (parsedProducts && parsedProducts.length > 0) {
                setProducts(parsedProducts);
                toast.success(`Successfully loaded ${parsedProducts.length} Shopify products`);
              }
            } catch (e) {
              console.error("Error parsing saved products:", e);
              toast.error("Failed to load saved products");
            }
          }
        }
      } catch (e) {
        console.error("Error parsing saved connection:", e);
      }
    }
  }, [setProducts]);
  
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
      
      // Save connection info to localStorage
      localStorage.setItem('shopifyConnection', JSON.stringify({
        url,
        connected: true,
        syncTime: new Date().toISOString()
      }));
      
      // Create mock Shopify products
      const mockProducts: Product[] = [
        {
          id: 101,
          name: "Premium Bluetooth Headphones",
          price: 129.99,
          category: "Electronics",
          image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
          vendor: "Shopify",
          variants: ["Black", "White", "Rose Gold"],
          description: "Noise-cancelling bluetooth headphones with 20-hour battery life"
        },
        {
          id: 102,
          name: "Smart Fitness Watch",
          price: 199.99,
          category: "Electronics",
          image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80",
          vendor: "Shopify",
          variants: ["Black", "Silver", "Blue"],
          description: "Track your fitness goals with this premium smart watch"
        },
        {
          id: 103,
          name: "Luxury Scented Candle Set",
          price: 49.99,
          category: "Home",
          image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&q=80",
          vendor: "Shopify",
          variants: ["Vanilla", "Lavender", "Sandalwood"],
          description: "Set of 4 premium hand-poured scented candles"
        },
        {
          id: 104,
          name: "Ceramic Pour-Over Coffee Set",
          price: 64.99,
          category: "Home",
          image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&q=80",
          vendor: "Shopify",
          variants: ["Matte Black", "White", "Terracotta"],
          description: "Complete pour-over coffee brewing kit with ceramic dripper"
        },
        {
          id: 105,
          name: "Handcrafted Leather Wallet",
          price: 79.99,
          category: "Accessories",
          image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80",
          vendor: "Shopify",
          variants: ["Brown", "Black", "Tan"],
          description: "Full-grain leather wallet with RFID protection"
        },
        {
          id: 106,
          name: "Designer Succulent Planter",
          price: 34.99,
          category: "Home",
          image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&q=80",
          vendor: "Shopify",
          variants: ["Small", "Medium", "Large"],
          description: "Geometric concrete planter perfect for succulents and small plants"
        },
      ];
      
      // Save products to state and localStorage
      setProducts(mockProducts);
      localStorage.setItem('shopifyProducts', JSON.stringify(mockProducts));
      
      toast.success("Shopify store connected successfully! We've imported your catalog.");
    }, 1500);
  };
  
  const handleDisconnect = () => {
    setIsConnected(false);
    setShopifyUrl("");
    setLastSyncTime(null);
    
    // Clear shopify connection but keep products for reference
    localStorage.removeItem('shopifyConnection');
    
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
