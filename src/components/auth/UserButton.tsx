
import React from "react";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, LayoutDashboard, Settings, Terminal, Package, Users, Bell, User, CreditCard, HelpCircle } from "lucide-react";
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
import { normalizeImageUrl } from "@/utils/normalizeImageUrl";

const UserButton = () => {
  const navigate = useNavigate();
  const { user, signOut, isEmployee } = useAuth();
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
  
  // Get user initials from first and last name, fallback to email
  const getUserInitials = () => {
    const firstName = profile?.first_name || user?.user_metadata?.first_name;
    const lastName = profile?.last_name || user?.user_metadata?.last_name;
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    
    return user?.email ? user.email.substring(0, 2).toUpperCase() : "GG";
  };
  
  const userInitials = getUserInitials();
  
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

  // On mobile, render enriched dropdown matching desktop feature parity
  if (isMobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center space-x-1 hover:opacity-80 active:opacity-70 transition-all duration-200 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/50 rounded-full p-1 -m-1 touch-manipulation">
            <Avatar className="h-9 w-9 border border-border shadow-sm transition-all duration-200 hover:shadow-md">
              <AvatarImage 
                src={normalizeImageUrl(
                  profile?.profile_image || 
                  user?.user_metadata?.avatar_url || 
                  user?.user_metadata?.picture,
                  { bucket: 'avatars' }
                )}
                onError={(e) => {
                  console.warn('Failed to load user avatar');
                  e.currentTarget.style.display = 'none';
                }}
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
        
        <DropdownMenuContent align="end" sideOffset={8} className="w-64 bg-background border border-border shadow-lg rounded-lg z-50 max-h-[80vh] overflow-y-auto">
          {/* Profile Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={normalizeImageUrl(
                  profile?.profile_image || 
                  user?.user_metadata?.avatar_url || 
                  user?.user_metadata?.picture,
                  { bucket: 'avatars' }
                )}
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

          {/* Shopping Section */}
          <DropdownMenuItem 
            className="flex items-center gap-3 px-4 py-3 min-h-[44px] hover:bg-accent hover:text-accent-foreground cursor-pointer"
            onClick={() => navigate("/dashboard")}
          >
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Dashboard</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="flex items-center gap-3 px-4 py-3 min-h-[44px] hover:bg-accent hover:text-accent-foreground cursor-pointer"
            onClick={() => navigate("/orders")}
          >
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Orders</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 bg-border" />

          {/* Social Section */}
          <DropdownMenuItem 
            className="flex items-center gap-3 px-4 py-3 min-h-[44px] hover:bg-accent hover:text-accent-foreground cursor-pointer"
            onClick={() => navigate("/connections")}
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium flex-1">Connections</span>
            {pendingConnectionsCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-semibold">
                {pendingConnectionsCount > 99 ? '99+' : pendingConnectionsCount}
              </span>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="flex items-center gap-3 px-4 py-3 min-h-[44px] hover:bg-accent hover:text-accent-foreground cursor-pointer"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium flex-1">Notifications</span>
            {notificationsCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-semibold">
                {notificationsCount > 99 ? '99+' : notificationsCount}
              </span>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 bg-border" />

          {/* Account Section */}
          <DropdownMenuItem 
            className="flex items-center gap-3 px-4 py-3 min-h-[44px] hover:bg-accent hover:text-accent-foreground cursor-pointer"
            onClick={handleProfileClick}
          >
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">My Profile</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="flex items-center gap-3 px-4 py-3 min-h-[44px] hover:bg-accent hover:text-accent-foreground cursor-pointer"
            onClick={() => navigate("/settings")}
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Account Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="flex items-center gap-3 px-4 py-3 min-h-[44px] hover:bg-accent hover:text-accent-foreground cursor-pointer"
            onClick={() => navigate("/payments")}
          >
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Payment Methods</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="flex items-center gap-3 px-4 py-3 min-h-[44px] hover:bg-accent hover:text-accent-foreground cursor-pointer"
            onClick={() => navigate("/support")}
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Help & Support</span>
          </DropdownMenuItem>

          {/* Employee Section */}
          {isEmployee && (
            <>
              <DropdownMenuSeparator className="my-1 bg-border" />
              <DropdownMenuItem 
                className="flex items-center gap-3 px-4 py-3 min-h-[44px] hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onClick={() => navigate("/trunkline")}
              >
                <Terminal className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Trunkline</span>
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuSeparator className="my-1 bg-border" />
          
          <DropdownMenuItem 
            className="flex items-center gap-3 px-4 py-3 min-h-[44px] hover:bg-destructive/10 hover:text-destructive cursor-pointer text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            <span className="font-medium">Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  // Desktop dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-1 hover:opacity-80 active:opacity-70 transition-all duration-200 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/50 rounded-full p-1 -m-1 touch-manipulation">
          <Avatar className="h-9 w-9 border border-border shadow-sm transition-all duration-200 hover:shadow-md">
            <AvatarImage 
              src={normalizeImageUrl(
                profile?.profile_image || 
                user?.user_metadata?.avatar_url || 
                user?.user_metadata?.picture,
                { bucket: 'avatars' }
              )}
              onError={(e) => {
                console.warn('Failed to load user avatar');
                e.currentTarget.style.display = 'none';
              }}
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
      
      <DropdownMenuContent 
        align="end" 
        sideOffset={8}
        className="w-64 bg-background z-50 max-h-[80vh] overflow-y-auto overflow-visible"
      >
        {/* Triangle Pointer - positioned above dropdown */}
        <div className="absolute -top-[8px] right-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-border z-10" />
        <div className="absolute -top-[7px] right-[25px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[7px] border-b-background z-20" />
        
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

        {/* Dashboard Link */}
        <DropdownMenuItem 
          className={navigationStyles.dropdownItem}
          onClick={() => navigate("/dashboard")}
        >
          <LayoutDashboard className={navigationStyles.dropdownIcon} />
          <span className={navigationStyles.dropdownLabel}>Dashboard</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Unified Navigation Sections */}
        {sections.map((section, sectionIndex) => (
          <div key={section.id}>
            {section.items.map((item) => (
              <DropdownMenuItem 
                key={item.id}
                className={navigationStyles.dropdownItem}
                onClick={() => navigate(item.href)}
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
        
        {/* Trunkline - Employee Only */}
        {isEmployee && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className={navigationStyles.dropdownItem}
              onClick={() => navigate("/trunkline")}
            >
              <Terminal className={navigationStyles.dropdownIcon} />
              <span className={navigationStyles.dropdownLabel}>Trunkline</span>
            </DropdownMenuItem>
          </>
        )}
        
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
