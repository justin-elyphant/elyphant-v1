
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth";
import { Badge } from "@/components/ui/badge";
import { Heart, Gift, Settings, Eye, EyeOff } from "lucide-react";


interface ProfileTabsProps {
  profile: any;
  isOwnProfile: boolean;
  onUpdateProfile?: (updates: any) => Promise<any>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isPublicView?: boolean;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  profile,
  isOwnProfile,
  onUpdateProfile,
  activeTab,
  setActiveTab,
  isPublicView = false
}) => {
  const { user } = useAuth();

  // Filter tabs based on viewing context
  const availableTabs = isOwnProfile 
    ? ["overview", "wishlists", "activity", "settings"]
    : ["overview", "wishlists"];

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="wishlists" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Wishlists
          </TabsTrigger>
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
                Public Wishlists
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
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {isOwnProfile 
                      ? "You don't have any public wishlists yet."
                      : `${profile?.name} hasn't created any public wishlists yet.`
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
