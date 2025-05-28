
import React from "react";
import { Link } from "react-router-dom";
import { 
  User, 
  MessageCircle, 
  Share2, 
  Settings, 
  Edit,
  MapPin,
  Calendar,
  Users
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ConnectionStatusIndicator from "@/components/messaging/ConnectionStatusIndicator";
import { formatDate } from "@/utils/date-formatting";

interface ProfileBannerProps {
  userData: any;
  isCurrentUser: boolean;
  isFollowing: boolean;
  onFollow: () => void;
  onShare: () => void;
  userStatus?: { status: "online" | "offline" | "away"; lastSeen?: string };
}

const ProfileBanner = ({ 
  userData, 
  isCurrentUser, 
  isFollowing, 
  onFollow, 
  onShare,
  userStatus
}: ProfileBannerProps) => {
  const getInitials = (name?: string): string => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Cover Image */}
      <div className="h-48 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 relative">
        {/* Action buttons overlay */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isCurrentUser ? (
            <>
              <Button size="sm" variant="secondary" asChild className="backdrop-blur-sm bg-white/90">
                <Link to="/settings">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
              <Button size="sm" variant="secondary" asChild className="backdrop-blur-sm bg-white/90">
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button 
                size="sm" 
                variant={isFollowing ? "secondary" : "default"}
                onClick={onFollow}
                className={isFollowing ? "backdrop-blur-sm bg-white/90" : "bg-purple-600 hover:bg-purple-700"}
              >
                <User className="h-4 w-4 mr-2" />
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary" className="backdrop-blur-sm bg-white/90">
                    <MessageCircle className="h-4 w-4 mr-2" />
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
              <Button size="sm" variant="secondary" onClick={onShare} className="backdrop-blur-sm bg-white/90">
                <Share2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-6 pb-6">
        {/* Avatar and Basic Info */}
        <div className="flex items-end justify-between -mt-16 mb-4">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
              {userData?.profile_image ? (
                <AvatarImage src={userData.profile_image} alt={userData?.name} />
              ) : (
                <AvatarFallback className="bg-purple-100 text-purple-600 text-3xl">
                  {getInitials(userData?.name)}
                </AvatarFallback>
              )}
            </Avatar>
            {/* Status indicator */}
            {userStatus && (
              <div className="absolute bottom-2 right-2">
                <ConnectionStatusIndicator 
                  status={userStatus.status}
                  lastSeen={userStatus.lastSeen}
                  size="lg"
                  className="bg-white rounded-full p-1"
                />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-center">
            <div>
              <div className="text-2xl font-bold">127</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </div>
            <div>
              <div className="text-2xl font-bold">256</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
            <div>
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm text-muted-foreground">Wishlists</div>
            </div>
          </div>
        </div>

        {/* Name and Bio */}
        <div className="space-y-2">
          <div>
            <h1 className="text-2xl font-bold">{userData?.name}</h1>
            {userData?.username && (
              <p className="text-muted-foreground">@{userData.username}</p>
            )}
          </div>
          
          {userData?.bio && (
            <p className="text-gray-700 max-w-2xl">{userData.bio}</p>
          )}

          {/* Quick Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
            {userData?.shipping_address?.city && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{userData.shipping_address.city}, {userData.shipping_address.state}</span>
              </div>
            )}
            
            {userData?.dob && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Born {formatDate(userData.dob)}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Joined January 2024</span>
            </div>
          </div>

          {/* Interest Badges */}
          {userData?.gift_preferences && userData.gift_preferences.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3">
              {userData.gift_preferences.slice(0, 5).map((pref: any, index: number) => (
                <Badge key={index} variant="secondary" className="bg-purple-50 text-purple-700">
                  {typeof pref === 'string' ? pref : pref.category}
                </Badge>
              ))}
              {userData.gift_preferences.length > 5 && (
                <Badge variant="outline">+{userData.gift_preferences.length - 5} more</Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileBanner;
