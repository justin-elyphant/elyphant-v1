
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  User, 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  Settings, 
  Edit,
  Bookmark,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// Mock wishlist data - in a real app, this would come from a database
const mockWishlists = [
  {
    id: '1',
    title: 'Birthday Wishlist',
    description: 'Things I would love for my upcoming birthday',
    itemCount: 7,
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176'
  },
  {
    id: '2',
    title: 'Home Decor',
    description: 'Items for my new apartment',
    itemCount: 12,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7'
  },
  {
    id: '3',
    title: 'Tech Gadgets',
    description: 'Cool tech I want to try',
    itemCount: 5,
    image: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147'
  }
];

const UserProfile = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useLocalStorage("userData", null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("wishlists");
  
  // In a real app, this would fetch the profile data from an API
  useEffect(() => {
    // Check if viewing own profile
    if (userData && userData.id === userId) {
      setIsCurrentUser(true);
    }
    
    // This is just for the mock data - in a real app, check if user is following
    setIsFollowing(Math.random() > 0.5);
  }, [userId, userData]);
  
  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // In a real app, this would update the database
  };
  
  const handleShare = () => {
    // Mock share functionality
    navigator.clipboard.writeText(window.location.href);
    alert("Profile link copied to clipboard!");
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild className="p-0">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-48 rounded-t-lg relative mb-16">
        {/* Profile image */}
        <div className="absolute -bottom-16 left-8">
          <Avatar className="h-32 w-32 border-4 border-white">
            {userData?.profileImage ? (
              <AvatarImage src={userData.profileImage} alt={userData?.name} />
            ) : (
              <AvatarFallback className="bg-purple-100 text-purple-600 text-3xl">
                {userData?.name?.substring(0, 2).toUpperCase() || "?"}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        
        {/* Action buttons */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          {isCurrentUser ? (
            <>
              <Button size="sm" variant="secondary" asChild>
                <Link to="/profile/edit">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Profile
                </Link>
              </Button>
              <Button size="sm" variant="secondary" asChild>
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button 
                size="sm" 
                variant={isFollowing ? "secondary" : "default"}
                onClick={handleFollow}
                className={isFollowing ? "" : "bg-purple-600 hover:bg-purple-700"}
              >
                {isFollowing ? (
                  <>
                    <User className="h-4 w-4 mr-1" />
                    Following
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-1" />
                    Follow
                  </>
                )}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <div className="p-4">
                    <h2 className="text-lg font-bold mb-2">Message Feature</h2>
                    <p>Messaging functionality coming soon!</p>
                  </div>
                </DialogContent>
              </Dialog>
              <Button size="sm" variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Profile info */}
      <div className="pl-8 mb-8">
        <h1 className="text-2xl font-bold">{userData?.name || "User Name"}</h1>
        <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span className="font-medium">127</span> Followers
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span className="font-medium">83</span> Following
          </div>
          <div className="flex items-center">
            <Heart className="h-4 w-4 mr-1" />
            <span className="font-medium">254</span> Likes
          </div>
        </div>
        <p className="mt-4 text-muted-foreground">
          {userData?.profileType === "gifter" 
            ? "I love finding the perfect gifts for my friends and family!" 
            : userData?.profileType === "giftee"
            ? "Check out my wishlists for gift ideas!"
            : "I enjoy both giving and receiving gifts!"}
        </p>
      </div>
      
      <Separator className="my-6" />
      
      {/* Tabs for profile content */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="wishlists" className="flex-1">Wishlists</TabsTrigger>
          <TabsTrigger value="favorites" className="flex-1">Favorites</TabsTrigger>
          <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="wishlists" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockWishlists.map(wishlist => (
              <Card key={wishlist.id} className="overflow-hidden">
                <div 
                  className="h-36 bg-cover bg-center"
                  style={{ backgroundImage: `url(${wishlist.image})` }}
                />
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{wishlist.title}</CardTitle>
                  <CardDescription>{wishlist.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{wishlist.itemCount} items</span>
                    <Button variant="ghost" size="sm">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {isCurrentUser && (
              <Card className="flex items-center justify-center h-full border-dashed">
                <CardContent className="py-8">
                  <Button variant="outline" asChild>
                    <Link to="/wishlists/create">
                      Create New Wishlist
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="favorites" className="mt-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
            <p className="text-muted-foreground mb-4">When you find products you love, save them here for later.</p>
            <Button asChild>
              <Link to="/marketplace">Explore Marketplace</Link>
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="mt-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Activity feed coming soon</h3>
            <p className="text-muted-foreground">We're working on an activity feed to show your interactions.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;
