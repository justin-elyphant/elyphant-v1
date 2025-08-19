import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Heart, 
  Shield, 
  Users, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  TrendingUp,
  Calendar,
  Gift
} from "lucide-react";
import { Link } from "react-router-dom";
import PrivacyIndicator from "./PrivacyIndicator";
import { UnifiedProfileData } from "@/services/profiles/UnifiedProfileService";
import type { PublicProfileData } from "@/services/publicProfileService";

interface PublicProfileTabsProps {
  profile: UnifiedProfileData;
  publicViewData: PublicProfileData | null;
  isLoadingPublic: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  completeness: number;
}

/**
 * PUBLIC PROFILE TABS
 * 
 * Preview-focused tabs for showing users how their profile appears publicly.
 * Focus on social proof, privacy controls, and profile optimization rather than management.
 */
const PublicProfileTabs: React.FC<PublicProfileTabsProps> = ({
  profile,
  publicViewData,
  isLoadingPublic,
  activeTab,
  setActiveTab,
  completeness
}) => {
  const profileIssues = [
    { 
      field: "bio", 
      missing: !profile.bio, 
      message: "Add a bio to help others understand who you are" 
    },
    { 
      field: "profile_image", 
      missing: !profile.profile_image, 
      message: "Add a profile photo to increase connection rates by 40%" 
    },
    { 
      field: "location", 
      missing: !(profile as any).location, 
      message: "Share your location to find local connections" 
    },
    { 
      field: "gift_preferences", 
      missing: !Array.isArray(profile.gift_preferences) || profile.gift_preferences.length === 0, 
      message: "Add gift preferences to receive more thoughtful gifts" 
    }
  ].filter(issue => issue.missing);

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="public-overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Public View
          </TabsTrigger>
          <TabsTrigger value="social-proof" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Social Proof
          </TabsTrigger>
          <TabsTrigger value="wishlists-preview" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Visible Lists
          </TabsTrigger>
          <TabsTrigger value="privacy-controls" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        {/* Public Overview Tab */}
        <TabsContent value="public-overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  How Others See You
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Profile Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Name:</span>
                      <span className="font-medium">{profile.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Username:</span>
                      <span className="font-medium">@{profile.username}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Bio:</span>
                      <PrivacyIndicator field="bio" profile={profile} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Location:</span>
                      <PrivacyIndicator field="location" profile={profile} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Email:</span>
                      <PrivacyIndicator field="email" profile={profile} />
                    </div>
                  </div>
                </div>

                {profile.bio && (
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Bio Preview</h3>
                    <p className="text-muted-foreground text-sm p-3 bg-muted rounded-md">
                      {profile.bio}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Profile Optimization
                  <Badge variant={completeness >= 80 ? "default" : "secondary"}>
                    {completeness}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profileIssues.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-3">
                      Complete your profile to increase visibility and connections:
                    </p>
                    {profileIssues.map((issue, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{issue.message}</span>
                      </div>
                    ))}
                    <Button asChild className="w-full mt-4">
                      <Link to="/settings/profile">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Complete Profile
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                    <p className="font-medium text-success mb-1">Profile Complete!</p>
                    <p className="text-sm text-muted-foreground">
                      Your profile is optimized for maximum visibility and connections.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Social Proof Tab */}
        <TabsContent value="social-proof" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Connection Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{(profile as any).connection_count ?? 0}</div>
                    <div className="text-sm text-muted-foreground">Connections</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{(profile as any).wishlist_count ?? 0}</div>
                    <div className="text-sm text-muted-foreground">Public Lists</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Profile Strength</h4>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {completeness >= 80 ? "Strong profile - highly discoverable" : "Room for improvement"}
                  </p>
                </div>

                <Button asChild variant="outline" className="w-full">
                  <Link to="/connections">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Connections
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Gifting Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-6">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Gift activity and milestones will appear here as you use the platform.
                  </p>
                </div>
                
                <Button asChild variant="outline" className="w-full">
                  <Link to="/auto-gifting">
                    <Gift className="h-4 w-4 mr-2" />
                    Set Up Auto-Gifting
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Wishlists Preview Tab */}
        <TabsContent value="wishlists-preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Publicly Visible Wishlists
                <Badge variant="outline">{(profile as any).wishlist_count ?? 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {((profile as any).wishlist_count ?? 0) > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-info/10 rounded-lg">
                    <p className="text-sm font-medium text-info mb-2">
                      Your public wishlists help connections choose better gifts
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(profile as any).wishlist_count} of your wishlists are visible to connections and friends.
                    </p>
                  </div>
                  
                  <Button asChild className="w-full">
                    <Link to="/wishlists">
                      <Heart className="h-4 w-4 mr-2" />
                      Manage Wishlists
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">
                    No Public Wishlists Yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create wishlists to help your connections choose perfect gifts for you.
                  </p>
                  <Button asChild>
                    <Link to="/wishlists">
                      <Heart className="h-4 w-4 mr-2" />
                      Create Your First Wishlist
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Controls Tab */}
        <TabsContent value="privacy-controls" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Visibility Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium text-foreground mb-3">Current Privacy Settings</h4>
                  <div className="space-y-3">
                    <PrivacyIndicator field="bio" profile={profile} showLabel />
                    <PrivacyIndicator field="email" profile={profile} showLabel />
                    <PrivacyIndicator field="gift_preferences" profile={profile} showLabel />
                    <PrivacyIndicator field="shipping_address" profile={profile} showLabel />
                  </div>
                </div>

                <div className="p-4 bg-info/10 rounded-lg">
                  <h4 className="font-medium text-info mb-2">Privacy Tip</h4>
                  <p className="text-sm text-muted-foreground">
                    Sharing more information publicly increases your chances of meaningful connections and better gift recommendations.
                  </p>
                </div>

                <Button asChild className="w-full">
                  <Link to="/settings/privacy">
                    <Shield className="h-4 w-4 mr-2" />
                    Manage Privacy Settings
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PublicProfileTabs;