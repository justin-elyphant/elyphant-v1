
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { Badge } from "@/components/ui/badge";
import { Heart, Gift, Settings, Eye, EyeOff, Users, ExternalLink, Grid3X3 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Wishlist, WishlistItem, normalizeWishlist, normalizeWishlistItem } from "@/types/profile";
import ConnectionTabContent from "./tabs/ConnectionTabContent";
import OverviewTabContent from "./tabs/OverviewTabContent";
import SocialProductGrid from "./SocialProductGrid";


interface ProfileTabsProps {
  profile: any;
  isOwnProfile: boolean;
  onUpdateProfile?: (updates: any) => Promise<any>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isPublicView?: boolean;
  // Connection-specific props for consolidated view
  connectionData?: {
    relationship?: string;
    customRelationship?: string;
    connectionDate?: string;
    isAutoGiftEnabled?: boolean;
    canRemoveConnection?: boolean;
    id?: string;
  };
  onSendGift?: () => void;
  onRemoveConnection?: () => void;
  onRefreshConnection?: () => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  profile,
  isOwnProfile,
  onUpdateProfile,
  activeTab,
  setActiveTab,
  isPublicView = false,
  connectionData,
  onSendGift,
  onRemoveConnection,
  onRefreshConnection
}) => {
  const { user } = useAuth();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [wishlistsLoading, setWishlistsLoading] = useState(false);

  // Fetch public wishlists when viewing someone else's profile
  useEffect(() => {
    const fetchPublicWishlists = async () => {
      if (!profile?.id || isOwnProfile) return;

      try {
        setWishlistsLoading(true);

        // Fetch public wishlists for this user
        const { data: wishlistData, error: wishlistError } = await supabase
          .from('wishlists')
          .select('*')
          .eq('user_id', profile.id)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (wishlistError) throw wishlistError;

        if (!wishlistData || wishlistData.length === 0) {
          setWishlists([]);
          return;
        }

        // Fetch items for these wishlists for preview
        const wishlistIds = wishlistData.map(wl => wl.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('wishlist_items')
          .select('*')
          .in('wishlist_id', wishlistIds);

        if (itemsError) throw itemsError;

        // Group items by wishlist
        const itemsByWishlist = (itemsData || []).reduce((acc, item) => {
          const normalized = normalizeWishlistItem(item);
          if (!acc[item.wishlist_id]) {
            acc[item.wishlist_id] = [];
          }
          acc[item.wishlist_id].push(normalized);
          return acc;
        }, {} as Record<string, WishlistItem[]>);

        // Create normalized wishlists with their items
        const normalizedWishlists = wishlistData.map(wl => 
          normalizeWishlist({
            ...wl,
            items: itemsByWishlist[wl.id] || []
          })
        );

        setWishlists(normalizedWishlists);
      } catch (err) {
        console.error('Error fetching public wishlists:', err);
        setWishlists([]);
      } finally {
        setWishlistsLoading(false);
      }
    };

    if (activeTab === 'wishlists') {
      fetchPublicWishlists();
    }
  }, [profile?.id, isOwnProfile, activeTab]);

  // Filter tabs based on viewing context
  const availableTabs = isOwnProfile 
    ? ["overview", "social", "wishlists", "activity", "settings"]
    : connectionData 
      ? ["overview", "social", "wishlists", "connection"]
      : ["overview", "social", "wishlists"];

  // Dynamic grid layout based on available tabs
  const gridCols = availableTabs.length === 3 ? "grid-cols-3" : 
                   availableTabs.length === 4 ? "grid-cols-4" : "grid-cols-5";

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${gridCols} lg:${gridCols}`}>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Social
          </TabsTrigger>
          <TabsTrigger value="wishlists" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Wishlists
          </TabsTrigger>
          {connectionData && (
            <TabsTrigger value="connection" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Connection
            </TabsTrigger>
          )}
          {isOwnProfile && (
            <>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTabContent profile={profile} isOwnProfile={isOwnProfile} />
        </TabsContent>

        <TabsContent value="social" className="mt-6">
          <SocialProductGrid profile={profile} isOwnProfile={isOwnProfile} />
        </TabsContent>

        <TabsContent value="wishlists" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                {isOwnProfile ? "My Wishlists" : "Public Wishlists"}
                {isPublicView && (
                  <Badge variant="secondary" className="ml-2">
                    Public View
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPublicView && !user ? (
                <div className="text-center py-8">
                  <EyeOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Sign up to see {profile?.name}'s wishlists
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create your account to view and interact with wishlists.
                  </p>
                  <a 
                    href="/signup"
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700"
                  >
                    View Wishlists
                  </a>
                </div>
              ) : wishlistsLoading ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                  <p className="text-gray-600">Loading wishlists...</p>
                </div>
              ) : wishlists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlists.map((wishlist) => (
                    <Card key={wishlist.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{wishlist.title}</CardTitle>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/shared-wishlist/${wishlist.id}`}>
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                        {wishlist.description && (
                          <CardDescription className="line-clamp-2">
                            {wishlist.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {wishlist.items.length > 0 ? (
                          <div className="space-y-3">
                            <div className="flex gap-2 overflow-x-auto">
                              {wishlist.items.slice(0, 4).map((item) => (
                                <div key={item.id} className="flex-shrink-0">
                                  <div className="w-16 h-16 bg-muted rounded overflow-hidden">
                                    {item.image_url && (
                                      <img 
                                        src={item.image_url} 
                                        alt={item.name || item.title}
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                  </div>
                                </div>
                              ))}
                              {wishlist.items.length > 4 && (
                                <div className="flex-shrink-0 w-16 h-16 bg-muted rounded flex items-center justify-center">
                                  <span className="text-xs text-muted-foreground">
                                    +{wishlist.items.length - 4}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                              <span>{wishlist.items.length} items</span>
                              <Badge variant="secondary" className="text-xs">
                                Public
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No items yet</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {isOwnProfile 
                      ? "You don't have any public wishlists yet."
                      : `${profile?.name} hasn't created any public wishlists yet.`
                    }
                  </p>
                  {isOwnProfile && (
                    <Button 
                      className="mt-4" 
                      onClick={() => window.location.href = '/wishlists'}
                    >
                      Create Your First Wishlist
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connection Tab - Only shown for connection profiles */}
        {connectionData && (
          <TabsContent value="connection" className="mt-6">
            <ConnectionTabContent
              profile={profile}
              connectionData={connectionData}
              onRemoveConnection={onRemoveConnection}
              onRefreshConnection={onRefreshConnection}
            />
          </TabsContent>
        )}

        {isOwnProfile && (
          <>
            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">No recent activity to display.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Profile settings will be available soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default ProfileTabs;
