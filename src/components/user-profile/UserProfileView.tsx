import React from "react";
import { Profile } from "@/types/profile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Edit } from "lucide-react";
import { Link } from "react-router-dom";

interface UserProfileViewProps {
  profile: Profile | null;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ profile }) => {
  if (!profile) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground">Unable to load your profile data.</p>
        </div>
      </div>
    );
  }

  const displayName = profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.profile_image || undefined} alt={displayName} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{displayName}</CardTitle>
                {profile.username && (
                  <p className="text-muted-foreground">@{profile.username}</p>
                )}
                {profile.bio && (
                  <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/profile/edit">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="wishlists">Wishlists</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p>{profile.email}</p>
              </div>
              {profile.dob && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                  <p>{profile.dob}</p>
                </div>
              )}
              {profile.interests && profile.interests.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Interests</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.interests.map((interest, index) => (
                      <span key={index} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="wishlists" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Wishlists</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.wishlists && profile.wishlists.length > 0 ? (
                <div className="space-y-2">
                  {profile.wishlists.map((wishlist) => (
                    <div key={wishlist.id} className="p-3 border rounded-lg">
                      <h3 className="font-medium">{wishlist.title}</h3>
                      {wishlist.description && (
                        <p className="text-sm text-muted-foreground">{wishlist.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {wishlist.items?.length || 0} items
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No wishlists created yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="outline" asChild>
                  <Link to="/settings">
                    Go to Settings
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

export default UserProfileView;