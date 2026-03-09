import { Product } from "@/contexts/ProductContext";
import { toast } from "sonner";
import { ShopifyConnection, SyncSettings } from "./types";
import { standardizeProduct } from "../product-item/productUtils";
import {
  storefrontApiRequest,
  STOREFRONT_PRODUCTS_QUERY,
  ShopifyProduct,
  SHOPIFY_STOREFRONT_URL,
} from "@/lib/shopify";

// Load Shopify products from localStorage
export const loadShopifyProducts = (): Product[] | null => {
  const savedProducts = localStorage.getItem('shopifyProducts');
  if (savedProducts) {
    try {
      const parsedProducts = JSON.parse(savedProducts);
      console.log(`ShopifyIntegration: Loaded ${parsedProducts.length} products from localStorage`);
      
      if (parsedProducts && parsedProducts.length > 0) {
        return parsedProducts.map((product: any) => standardizeProduct({
          ...product,
          vendor: product.vendor || "Shopify"
        }));
      }
    } catch (e) {
      console.error("Error parsing saved products:", e);
      toast.error("Failed to load saved products");
    }
  }
  return null;
};

// Save Shopify connection to localStorage
export const saveShopifyConnection = (connection: ShopifyConnection): void => {
  localStorage.setItem('shopifyConnection', JSON.stringify(connection));
};

// Load Shopify connection from localStorage
export const loadShopifyConnection = (): ShopifyConnection | null => {
  const savedConnection = localStorage.getItem('shopifyConnection');
  if (savedConnection) {
    try {
      return JSON.parse(savedConnection);
    } catch (e) {
      console.error("Error parsing saved connection:", e);
      return null;
    }
  }
  return null;
};

// Connect to a Shopify store — validates by hitting the real Storefront API
export const connectToShopify = async (storeUrl: string): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    console.log(`Connecting to Shopify store: ${storeUrl}`);

    // Quick validation of the URL format
    const normalizedUrl = storeUrl.trim().toLowerCase();
    if (!normalizedUrl.includes('.myshopify.com') && !normalizedUrl.includes('.com') && !normalizedUrl.includes('.store')) {
      return {
        success: false,
        message: "Please enter a valid Shopify store URL (e.g., yourstore.myshopify.com)"
      };
    }

    // Validate the connection by making a real Storefront API call
    const result = await storefrontApiRequest(
      `{ shop { name } }`,
    );

    if (!result) {
      return {
        success: false,
        message: "Could not reach the Shopify Storefront API. The store may require a paid plan."
      };
    }

    return {
      success: true,
      message: `Connected to ${result.data?.shop?.name || storeUrl}`,
      data: {
        shop: storeUrl,
        shopName: result.data?.shop?.name,
      }
    };
  } catch (error) {
    console.error("Error connecting to Shopify:", error);
    return {
      success: false,
      message: "Failed to connect to Shopify. Please check the store URL and try again."
    };
  }
};

// Map a Shopify Storefront API product edge to the app's Product type
const mapShopifyProduct = (edge: ShopifyProduct, markup: number): Product => {
  const node = edge.node;
  const basePrice = parseFloat(node.priceRange.minVariantPrice.amount);
  const markedUpPrice = markup > 0 ? basePrice * (1 + markup / 100) : basePrice;

  const images = node.images.edges.map(img => img.node.url);
  const firstImage = images[0] || "";

  const variantSpecifics = node.variants.edges[0]?.node.selectedOptions.map(opt => ({
    dimension: opt.name,
    value: opt.value,
  })) || [];

  const allVariants = node.variants.edges.map(v => ({
    variant_specifics: v.node.selectedOptions.map(opt => ({
      dimension: opt.name,
      value: opt.value,
    })),
    product_id: v.node.id,
  }));

  return standardizeProduct({
    product_id: node.id,
    title: node.title,
    price: Math.round(markedUpPrice * 100) / 100,
    image: firstImage,
    images,
    description: node.description,
    vendor: "Shopify",
    retailer: "Shopify",
    productSource: 'shopify' as const,
    variant_specifics: variantSpecifics,
    all_variants: allVariants,
    variants: node.options.flatMap(o => o.values),
  }) as Product;
};

// Fetch products from a connected Shopify store via the real Storefront API
export const fetchShopifyProducts = async (_storeUrl: string, syncSettings: SyncSettings): Promise<Product[] | null> => {
  try {
    console.log(`Fetching products from Shopify Storefront API`);
    console.log("Sync settings:", syncSettings);

    const result = await storefrontApiRequest(STOREFRONT_PRODUCTS_QUERY, { first: 50 });

    if (!result?.data?.products?.edges) {
      console.warn("No products returned from Storefront API");
      return [];
    }

    const products: Product[] = result.data.products.edges.map(
      (edge: ShopifyProduct) => mapShopifyProduct(edge, syncSettings.markup)
    );

    console.log(`Fetched ${products.length} products from Shopify Storefront API`);
    return products;
  } catch (error) {
    console.error("Error fetching Shopify products:", error);
    toast.error("Failed to fetch products from Shopify");
    return null;
  }
};
