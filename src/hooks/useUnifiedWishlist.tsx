
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wishlist, WishlistItem, normalizeWishlist, normalizeWishlistItem } from '@/types/profile';

export const useUnifiedWishlist = () => {
  const { user } = useAuth();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistedProducts, setWishlistedProducts] = useState<string[]>([]);

  // Load wishlists from Supabase
  const loadWishlists = useCallback(async () => {
    if (!user) {
      setWishlists([]);
      setWishlistedProducts([]);
      setLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('wishlists')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading wishlists:', error);
        setLoading(false);
        return;
      }

      const userWishlists = Array.isArray(profile?.wishlists) 
        ? profile.wishlists.map(normalizeWishlist)
        : [];

      setWishlists(userWishlists);

      // Extract all wishlisted product IDs
      const productIds = userWishlists.flatMap(list => 
        list.items?.map(item => item.product_id) || []
      );
      setWishlistedProducts(productIds);
    } catch (error) {
      console.error('Error loading wishlists:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load wishlists on mount and when user changes
  useEffect(() => {
    loadWishlists();
  }, [loadWishlists]);

  // Create a new wishlist
  const createWishlist = useCallback(async (title: string, description?: string): Promise<Wishlist | null> => {
    if (!user) {
      toast.error('You must be logged in to create wishlists');
      return null;
    }

    try {
      const newWishlist: Wishlist = normalizeWishlist({
        id: crypto.randomUUID(),
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: false,
        items: []
      });

      const updatedWishlists = [...wishlists, newWishlist];

      const { error } = await supabase
        .from('profiles')
        .update({
          wishlists: updatedWishlists,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error creating wishlist:', error);
        toast.error('Failed to create wishlist');
        return null;
      }

      setWishlists(updatedWishlists);
      toast.success(`Wishlist "${title}" created successfully`);
      return newWishlist;
    } catch (error) {
      console.error('Error creating wishlist:', error);
      toast.error('Failed to create wishlist');
      return null;
    }
  }, [user, wishlists]);

  // Add product to wishlist
  const addToWishlist = useCallback(async (wishlistId: string, product: any): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to add to wishlists');
      return false;
    }

    try {
      const wishlistIndex = wishlists.findIndex(w => w.id === wishlistId);
      if (wishlistIndex === -1) {
        toast.error('Wishlist not found');
        return false;
      }

      // Check if product already exists
      const existingItem = wishlists[wishlistIndex].items?.find(
        item => item.product_id === product.id
      );

      if (existingItem) {
        toast.info('Item already in this wishlist');
        return false;
      }

      const newItem: WishlistItem = normalizeWishlistItem({
        id: crypto.randomUUID(),
        wishlist_id: wishlistId,
        product_id: product.id,
        title: product.title || product.name || '',
        name: product.title || product.name || '',
        price: product.price,
        image_url: product.image,
        brand: product.brand,
        added_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      const updatedWishlists = [...wishlists];
      updatedWishlists[wishlistIndex] = {
        ...updatedWishlists[wishlistIndex],
        items: [...(updatedWishlists[wishlistIndex].items || []), newItem],
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          wishlists: updatedWishlists,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error adding to wishlist:', error);
        toast.error('Failed to add to wishlist');
        return false;
      }

      setWishlists(updatedWishlists);
      setWishlistedProducts(prev => [...prev, product.id]);
      toast.success('Added to wishlist');
      return true;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
      return false;
    }
  }, [user, wishlists]);

  // Remove product from wishlist
  const removeFromWishlist = useCallback(async (wishlistId: string, itemId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const wishlistIndex = wishlists.findIndex(w => w.id === wishlistId);
      if (wishlistIndex === -1) return false;

      const itemToRemove = wishlists[wishlistIndex].items?.find(item => item.id === itemId);
      if (!itemToRemove) return false;

      const updatedWishlists = [...wishlists];
      updatedWishlists[wishlistIndex] = {
        ...updatedWishlists[wishlistIndex],
        items: updatedWishlists[wishlistIndex].items?.filter(item => item.id !== itemId) || [],
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          wishlists: updatedWishlists,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error removing from wishlist:', error);
        return false;
      }

      setWishlists(updatedWishlists);
      setWishlistedProducts(prev => prev.filter(id => id !== itemToRemove.product_id));
      toast.success('Removed from wishlist');
      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return false;
    }
  }, [user, wishlists]);

  // Check if product is in any wishlist
  const isProductWishlisted = useCallback((productId: string): boolean => {
    return wishlistedProducts.includes(productId);
  }, [wishlistedProducts]);

  // Get or create default wishlist
  const getOrCreateDefaultWishlist = useCallback(async (): Promise<Wishlist | null> => {
    let defaultWishlist = wishlists.find(w => w.title === 'My Wishlist');
    
    if (!defaultWishlist) {
      defaultWishlist = await createWishlist('My Wishlist', 'My default wishlist');
    }
    
    return defaultWishlist;
  }, [wishlists, createWishlist]);

  // Quick add to default wishlist (for heart button)
  const quickAddToWishlist = useCallback(async (product: any): Promise<boolean> => {
    const defaultWishlist = await getOrCreateDefaultWishlist();
    if (!defaultWishlist) return false;
    
    return await addToWishlist(defaultWishlist.id, product);
  }, [getOrCreateDefaultWishlist, addToWishlist]);

  return {
    wishlists,
    loading,
    wishlistedProducts,
    loadWishlists,
    createWishlist,
    addToWishlist,
    removeFromWishlist,
    isProductWishlisted,
    quickAddToWishlist
  };
};
