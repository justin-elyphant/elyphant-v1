
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { Badge } from "@/components/ui/badge";
import { Heart, Gift, Settings, Eye, EyeOff, Users } from "lucide-react";
import ConnectionTabContent from "./tabs/ConnectionTabContent";


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

  // Filter tabs based on viewing context
  const availableTabs = isOwnProfile 
    ? ["overview", "wishlists", "activity", "settings"]
    : connectionData 
      ? ["overview", "wishlists", "connection"]
      : ["overview", "wishlists"];

  // Dynamic grid layout based on available tabs
  const gridCols = availableTabs.length === 3 ? "grid-cols-3" : "grid-cols-4";

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${gridCols} lg:${gridCols}`}>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
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
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Profile Information
                  {isPublicView && (
                    <Badge variant="secondary" className="ml-2">
                      Public View
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">About</h3>
                  <p className="text-gray-600">
                    {profile?.bio || "No bio available"}
                  </p>
                </div>
                
                {profile?.location && (
                  <div>
                    <h3 className="font-medium text-gray-900">Location</h3>
                    <p className="text-gray-600">{profile.location}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium text-gray-900">Member Since</h3>
                  <p className="text-gray-600">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}
                  </p>
                </div>

                {isPublicView && !user && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-2">Want to see more?</h4>
                    <p className="text-sm text-purple-700 mb-3">
                      Sign up to follow {profile?.name} and see their full activity.
                    </p>
                    <a 
                      href="/signup" 
                      className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
                      onClick={() => {
                        sessionStorage.setItem('elyphant-post-signup-action', JSON.stringify({
                          type: 'follow',
                          targetUserId: profile?.id,
                          targetName: profile?.name
                        }));
                      }}
                    >
                      Sign Up Free
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Gift Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile?.gift_preferences && profile.gift_preferences.length > 0 ? (
                  <div className="space-y-2">
                    {profile.gift_preferences.map((pref: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {pref}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No gift preferences shared</p>
                )}
              </CardContent>
            </Card>
          </div>
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
                    onClick={() => {
                      sessionStorage.setItem('elyphant-post-signup-action', JSON.stringify({
                        type: 'view_wishlists',
                        targetUserId: profile?.id,
                        targetName: profile?.name
                      }));
                    }}
                  >
                    View Wishlists
                  </a>
                </div>
              ) : profile?.wishlists && profile.wishlists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.wishlists.map((wishlist) => (
                    <div key={wishlist.id} className="relative">
                      <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = `/wishlist/${wishlist.id}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{wishlist.title}</CardTitle>
                          {wishlist.description && (
                            <CardDescription>{wishlist.description}</CardDescription>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{wishlist.items?.length || 0} items</span>
                            {wishlist.category && (
                              <Badge variant="outline" className="text-xs">
                                {wishlist.category}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {wishlist.items && wishlist.items.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {wishlist.items.slice(0, 4).map((item) => (
                                <div key={item.id} className="aspect-square bg-gray-50 rounded-lg p-2 flex flex-col items-center justify-center text-center">
                                  {item.image_url ? (
                                    <img 
                                      src={item.image_url} 
                                      alt={item.title || item.name || "Wishlist item"} 
                                      className="w-full h-12 object-cover rounded mb-1"
                                    />
                                  ) : (
                                    <Gift className="h-6 w-6 text-gray-400 mb-1" />
                                  )}
                                  <p className="text-xs font-medium truncate w-full">
                                    {item.title || item.name || "Untitled Item"}
                                  </p>
                                  {item.price && (
                                    <p className="text-xs text-gray-500">${item.price}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <Gift className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No items yet</p>
                            </div>
                          )}
                          {wishlist.items && wishlist.items.length > 4 && (
                            <div className="mt-2 text-center">
                              <span className="text-sm text-primary font-medium">
                                +{wishlist.items.length - 4} more items
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
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
