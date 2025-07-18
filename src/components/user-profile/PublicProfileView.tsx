import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Gift } from "lucide-react";
import FollowButton from "./FollowButton";
import BlockButton from "./BlockButton";
import type { PublicProfileData } from "@/services/publicProfileService";

interface PublicProfileViewProps {
  profile: PublicProfileData;
}

const PublicProfileView: React.FC<PublicProfileViewProps> = ({ profile }) => {
  const displayName = profile.name || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
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
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">{profile.bio}</p>
                )}
                
                {/* Profile Stats */}
                <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
                  {profile.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.created_at && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Member since {new Date(profile.created_at).getFullYear()}</span>
                    </div>
                  )}
                  {profile.follower_count !== undefined && (
                    <span>{profile.follower_count} followers</span>
                  )}
                  {profile.wishlist_count !== undefined && (
                    <span>{profile.wishlist_count} public wishlists</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-2">
              {profile.can_follow && <FollowButton targetUserId={profile.id} />}
              <BlockButton targetUserId={profile.id} targetName={displayName} />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Stats */}
      {profile.is_public && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="text-center py-4">
              <div className="text-2xl font-bold">{profile.follower_count || 0}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-4">
              <div className="text-2xl font-bold">{profile.following_count || 0}</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-4">
              <div className="text-2xl font-bold">{profile.wishlist_count || 0}</div>
              <div className="text-sm text-muted-foreground">Public Wishlists</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profile Content */}
      {profile.is_public ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="space-y-4">
              <div className="text-lg font-medium">Welcome to {displayName}'s Profile</div>
              <p className="text-muted-foreground">
                This is a public profile. You can follow this user to see their updates and wishlists.
              </p>
              {profile.email && (
                <p className="text-sm text-muted-foreground">
                  Contact: {profile.email}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <div className="space-y-4">
              <div className="text-lg font-medium">Private Profile</div>
              <p className="text-muted-foreground">
                This user's profile is private. You can send a follow request to see their content.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PublicProfileView;