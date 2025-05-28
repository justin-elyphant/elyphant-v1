
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Search, Users } from "lucide-react";
import { useWishlists } from "@/components/gifting/hooks/useWishlists";
import { Wishlist } from "@/types/profile";

interface WishlistShareButtonProps {
  onShareWishlist: (wishlist: Wishlist) => void;
}

const WishlistShareButton = ({ onShareWishlist }: WishlistShareButtonProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { wishlists } = useWishlists();

  const filteredWishlists = wishlists.filter(wishlist =>
    wishlist.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWishlistSelect = (wishlist: Wishlist) => {
    onShareWishlist(wishlist);
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <Heart className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search wishlists to share..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredWishlists.length > 0 ? (
              filteredWishlists.map((wishlist) => (
                <Card 
                  key={wishlist.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleWishlistSelect(wishlist)}
                >
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                        <Heart className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{wishlist.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {wishlist.items?.length || 0} items
                        </p>
                        {wishlist.is_public && (
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600">Public</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                {searchTerm ? "No wishlists found" : "No wishlists available"}
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default WishlistShareButton;
