import { useState, useEffect } from 'react';
import { useShopify } from '../../../hooks/useShopify';
import { useProducts } from '@/contexts/ProductContext';
import { getShopifyProducts, syncProducts } from './shopifyService';
import { Product } from "@/types/product";
import { toast } from 'sonner';

interface ShopifyIntegrationContentProps {
  onProductsSynced: () => void;
}

const ShopifyIntegrationContent: React.FC<ShopifyIntegrationContentProps> = ({ onProductsSynced }) => {
  const { shopifyAccessToken, shopifyStoreUrl } = useShopify();
  const { setProducts } = useProducts();
  const [productsToSync, setProductsToSync] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shopifyAccessToken && shopifyStoreUrl) {
      fetchShopifyProducts();
    }
  }, [shopifyAccessToken, shopifyStoreUrl]);

  const fetchShopifyProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const shopifyProducts = await getShopifyProducts(shopifyStoreUrl, shopifyAccessToken);
      
      // Convert Shopify products to your app's Product type
      const formattedProducts: Product[] = shopifyProducts.map(product => ({
        id: product.id.toString(),
        product_id: product.id.toString(),
        name: product.title,
        title: product.title,
        price: parseFloat(product.variants[0].price),
        image: product.image.src,
        images: [product.image.src],
        vendor: product.vendor,
        category: product.product_type,
        description: product.body_html,
        product_description: product.body_html,
        variants: product.variants.map(v => v.title),
        isBestSeller: false,
        brand: product.vendor,
      }));
      
      setProductsToSync(formattedProducts);
    } catch (err) {
      console.error("Failed to fetch Shopify products:", err);
      setError("Failed to fetch products from Shopify. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncProducts = async () => {
    if (!shopifyAccessToken || !shopifyStoreUrl) {
      setError("Shopify credentials not set.");
      return;
    }

    setSyncing(true);
    setError(null);
    try {
      // Sync products with your app's backend or context
      await syncProducts(productsToSync, setProducts);
      toast.success("Products Synced", {
        description: "Your Shopify products have been successfully synced."
      });
      onProductsSynced();
    } catch (err) {
      console.error("Failed to sync products:", err);
      setError("Failed to sync products. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  if (isLoading) {
    return <div>Loading products from Shopify...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      {productsToSync.length === 0 ? (
        <div>No products found in your Shopify store.</div>
      ) : (
        <div>
          <p>Found {productsToSync.length} products in your Shopify store. Ready to sync?</p>
          <button 
            onClick={handleSyncProducts}
            disabled={syncing}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {syncing ? 'Syncing...' : 'Sync Products'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShopifyIntegrationContent;
