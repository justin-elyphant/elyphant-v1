
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { User, MessageSquare, UserPlus, Settings, Gift, Calendar, Heart } from "lucide-react";
import { toast } from "sonner";
import WishlistTabContent from "@/components/user-profile/tabs/WishlistTabContent";
import ConnectTabContent from "@/components/user-profile/tabs/ConnectTabContent";
import EmptyState from "@/components/common/EmptyState";

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState("about");
  
  // For now, we'll use the current user's profile
  // In a real app, you'd fetch the profile for the specific userId
  const isOwnProfile = !userId || userId === user?.id;
  const targetProfile = isOwnProfile ? profile : null;
  
  const { status: connectionStatus } = useConnectionStatus(userId);

  const handleSendConnectionRequest = async () => {
    if (!userId) return;
    
    try {
      // Implementation would go here
      toast.success("Connection request sent!");
    } catch (error) {
      toast.error("Failed to send connection request");
    }
  };

  const handleSendMessage = () => {
    if (!userId) return;
    
    // Navigate to messages with this user
    window.location.href = `/messages?user=${userId}`;
  };

  if (!targetProfile) {
    return (
      <div className="container mx-auto p-6">
        <EmptyState
          icon={User}
          title="Profile not found"
          description="The profile you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: "Go Home",
            onClick: () => window.location.href = "/"
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center md:items-start">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={targetProfile.profile_image || undefined} />
                <AvatarFallback className="text-2xl">
                  {targetProfile.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              
              {!isOwnProfile && (
                <div className="flex gap-2">
                  {connectionStatus === 'none' && (
                    <Button onClick={handleSendConnectionRequest} size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  )}
                  {connectionStatus === 'pending' && (
                    <Button variant="outline" size="sm" disabled>
                      Request Sent
                    </Button>
                  )}
                  {connectionStatus === 'accepted' && (
                    <Button onClick={handleSendMessage} size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  )}
                </div>
              )}
              
              {isOwnProfile && (
                <Button variant="outline" size="sm" asChild>
                  <a href="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </a>
                </Button>
              )}
            </div>

            {/* Profile Details */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{targetProfile.name || 'Anonymous User'}</h1>
                  <p className="text-muted-foreground">@{targetProfile.username || 'unknown'}</p>
                </div>
                
                <div className="flex gap-2 mt-4 md:mt-0">
                  <Badge variant="secondary">
                    <Gift className="h-3 w-3 mr-1" />
                    {targetProfile.wishlists?.length || 0} Wishlists
                  </Badge>
                  <Badge variant="secondary">
                    <Calendar className="h-3 w-3 mr-1" />
                    {targetProfile.important_dates?.length || 0} Events
                  </Badge>
                </div>
              </div>

              {targetProfile.bio && (
                <p className="text-gray-600 mb-4">{targetProfile.bio}</p>
              )}

              {/* Interests */}
              {targetProfile.interests && targetProfile.interests.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {targetProfile.interests.map((interest, index) => (
                      <Badge key={index} variant="outline">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Important Dates */}
              {targetProfile.important_dates && targetProfile.important_dates.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Important Dates</h3>
                  <div className="space-y-1">
                    {targetProfile.important_dates.slice(0, 3).map((date, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Heart className="h-3 w-3 text-red-500" />
                        <span>{date.name}</span>
                        <span className="text-muted-foreground">
                          {new Date(date.date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="wishlists">Wishlists</TabsTrigger>
          <TabsTrigger value="connect">Connect</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>About {isOwnProfile ? 'You' : targetProfile.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {targetProfile.bio ? (
                <p className="text-gray-600">{targetProfile.bio}</p>
              ) : (
                <EmptyState
                  icon={User}
                  title="No bio yet"
                  description={isOwnProfile ? "Add a bio to tell people about yourself" : "This user hasn't added a bio yet"}
                  action={isOwnProfile ? {
                    label: "Add Bio",
                    onClick: () => window.location.href = "/settings",
                    variant: "outline"
                  } : undefined}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wishlists" className="mt-6">
          <WishlistTabContent profile={targetProfile} isOwnProfile={isOwnProfile} />
        </TabsContent>

        <TabsContent value="connect" className="mt-6">
          <ConnectTabContent profile={targetProfile} isOwnProfile={isOwnProfile} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
