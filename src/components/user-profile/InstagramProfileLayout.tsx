import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import CompactProfileHeader from "./CompactProfileHeader";
import SocialProductGrid from "./SocialProductGrid";
import DesktopProfileWrapper from "./DesktopProfileWrapper";
import InstagramWishlistGrid from "./InstagramWishlistGrid";


interface InstagramProfileLayoutProps {
  // Profile data
  userData: any;
  profile: any;
  
  // Header props
  isCurrentUser: boolean;
  isConnected: boolean;
  onConnect: () => void;
  onShare: () => void;
  connectionCount?: number;
  wishlistCount?: number;
  canConnect?: boolean;
  canMessage?: boolean;
  isAnonymousUser?: boolean;
  connectionData?: {
    relationship?: string;
    customRelationship?: string;
    connectionDate?: string;
    isAutoGiftEnabled?: boolean;
    canRemoveConnection?: boolean;
  };
  onSendGift?: () => void;
  onRemoveConnection?: () => void;
  
  // Secondary content (tabs/details)
  secondaryContent?: React.ReactNode;
  secondaryTitle?: string;
}

const InstagramProfileLayout: React.FC<InstagramProfileLayoutProps> = ({
  userData,
  profile,
  isCurrentUser,
  isConnected,
  onConnect,
  onShare,
  connectionCount = 0,
  wishlistCount = 0,
  canConnect = true,
  canMessage = true,
  isAnonymousUser = false,
  connectionData,
  onSendGift,
  onRemoveConnection,
  secondaryContent,
  secondaryTitle = "More Details"
}) => {
  const [showSecondaryContent, setShowSecondaryContent] = useState(false);
  const navigate = useNavigate();

  return (
    <div 
      className="w-full bg-background"
      style={{ width: '100vw', maxWidth: '100vw', overflow: 'hidden' }}
    >
      {/* Compact Profile Header (Instagram-style) */}
      <div className="w-full" style={{ maxWidth: '100%' }}>
        <CompactProfileHeader
          userData={userData}
          isCurrentUser={isCurrentUser}
          isConnected={isConnected}
          onConnect={onConnect}
          onShare={onShare}
          connectionCount={connectionCount}
          wishlistCount={wishlistCount}
          canConnect={canConnect}
          canMessage={canMessage}
          isAnonymousUser={isAnonymousUser}
          connectionData={connectionData}
          onSendGift={onSendGift}
          onRemoveConnection={onRemoveConnection}
        />
      </div>

      {/* Main Content Container - Full Width */}
      <div className="w-full py-4">
        {/* Instagram Wishlist Grid - Primary Focus */}
        <div className="mb-8 w-full">
          <div className="px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Wishlists</h2>
              {isCurrentUser && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/wishlists')}
                >
                  Manage
                </Button>
              )}
            </div>
          </div>
          <InstagramWishlistGrid
            profileId={profile.id || profile.user_id}
            isOwnProfile={isCurrentUser}
          />
        </div>

        {/* Social Product Grid - Collapsible Section */}
        <div className="mb-6 w-full">
          <SocialProductGrid profile={profile} isOwnProfile={isCurrentUser} />
        </div>

        {/* Expandable Secondary Content */}
        {secondaryContent && (
          <DesktopProfileWrapper className="w-full px-4">
            <Card>
              <CardContent className="p-0">
                {/* Expandable Header */}
                <Button
                  variant="ghost"
                  onClick={() => setShowSecondaryContent(!showSecondaryContent)}
                  className="w-full h-auto p-4 flex items-center justify-between text-left min-w-0"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{secondaryTitle}</h3>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {showSecondaryContent ? "Hide" : "Show"} additional profile information
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {showSecondaryContent ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </Button>

                {/* Expandable Content */}
                <div className={cn(
                  "overflow-hidden transition-all duration-300",
                  showSecondaryContent ? "max-h-none" : "max-h-0"
                )}>
                  <div className="p-4 pt-0 border-t">
                    {secondaryContent}
                  </div>
                </div>
              </CardContent>
            </Card>
          </DesktopProfileWrapper>
        )}
      </div>
    </div>
  );
};

export default InstagramProfileLayout;