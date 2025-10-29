import React from "react";
import { Globe, Lock } from "lucide-react";
import { Wishlist } from "@/types/profile";

interface InstagramWishlistCardProps {
  wishlist: Wishlist;
  isOwnProfile: boolean;
  onClick: () => void;
}

const InstagramWishlistCard: React.FC<InstagramWishlistCardProps> = ({
  wishlist,
  isOwnProfile,
  onClick
}) => {
  const coverImage = wishlist.cover_image || wishlist.items[0]?.image_url;
  
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer group flex-shrink-0"
    >
      {/* Circular Image Container with Gradient Ring */}
      <div className="relative w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32">
        {/* Gradient Ring Border */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 p-[2px] transition-transform group-hover:scale-105">
          {/* White Ring Padding */}
          <div className="w-full h-full rounded-full bg-background p-[3px]">
            {/* Image */}
            <img
              src={coverImage || '/placeholder.svg'}
              alt={wishlist.title}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>
        
        {/* Item Count Badge */}
        <div className="absolute bottom-0 right-0 bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {wishlist.items.length}
        </div>
        
        {/* Privacy Badge (Only for Own Profile) */}
        {isOwnProfile && (
          <div className="absolute top-0 left-0 bg-background rounded-full p-1 shadow-sm">
            {wishlist.is_public ? (
              <Globe className="h-3 w-3 text-green-500" />
            ) : (
              <Lock className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        )}
      </div>
      
      {/* Title Below Circle */}
      <div className="mt-2 text-center w-24 md:w-28 lg:w-32">
        <p className="text-xs font-medium line-clamp-2 leading-tight">
          {wishlist.title}
        </p>
      </div>
    </div>
  );
};

export default InstagramWishlistCard;
