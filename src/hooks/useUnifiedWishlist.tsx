import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wishlist, WishlistItem, normalizeWishlist, normalizeWishlistItem } from '@/types/profile';

export const useUnifiedWishlist = () => {
  const { user } = useAuth();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoize wishlist product IDs to prevent unnecessary recalculations
  const wishlistedProducts = useMemo(() => {
    return wishlists.flatMap(list => 
      list.items?.map(item => item.product_id) || []
    );
  }, [wishlists]);

  // Load wishlists from Supabase with better error handling
  const loadWishlists = useCallback(async () => {
    if (!user) {
      setWishlists([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Loading wishlists for user:', user.id);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('wishlists')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading wishlists:', error);
        
        if (error.code === 'PGRST116') {
          // No profile found - create one with empty wishlists
          const defaultWishlist = createDefaultWishlist();
          await syncWishlistsToProfile([defaultWishlist]);
          setWishlists([defaultWishlist]);
        } else {
          console.warn('Database error while loading wishlists:', error.message);
          setWishlists([]);
        }
        setLoading(false);
        return;
      }

      // Handle successful response
      const userWishlists = Array.isArray(profile?.wishlists) 
        ? profile.wishlists.map(normalizeWishlist)
        : [];

      console.log('Loaded wishlists successfully:', userWishlists.length);
      setWishlists(userWishlists);

    } catch (error) {
      console.error('Unexpected error loading wishlists:', error);
      setWishlists([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Helper function to create a default wishlist
  const createDefaultWishlist = useCallback((): Wishlist => {
    return normalizeWishlist({
      id: crypto.randomUUID(),
      user_id: user?.id || '',
      title: 'My Wishlist',
      description: 'My default wishlist',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_public: false,
      items: []
    });
  }, [user?.id]);

  // Load wishlists on mount and when user changes
  useEffect(() => {
    loadWishlists();
  }, [loadWishlists]);

  // Sync wishlists to Supabase profile - optimized for batch updates
  const syncWishlistsToProfile = useCallback(async (updatedWishlists: Wishlist[]) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Syncing wishlists to profile:', updatedWishlists.length);
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          wishlists: updatedWishlists,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error syncing wishlists:', error);
        throw error;
      }

      console.log('Successfully synced wishlists to profile');
      return true;
    } catch (error) {
      console.error('Error in syncWishlistsToProfile:', error);
      throw error;
    }
  }, [user]);

  // Create a new wishlist - improved to return the complete wishlist object
  const createWishlist = useCallback(async (title: string, description?: string): Promise<Wishlist | null> => {
    if (!user) {
      toast.error('You must be logged in to create wishlists');
      return null;
    }

    try {
      console.log('Creating wishlist:', title);
      
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

      console.log('New wishlist object created:', newWishlist);

      const updatedWishlists = [...wishlists, newWishlist];
      
      // Update local state immediately for instant feedback
      setWishlists(updatedWishlists);
      
      // Sync to database
      await syncWishlistsToProfile(updatedWishlists);
      
      console.log('Wishlist created and synced successfully:', newWishlist.id);
      toast.success(`Wishlist "${title}" created successfully`);
      
      // Return the complete wishlist object for immediate use
      return newWishlist;
    } catch (error) {
      console.error('Error creating wishlist:', error);
      // Revert state on error
      await loadWishlists();
      toast.error('Failed to create wishlist. Please try again.');
      return null;
    }
  }, [user, wishlists, syncWishlistsToProfile, loadWishlists]);

  // Create a new wishlist with an item included - atomic operation to avoid race conditions
  const createWishlistWithItem = useCallback(async (title: string, product: any, description?: string): Promise<Wishlist | null> => {
    if (!user) {
      toast.error('You must be logged in to create wishlists');
      return null;
    }

    try {
      console.log('Creating wishlist with item:', title, product.id);
      
      // Create the wishlist item
      const newItem: WishlistItem = normalizeWishlistItem({
        id: crypto.randomUUID(),
        wishlist_id: '', // Will be set below
        product_id: product.id,
        title: product.title || product.name || '',
        name: product.title || product.name || '',
        price: product.price,
        image_url: product.image,
        brand: product.brand,
        added_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      const newWishlist: Wishlist = normalizeWishlist({
        id: crypto.randomUUID(),
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: false,
        items: [{ ...newItem, wishlist_id: crypto.randomUUID() }] // Set the wishlist_id
      });

      // Update the item's wishlist_id to match the new wishlist
      newWishlist.items[0].wishlist_id = newWishlist.id;

      console.log('New wishlist with item created:', newWishlist);

      const updatedWishlists = [...wishlists, newWishlist];
      
      // Update local state immediately for instant feedback
      setWishlists(updatedWishlists);
      
      // Sync to database
      await syncWishlistsToProfile(updatedWishlists);
      
      console.log('Wishlist with item created and synced successfully:', newWishlist.id);
      
      // Return the complete wishlist object for immediate use
      return newWishlist;
    } catch (error) {
      console.error('Error creating wishlist with item:', error);
      // Revert state on error
      await loadWishlists();
      toast.error('Failed to create wishlist. Please try again.');
      return null;
    }
  }, [user, wishlists, syncWishlistsToProfile, loadWishlists]);

  // Delete wishlist with optimistic updates and error handling
  const deleteWishlist = useCallback(async (wishlistId: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to delete wishlists');
      return false;
    }

    try {
      console.log('Deleting wishlist:', wishlistId);
      
      // Find the wishlist to delete
      const wishlistToDelete = wishlists.find(w => w.id === wishlistId);
      if (!wishlistToDelete) {
        toast.error('Wishlist not found');
        return false;
      }

      // Update local state immediately for optimistic UI
      const updatedWishlists = wishlists.filter(w => w.id !== wishlistId);
      setWishlists(updatedWishlists);

      // Sync to database
      await syncWishlistsToProfile(updatedWishlists);
      
      console.log('Wishlist deleted successfully:', wishlistId);
      toast.success(`Wishlist "${wishlistToDelete.title}" deleted successfully`);
      
      return true;
    } catch (error) {
      console.error('Error deleting wishlist:', error);
      // Revert state on error
      await loadWishlists();
      toast.error('Failed to delete wishlist. Please try again.');
      return false;
    }
  }, [user, wishlists, syncWishlistsToProfile, loadWishlists]);

  // Add product to wishlist with optimistic updates and better error handling
  const addToWishlist = useCallback(async (wishlistId: string, product: any): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to add to wishlists');
      return false;
    }

    try {
      console.log('Adding to wishlist:', wishlistId, 'product:', product.id);
      
      // Find wishlist in current state (including any newly created ones)
      const wishlistIndex = wishlists.findIndex(w => w.id === wishlistId);
      if (wishlistIndex === -1) {
        console.error('Wishlist not found in current state:', wishlistId);
        console.log('Available wishlists:', wishlists.map(w => ({ id: w.id, title: w.title })));
        
        // Try to reload wishlists and retry once
        console.log('Reloading wishlists and retrying...');
        await loadWishlists();
        
        // Wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check again after reload
        const updatedWishlistIndex = wishlists.findIndex(w => w.id === wishlistId);
        if (updatedWishlistIndex === -1) {
          toast.error('Wishlist not found. Please try again.');
          return false;
        }
      }

      const currentWishlistIndex = wishlistIndex !== -1 ? wishlistIndex : wishlists.findIndex(w => w.id === wishlistId);
      
      // Check if product already exists
      const existingItem = wishlists[currentWishlistIndex].items?.find(
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
      updatedWishlists[currentWishlistIndex] = {
        ...updatedWishlists[currentWishlistIndex],
        items: [...(updatedWishlists[currentWishlistIndex].items || []), newItem],
        updated_at: new Date().toISOString()
      };

      console.log('Adding item to wishlist:', newItem);

      // Update local state immediately for instant UI feedback
      setWishlists(updatedWishlists);

      // Sync to database in background
      await syncWishlistsToProfile(updatedWishlists);
      
      console.log('Item added to wishlist successfully');
      toast.success('Added to wishlist');
      return true;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      // Revert state on error
      await loadWishlists();
      toast.error('Failed to add to wishlist. Please try again.');
      return false;
    }
  }, [user, wishlists, syncWishlistsToProfile, loadWishlists]);

  // Remove product from wishlist with optimistic updates
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

      // Update local state immediately
      setWishlists(updatedWishlists);

      // Sync to database in background
      await syncWishlistsToProfile(updatedWishlists);
      
      toast.success('Removed from wishlist');
      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      // Revert state on error
      await loadWishlists();
      toast.error('Failed to remove from wishlist. Please try again.');
      return false;
    }
  }, [user, wishlists, syncWishlistsToProfile, loadWishlists]);

  // Check if product is in any wishlist - optimized with memoization
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
    try {
      const defaultWishlist = await getOrCreateDefaultWishlist();
      if (!defaultWishlist) {
        console.error('Failed to create default wishlist');
        return false;
      }
      
      return await addToWishlist(defaultWishlist.id, product);
    } catch (error) {
      console.error('Error in quickAddToWishlist:', error);
      return false;
    }
  }, [getOrCreateDefaultWishlist, addToWishlist]);

  return {
    wishlists,
    loading,
    wishlistedProducts,
    loadWishlists,
    createWishlist,
    createWishlistWithItem,
    deleteWishlist,
    addToWishlist,
    removeFromWishlist,
    isProductWishlisted,
    quickAddToWishlist
  };
};
