import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Gift, Users, Heart, Baby, Plus, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Connection, RelationshipType } from "@/types/connections";
import { getRelationshipIcon, getRelationshipLabel } from "./RelationshipUtils";
import { AutoGiftToggle } from "./AutoGiftToggle";
import { Sparkles } from "lucide-react";
import PersonalizedGiftIntentModal from "@/components/gifting/PersonalizedGiftIntentModal";
import QuickGiftIdeasModal from "@/components/gifting/QuickGiftIdeasModal";
import AutoGiftSetupFlow from "@/components/gifting/auto-gift/AutoGiftSetupFlow";
import { AutoGiftStatusBadge } from "./AutoGiftStatusBadge";
import { useAutoGiftPermission } from "@/hooks/useAutoGiftPermission";

interface FriendCardProps {
  friend: Connection;
  onRelationshipChange: (connectionId: string, newRelationship: RelationshipType, customValue?: string) => void;
  onAutoGiftToggle: (connectionId: string, enabled: boolean) => void;
  onCardClick?: (connection: Connection) => void;
}

const FriendCard: React.FC<FriendCardProps> = ({ friend, onRelationshipChange, onAutoGiftToggle, onCardClick }) => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [showGiftIntentModal, setShowGiftIntentModal] = useState(false);
  const [showQuickIdeasModal, setShowQuickIdeasModal] = useState(false);
  const [showAutoGiftSetup, setShowAutoGiftSetup] = useState(false);
  
  // Auto-gift permission checking
  const { permissionResult, loading: permissionLoading } = useAutoGiftPermission(friend);

  const handleViewDetailsClick = () => {
    console.group('🔍 [FriendCard] View Details Debug Information');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('👤 Current User:', {
      id: profile?.id,
      name: profile?.name,
      username: profile?.username
    });
    console.log('🔗 Friend Object (Complete):', friend);
    console.log('📊 Friend Properties Analysis:', {
      id: friend.id,
      name: friend.name,
      username: friend.username,
      imageUrl: friend.imageUrl,
      type: friend.type,
      relationship: friend.relationship,
      customRelationship: friend.customRelationship,
      dataStatus: friend.dataStatus,
      interests: friend.interests,
      bio: friend.bio,
      mutualFriends: friend.mutualFriends,
      lastActive: friend.lastActive,
      connectionDate: friend.connectionDate,
      isPending: friend.isPending,
      recipientEmail: friend.recipientEmail
    });
    console.log('🚩 Potential Issues:', {
      nameIsUnknown: friend.name.includes('Unknown'),
      usernameIsGeneric: friend.username.includes('@unknown'),
      missingProfileImage: friend.imageUrl === '/placeholder.svg',
      noInterests: !friend.interests || friend.interests.length === 0,
      noBio: !friend.bio
    });
    console.log('🧭 Navigation Details:', {
      targetRoute: `/connection/${friend.id}`,
      connectionId: friend.id
    });
    console.groupEnd();
    
    // Navigate to profile with connection context
    navigate(`/profile/${friend.id}?context=connection`);
  };

  const handleGiftIntentSelect = (intent: "ai-gift" | "marketplace-browse" | "quick-ideas") => {
    switch (intent) {
      case "ai-gift":
        setShowAutoGiftSetup(true);
        break;
      case "marketplace-browse":
        navigate(`/marketplace?friend=${friend.id}&name=${encodeURIComponent(friend.name)}&mode=nicole&open=true&greeting=friend-gift&first_name=${encodeURIComponent(friend.name)}`);
        break;
      case "quick-ideas":
        setShowQuickIdeasModal(true);
        break;
    }
  };

  return (
    <>
      <Card 
        key={friend.id} 
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onCardClick?.(friend)}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={friend.imageUrl} alt={friend.name} />
                <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{friend.name}</CardTitle>
                  {/* Auto-Gift Status Badge - Next to name like a verified badge */}
                  {permissionResult && !permissionLoading && (
                    <AutoGiftStatusBadge status={permissionResult.status} className="text-[10px] px-1.5 py-0.5 h-4" />
                  )}
                  {/* Gift Badge - Shows if connection has pending gift */}
                  {(friend as any).hasPendingGift && (
                    <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0.5 h-4">
                      <Sparkles className="h-2.5 w-2.5" />
                      Gift
                    </Badge>
                  )}
                </div>
                <CardDescription>{friend.username}</CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  {getRelationshipIcon(friend.relationship)}
                  <span>{getRelationshipLabel(friend.relationship, friend.customRelationship)}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem 
                  onClick={() => onRelationshipChange(friend.id, 'friend')}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" /> Friend
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onRelationshipChange(friend.id, 'spouse')}
                  className="gap-2"
                >
                  <Heart className="h-4 w-4" /> Spouse
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onRelationshipChange(friend.id, 'cousin')}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" /> Cousin
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onRelationshipChange(friend.id, 'child')}
                  className="gap-2"
                >
                  <Baby className="h-4 w-4" /> Child
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    const custom = prompt('Enter custom relationship:');
                    if (custom) onRelationshipChange(friend.id, 'custom', custom);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" /> Custom
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pb-0">
          {friend.bio && (
            <p className="text-sm mb-3">{friend.bio}</p>
          )}
          
          {friend.interests && friend.interests.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {friend.interests.map(interest => (
                <Badge key={interest} variant="secondary" className="text-xs">{interest}</Badge>
              ))}
            </div>
          )}
          
          <p className="text-sm text-muted-foreground mb-1">
            <span className="font-medium">{friend.mutualFriends}</span> mutual connections
          </p>
          <p className="text-xs text-muted-foreground mb-3">Active {friend.lastActive}</p>
          
          <AutoGiftToggle
            connectionName={friend.name}
            connectionId={friend.id}
            isEnabled={permissionResult?.isAutoGiftEnabled ?? false}
            isLoading={permissionLoading}
            onToggle={onAutoGiftToggle}
          />
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <Button variant="outline" size="sm" onClick={handleViewDetailsClick}>
            View Profile
          </Button>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/messages/${friend.id}`}>
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Message
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send a message to {friend.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowGiftIntentModal(true)}
                  >
                    <Gift className="h-4 w-4 mr-1" />
                    Gift
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send a gift to {friend.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardFooter>
      </Card>

      {/* Personalized Gift Intent Modal */}
      <PersonalizedGiftIntentModal
        open={showGiftIntentModal}
        onOpenChange={setShowGiftIntentModal}
        connection={friend}
        onIntentSelect={handleGiftIntentSelect}
      />

      {/* Quick Gift Ideas Modal */}
      <QuickGiftIdeasModal
        open={showQuickIdeasModal}
        onOpenChange={setShowQuickIdeasModal}
        connection={friend}
      />

      {/* Auto-Gift Setup Flow */}
      <AutoGiftSetupFlow 
        open={showAutoGiftSetup}
        onOpenChange={setShowAutoGiftSetup}
        recipientId={friend.id}
      />
    </>
  );
};

export default FriendCard;
