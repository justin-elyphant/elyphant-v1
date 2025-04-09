
import React from "react";
import { Link } from "react-router-dom";
import { 
  User, 
  MessageCircle, 
  Share2, 
  Settings, 
  Edit 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface ProfileBannerProps {
  userData: any;
  isCurrentUser: boolean;
  isFollowing: boolean;
  onFollow: () => void;
  onShare: () => void;
}

const ProfileBanner = ({ 
  userData, 
  isCurrentUser, 
  isFollowing, 
  onFollow, 
  onShare 
}: ProfileBannerProps) => {
  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-36 sm:h-48 rounded-t-lg relative mb-16">
      {/* Profile image */}
      <div className="absolute -bottom-12 sm:-bottom-16 left-4 sm:left-8">
        <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-white">
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
      <div className="absolute bottom-4 right-4 flex flex-wrap gap-2 justify-end max-w-[70%]">
        {isCurrentUser ? (
          <>
            <Button size="sm" variant="secondary" asChild>
              <Link to="/settings">
                <Edit className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Edit Profile</span>
              </Link>
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button 
              size="sm" 
              variant={isFollowing ? "secondary" : "default"}
              onClick={onFollow}
              className={isFollowing ? "" : "bg-purple-600 hover:bg-purple-700"}
            >
              {isFollowing ? (
                <>
                  <User className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Following</span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Follow</span>
                </>
              )}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Message</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <div className="p-4">
                  <h2 className="text-lg font-bold mb-2">Message Feature</h2>
                  <p>Messaging functionality coming soon!</p>
                </div>
              </DialogContent>
            </Dialog>
            <Button size="sm" variant="outline" onClick={onShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileBanner;
