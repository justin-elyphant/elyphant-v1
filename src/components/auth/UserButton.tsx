
import React from "react";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useProfileDataIntegrity } from "@/hooks/common/useProfileDataIntegrity";
import NotificationBadge from "@/components/notifications/NotificationBadge";
import { useNotifications } from "@/contexts/notifications/NotificationsContext";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { usePendingConnectionsCount } from "@/hooks/usePendingConnectionsCount";
import { getNavigationConfig } from "@/components/navigation/config/navigationConfig";
import { navigationStyles } from "@/components/navigation/shared/NavigationStyles";
import { useIsMobile } from "@/hooks/use-mobile";

const UserButton = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { hasIssues, checkDataIntegrity } = useProfileDataIntegrity();
  const { unreadCount: notificationsCount } = useNotifications();
  const unreadMessagesCount = useUnreadMessagesCount();
  const pendingConnectionsCount = usePendingConnectionsCount();
  const isMobile = useIsMobile();

  // Get unified navigation configuration
  const badges = {
    cart: 0, // Cart not shown in desktop dropdown
    messages: unreadMessagesCount,
    notifications: notificationsCount,
    connections: pendingConnectionsCount,
    issues: hasIssues ? 1 : 0
  };
  
  const { sections } = getNavigationConfig(true, badges);
  
  // Debounced integrity check to prevent page cycling
  React.useEffect(() => {
    if (user && profile) {
      const timeoutId = setTimeout(() => {
        checkDataIntegrity(false); // Don't show toasts in dropdown
      }, 2000); // 2 second debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [user?.id, profile?.id, checkDataIntegrity]); // Add checkDataIntegrity dependency
  
  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "GG";
  
  // Extract user's first name with fallback logic
  const getUserFirstName = () => {
    if (!user) return "My";
    
    // Try user metadata first_name field (highest priority)
    if (user.user_metadata?.first_name) {
      return user.user_metadata.first_name.trim();
    }
    
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
  const wishlistsLabel = userName === "My" ? "My Wishlists" : `${userName}'s Wishlist`;
  
  // Calculate total notification count for avatar badge
  const totalNotificationCount = notificationsCount + unreadMessagesCount + (hasIssues ? 1 : 0);
  
  const handleSignOut = async () => {
    await signOut();
    // Auth state change will handle navigation automatically
  };

  const handleProfileClick = () => {
    // Navigate to the user's public profile using username or user ID
    const profileIdentifier = profile?.username || user?.id;
    if (profileIdentifier) {
      navigate(`/profile/${profileIdentifier}`);
    } else {
      // Fallback to streamlined signup flow for profile completion
      navigate("/auth?intent=complete-profile");
    }
  };

  const handleMarketplaceClick = () => {
    navigate("/marketplace");
  };

  const handleAvatarClick = () => {
    if (isMobile) {
      handleProfileClick();
    }
  };
  
  // On mobile, render a simple button that navigates to dashboard
  if (isMobile) {
    return (
      <button 
        onClick={handleAvatarClick}
        className="flex items-center space-x-1 hover:opacity-80 active:opacity-70 transition-all duration-200 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/50 rounded-full p-1 -m-1 touch-manipulation"
      >
        <Avatar className="h-8 w-8 border border-border shadow-sm transition-all duration-200 hover:shadow-md">
          <AvatarImage 
            src={
              profile?.profile_image || 
              user?.user_metadata?.avatar_url || 
              user?.user_metadata?.picture
            } 
          />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        {totalNotificationCount > 0 && (
          <NotificationBadge 
            count={totalNotificationCount}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-xs shadow-md"
          />
        )}
      </button>
    );
  }
  
  // Desktop dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-1 hover:opacity-80 active:opacity-70 transition-all duration-200 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/50 rounded-full p-1 -m-1 touch-manipulation">
          <Avatar className="h-8 w-8 border border-border shadow-sm transition-all duration-200 hover:shadow-md">
            <AvatarImage 
              src={
                profile?.profile_image || 
                user?.user_metadata?.avatar_url || 
                user?.user_metadata?.picture
              } 
            />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {totalNotificationCount > 0 && (
            <NotificationBadge 
              count={totalNotificationCount}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-xs shadow-md"
            />
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64 bg-background z-50 max-h-[80vh] overflow-y-auto">
        {/* Enhanced Profile Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={
                profile?.profile_image || 
                user?.user_metadata?.avatar_url || 
                user?.user_metadata?.picture
              } 
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
            </p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        {/* Unified Navigation Sections */}
        {sections.map((section, sectionIndex) => (
          <div key={section.id}>
            {section.items.map((item) => (
              <DropdownMenuItem 
                key={item.id}
                onClick={() => navigate(item.href)}
                className={navigationStyles.dropdownItem}
              >
                {item.icon && React.cloneElement(item.icon as React.ReactElement, { 
                  className: navigationStyles.dropdownIcon 
                })}
                <span className={navigationStyles.dropdownLabel}>
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    <NotificationBadge 
                      count={item.badge} 
                      className={navigationStyles.badgeDesktop}
                    />
                  )}
                </span>
              </DropdownMenuItem>
            ))}
            {sectionIndex < sections.length - 1 && <DropdownMenuSeparator />}
          </div>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className={navigationStyles.dropdownIcon} />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
