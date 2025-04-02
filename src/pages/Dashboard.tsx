
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Gift, 
  ShoppingBag, 
  Calendar, 
  UserRound, 
  Settings, 
  Heart, 
  LogOut 
} from "lucide-react";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Dashboard = () => {
  const [userData] = useLocalStorage("userData", null);
  const navigate = useNavigate();
  
  // Redirect to sign-up if not logged in
  useEffect(() => {
    if (!userData) {
      navigate("/sign-up");
    }
  }, [userData, navigate]);
  
  if (!userData) {
    return null; // Don't render anything while redirecting
  }
  
  const handleLogout = () => {
    // In a real app, this would call an API to log out
    localStorage.removeItem("userData");
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {userData?.profileImage ? (
              <AvatarImage src={userData.profileImage} alt={userData.name} />
            ) : (
              <AvatarFallback className="bg-purple-100 text-purple-600 text-xl">
                {userData.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">Welcome, {userData.name}</h1>
            <p className="text-muted-foreground">What would you like to do today?</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/profile/${userData.id}`}>
              <UserRound className="h-4 w-4 mr-2" />
              View Profile
            </Link>
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* My Wishlists */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Heart className="h-5 w-5 mr-2 text-pink-500" />
              My Wishlists
            </CardTitle>
            <CardDescription>
              Keep track of things you want
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Create and manage your wishlists to share with friends and family.
              </p>
              <Button className="w-full" asChild>
                <Link to="/wishlists">View My Wishlists</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Find Gifts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Gift className="h-5 w-5 mr-2 text-purple-500" />
              Find Gifts
            </CardTitle>
            <CardDescription>
              Discover perfect gifts for anyone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Browse our marketplace for curated gift ideas for any occasion.
              </p>
              <Button className="w-full" asChild>
                <Link to="/marketplace">Explore Marketplace</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Upcoming Events */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              Upcoming Events
            </CardTitle>
            <CardDescription>
              Important dates to remember
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Track birthdays, holidays, and special occasions to never miss a gift.
              </p>
              <Button className="w-full" asChild>
                <Link to="/events">Manage Events</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* My Orders */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2 text-emerald-500" />
              My Orders
            </CardTitle>
            <CardDescription>
              Track your purchases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                View and manage your order history and delivery status.
              </p>
              <Button className="w-full" asChild>
                <Link to="/orders">View Orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Friends & Following */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <UserRound className="h-5 w-5 mr-2 text-orange-500" />
              Friends & Following
            </CardTitle>
            <CardDescription>
              Connect with others
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Discover friends' wishlists and follow people with similar interests.
              </p>
              <Button className="w-full" asChild>
                <Link to="/connections">Manage Connections</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Account Settings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2 text-gray-500" />
              Account Settings
            </CardTitle>
            <CardDescription>
              Manage your preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Update your profile, privacy settings, and notification preferences.
              </p>
              <Button className="w-full" asChild>
                <Link to="/settings">Account Settings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
