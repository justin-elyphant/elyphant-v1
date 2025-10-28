import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Plus, Search, Command } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Wishlist } from "@/types/profile";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";

interface WishlistSwitcherProps {
  currentWishlistId: string;
  currentWishlistTitle: string;
  onWishlistSelect?: (wishlistId: string) => void;
}

const WishlistSwitcher = ({ currentWishlistId, currentWishlistTitle, onWishlistSelect }: WishlistSwitcherProps) => {
  const navigate = useNavigate();
  const { wishlists } = useUnifiedWishlistSystem();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Keyboard shortcut: Cmd/Ctrl + K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredWishlists = React.useMemo(() => {
    if (!wishlists) return [];
    if (!searchQuery) return wishlists;

    const query = searchQuery.toLowerCase();
    return wishlists.filter(wishlist => 
      wishlist.title.toLowerCase().includes(query) ||
      wishlist.description?.toLowerCase().includes(query) ||
      wishlist.category?.toLowerCase().includes(query)
    );
  }, [wishlists, searchQuery]);

  const handleWishlistSelect = (wishlistId: string) => {
    if (onWishlistSelect) {
      onWishlistSelect(wishlistId);
    } else {
      navigate(`/wishlist/${wishlistId}`);
    }
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleCreateNew = () => {
    navigate('/wishlists');
  };

  return (
    <>
      {/* Dropdown Menu Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 max-w-[300px]">
            <span className="truncate">{currentWishlistTitle}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[300px]">
          {/* Quick Search Trigger */}
          <DropdownMenuItem onClick={() => setSearchOpen(true)} className="gap-2">
            <Search className="h-4 w-4" />
            <span>Search wishlists</span>
            <Badge variant="secondary" className="ml-auto text-xs">
              <Command className="h-3 w-3 mr-1" />K
            </Badge>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />

          {/* Recent/All Wishlists */}
          <div className="max-h-[300px] overflow-y-auto">
            {wishlists?.slice(0, 10).map(wishlist => (
              <DropdownMenuItem
                key={wishlist.id}
                onClick={() => handleWishlistSelect(wishlist.id)}
                className={wishlist.id === currentWishlistId ? 'bg-muted' : ''}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{wishlist.title}</span>
                  <Badge variant="secondary" className="ml-2">
                    {wishlist.items.length}
                  </Badge>
                </div>
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator />

          {/* Create New */}
          <DropdownMenuItem onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Create New Wishlist</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Search Dialog (Cmd+K) */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Switch Wishlist</DialogTitle>
          </DialogHeader>
          
          <div className="p-4 pt-0">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search wishlists by name, category, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-1">
              {filteredWishlists.length > 0 ? (
                filteredWishlists.map(wishlist => (
                  <Button
                    key={wishlist.id}
                    variant={wishlist.id === currentWishlistId ? 'secondary' : 'ghost'}
                    className="w-full justify-start h-auto py-3"
                    onClick={() => handleWishlistSelect(wishlist.id)}
                  >
                    <div className="flex flex-col items-start w-full">
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-medium">{wishlist.title}</span>
                        <Badge variant="secondary">
                          {wishlist.items.length} items
                        </Badge>
                      </div>
                      {wishlist.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {wishlist.description}
                        </p>
                      )}
                      {wishlist.category && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {wishlist.category}
                        </Badge>
                      )}
                    </div>
                  </Button>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No wishlists found</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCreateNew}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Wishlist
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WishlistSwitcher;
