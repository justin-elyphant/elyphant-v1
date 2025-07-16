
import React from "react";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, Settings, Heart, Store, MessageSquare, LayoutDashboard, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useProfileDataIntegrity } from "@/hooks/common/useProfileDataIntegrity";
import NotificationBadge from "@/components/notifications/NotificationBadge";

const UserButton = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { hasIssues, checkDataIntegrity } = useProfileDataIntegrity();
  
  // Run integrity check when component mounts or profile changes
  React.useEffect(() => {
    if (user && profile) {
      checkDataIntegrity(false); // Don't show toasts in dropdown
    }
  }, [user, profile, checkDataIntegrity]);
  
  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "GG";
  
  // Extract user's first name with fallback logic
  const getUserFirstName = () => {
    if (!user) return "My";
    
    // Try user metadata name fields - extract first name only
    if (user.user_metadata?.name) {
      const firstName = user.user_metadata.name.split(' ')[0].trim();
      return firstName || "My";
    }
    if (user.user_metadata?.full_name) {
      const firstName = user.user_metadata.full_name.split(' ')[0].trim();
      return firstName || "My";
    }
    
    // Try to extract from email - get first name only
    if (user.email) {
      const emailName = user.email.split('@')[0];
      // Capitalize first letter and replace dots/underscores with spaces
      const processedName = emailName
        .replace(/[._]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Extract just the first name from the processed email
      const firstName = processedName.split(' ')[0].trim();
      return firstName || "My";
    }
    
    return "My";
  };

  const userName = getUserFirstName();
  const wishlistsLabel = userName === "My" ? "My Wishlists" : `${userName}'s Wishlists`;
  
  const handleSignOut = async () => {
    await signOut();
  };

  const handleProfileClick = () => {
    // Navigate to the user's public profile using username or user ID
    const profileIdentifier = profile?.username || user?.id;
    if (profileIdentifier) {
      navigate(`/profile/${profileIdentifier}`);
    } else {
      // Fallback to streamlined signup flow for profile completion
      navigate("/signup?intent=complete-profile");
    }
  };

  const handleMarketplaceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Marketplace button clicked - attempting navigation to /marketplace");
    console.log("Current location:", window.location.pathname);
    navigate("/marketplace");
    console.log("Navigate function called");
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-1 hover:opacity-80 transition-opacity relative focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500 rounded-full">
          <Avatar className="h-8 w-8 border border-gray-200">
            <AvatarImage 
              src={
                profile?.profile_image || 
                user?.user_metadata?.avatar_url || 
                user?.user_metadata?.picture
              } 
            />
            <AvatarFallback className="bg-purple-100 text-purple-800 text-sm font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-background z-50">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user?.email && (
              <p className="font-medium">{user.email}</p>
            )}
          </div>
        </div>
        
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleMarketplaceClick}>
          <Store className="mr-2 h-4 w-4" />
          <span>Marketplace</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/messages")}>
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>Messages</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/connections")}>
          <Users className="mr-2 h-4 w-4" />
          <span>Connections</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/dashboard")}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span className="relative">
            Dashboard
            {hasIssues && (
              <NotificationBadge 
                count={1} 
                className="absolute -top-2 -right-2 min-w-[1rem] h-4 text-xs"
              />
            )}
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleProfileClick}>
          <User className="mr-2 h-4 w-4" />
          <span>View Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate("/wishlists")}>
          <Heart className="mr-2 h-4 w-4" />
          <span>{wishlistsLabel}</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/orders")}>
          <span className="mr-2">🛒</span>
          <span>Orders</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/payments")}>
          <span className="mr-2">💳</span>
          <span>Payment</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
