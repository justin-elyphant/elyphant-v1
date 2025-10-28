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
      className="relative aspect-square cursor-pointer group overflow-hidden rounded-sm"
    >
      {/* Cover Image */}
      <img
        src={coverImage || '/placeholder.svg'}
        alt={wishlist.title}
        className="w-full h-full object-cover transition-transform group-hover:scale-110"
      />
      
      {/* Overlay on Hover */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
        <h3 className="text-white font-semibold text-sm text-center line-clamp-2 mb-1">
          {wishlist.title}
        </h3>
        <p className="text-white/80 text-xs">
          {wishlist.items.length} {wishlist.items.length === 1 ? 'item' : 'items'}
        </p>
      </div>
      
      {/* Item Count Badge (Always Visible) */}
      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
        {wishlist.items.length}
      </div>
      
      {/* Privacy Badge (Only for Own Profile) */}
      {isOwnProfile && (
        <div className="absolute top-2 left-2">
          {wishlist.is_public ? (
            <Globe className="h-4 w-4 text-green-500" />
          ) : (
            <Lock className="h-4 w-4 text-gray-500" />
          )}
        </div>
      )}
    </div>
  );
};

export default InstagramWishlistCard;
