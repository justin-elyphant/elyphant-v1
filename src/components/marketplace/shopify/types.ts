
// Define shared types for the Shopify integration
export interface SyncSettings {
  autoSync: boolean;
  markup: number;
  importImages: boolean;
  importVariants: boolean;
}

export interface ShopifyConnection {
  url: string;
  connected: boolean;
  syncTime: string | null;
}
