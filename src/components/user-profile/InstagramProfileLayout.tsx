import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import CompactProfileHeader from "./CompactProfileHeader";
import SocialProductGrid from "./SocialProductGrid";

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

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Profile Header (Instagram-style) */}
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

      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-6">
        {/* Social Product Grid - Primary Focus */}
        <div className="mb-6">
          <SocialProductGrid profile={profile} isOwnProfile={isCurrentUser} />
        </div>

        {/* Expandable Secondary Content */}
        {secondaryContent && (
          <Card>
            <CardContent className="p-0">
              {/* Expandable Header */}
              <Button
                variant="ghost"
                onClick={() => setShowSecondaryContent(!showSecondaryContent)}
                className="w-full h-auto p-4 flex items-center justify-between text-left"
              >
                <div>
                  <h3 className="font-medium">{secondaryTitle}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {showSecondaryContent ? "Hide" : "Show"} additional profile information
                  </p>
                </div>
                {showSecondaryContent ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
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
        )}
      </div>
    </div>
  );
};

export default InstagramProfileLayout;