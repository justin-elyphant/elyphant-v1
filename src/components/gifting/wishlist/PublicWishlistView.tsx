import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import CompactProfileHeader from "./CompactProfileHeader";
import UnifiedWishlistCollectionCard from "./UnifiedWishlistCollectionCard";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Wishlist, WishlistItem } from "@/types/profile";
import { Heart, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { PublicProfileData } from "@/services/publicProfileService";
import SignupCTA from "@/components/user-profile/SignupCTA";
import { useSignupCTA } from "@/hooks/useSignupCTA";
import InlineWishlistViewer from "@/components/user-profile/InlineWishlistViewer";

interface PublicWishlistViewProps {
  profile: PublicProfileData;
}

const PublicWishlistView: React.FC<PublicWishlistViewProps> = ({ profile }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWishlistId, setSelectedWishlistId] = useState<string | null>(null);
  const isAuthenticated = Boolean(user);

  const { shouldShowCTA, dismissCTA } = useSignupCTA({
    profileName: profile.name,
    isSharedProfile: !isAuthenticated
  });

  // Detect screen size
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) setScreenSize('mobile');
      else if (width < 1024) setScreenSize('tablet');
      else setScreenSize('desktop');
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch public wishlists
  useEffect(() => {
    const fetchPublicWishlists = async () => {
      setLoading(true);
      try {
        const { data: wishlistData, error } = await supabase
          .from('wishlists')
          .select('*')
          .eq('user_id', profile.id)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching public wishlists:', error);
          setWishlists([]);
          return;
        }

        // Fetch items for each wishlist
        const wishlistsWithItems: Wishlist[] = await Promise.all(
          (wishlistData || []).map(async (wl) => {
            const { data: items } = await supabase
              .from('wishlist_items')
              .select('*')
              .eq('wishlist_id', wl.id)
              .order('created_at', { ascending: false });

            return {
              ...wl,
              items: (items || []).map(item => ({
                id: item.id,
                wishlist_id: item.wishlist_id,
                product_id: item.product_id,
                title: item.title || item.name,
                name: item.name,
                price: item.price || 0,
                image_url: item.image_url || '/placeholder.svg',
                created_at: item.created_at,
                brand: item.brand,
                product_source: item.product_source,
              } as WishlistItem)),
              category: wl.category as Wishlist['category'],
            };
          })
        );

        setWishlists(wishlistsWithItems);
      } catch (err) {
        console.error('Error fetching public wishlists:', err);
        setWishlists([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicWishlists();
  }, [profile.id]);

  const totalItems = useMemo(() => {
    return wishlists.reduce((acc, w) => acc + (w.items?.length || 0), 0);
  }, [wishlists]);

  const handleConnect = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    try {
      const { error } = await supabase
        .from('user_connections')
        .insert({
          user_id: user!.id,
          connected_user_id: profile.id,
          status: 'pending',
          relationship: 'friend'
        });

      if (error) throw error;
      toast.success(`Connection request sent to ${profile.name}`);
    } catch (error) {
      toast.error("Failed to send connection request");
    }
  };

  const cardVariant = screenSize === 'mobile' ? 'mobile' : screenSize === 'tablet' ? 'tablet' : 'desktop';
  const gridCols = screenSize === 'mobile' ? 'grid-cols-2' : screenSize === 'tablet' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  // If a wishlist is selected for inline viewing
  if (selectedWishlistId) {
    const selectedWishlist = wishlists.find(w => w.id === selectedWishlistId);
    if (selectedWishlist) {
      return (
        <SidebarLayout>
          <div className="bg-background min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedWishlistId(null)}
                className="gap-2 mb-4 min-h-[44px]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {profile.name}'s Wishlists
              </Button>
            </div>
            <InlineWishlistViewer
              wishlist={selectedWishlist}
              profileOwner={{ id: profile.id, name: profile.name }}
              isConnected={profile.is_connected}
              onClose={() => setSelectedWishlistId(null)}
            />
          </div>
        </SidebarLayout>
      );
    }
  }

  return (
    <SidebarLayout>
      <div className="bg-background min-h-screen">
        {/* Compact Profile Header - Visitor Mode */}
        <CompactProfileHeader
          wishlists={wishlists}
          onCreateWishlist={() => {}}
          showGiftTracker={false}
          visitorMode={true}
          visitorProfile={{
            name: profile.name,
            avatar: profile.profile_image,
            bio: profile.bio,
            connectionCount: profile.connection_count,
            wishlistCount: profile.wishlist_count,
            itemCount: totalItems,
            userId: profile.id,
          }}
          onConnect={profile.can_connect && !profile.is_connected ? handleConnect : undefined}
          className="sticky top-0 z-40"
        />

        {/* Wishlists Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : wishlists.length > 0 ? (
            <div className={`grid ${gridCols} gap-4 md:gap-6`}>
              {wishlists.map((wishlist) => (
                <div
                  key={wishlist.id}
                  onClick={() => setSelectedWishlistId(wishlist.id)}
                  className="cursor-pointer"
                >
                  <UnifiedWishlistCollectionCard
                    wishlist={wishlist}
                    variant={cardVariant}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    readOnly={true}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Public Wishlists</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {profile.name} hasn't shared any wishlists publicly yet.
              </p>
            </div>
          )}
        </div>

        {/* Signup CTA for anonymous visitors */}
        {shouldShowCTA && !isAuthenticated && (
          <SignupCTA
            profileName={profile.name}
            onDismiss={dismissCTA}
          />
        )}
      </div>
    </SidebarLayout>
  );
};

export default PublicWishlistView;
