import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Gift, Heart, ShoppingBag, Star } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface ChatGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientId: string;
  onSendGift: (giftData: {
    type: 'wishlist' | 'marketplace' | 'quick';
    itemId: string;
    itemName: string;
    itemImage?: string;
    price?: number;
    message?: string;
  }) => void;
}

// Mock data for demo - in real app, this would come from APIs
const mockWishlistItems = [
  {
    id: "wish-1",
    name: "Wireless Headphones",
    price: 89.99,
    image: "/placeholder.svg",
    priority: "high"
  },
  {
    id: "wish-2", 
    name: "Coffee Maker",
    price: 129.99,
    image: "/placeholder.svg",
    priority: "medium"
  },
  {
    id: "wish-3",
    name: "Book: The Great Gatsby",
    price: 12.99,
    image: "/placeholder.svg", 
    priority: "low"
  }
];

const mockQuickGifts = [
  {
    id: "quick-1",
    name: "Digital Gift Card",
    price: 25.00,
    image: "/placeholder.svg",
    description: "Perfect for any occasion"
  },
  {
    id: "quick-2",
    name: "Coffee & Pastry Delivery",
    price: 18.99,
    image: "/placeholder.svg",
    description: "Fresh morning treats"
  },
  {
    id: "quick-3",
    name: "Flower Bouquet",
    price: 45.00,
    image: "/placeholder.svg",
    description: "Beautiful seasonal flowers"
  }
];

const ChatGiftModal = ({ 
  isOpen, 
  onClose, 
  recipientName, 
  recipientId,
  onSendGift 
}: ChatGiftModalProps) => {
  const [activeTab, setActiveTab] = useState<"wishlist" | "quick" | "marketplace">("wishlist");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [giftMessage, setGiftMessage] = useState("");

  const handleSendGift = () => {
    if (!selectedItem) return;

    onSendGift({
      type: activeTab,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      itemImage: selectedItem.image,
      price: selectedItem.price,
      message: giftMessage
    });

    toast.success(`Gift sent to ${recipientName}!`);
    onClose();
    setSelectedItem(null);
    setGiftMessage("");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Send a Gift to {recipientName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wishlist" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Wishlist
            </TabsTrigger>
            <TabsTrigger value="quick" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Quick Gifts
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Marketplace
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for the perfect gift..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <TabsContent value="wishlist" className="space-y-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {mockWishlistItems.map((item) => (
                  <Card 
                    key={item.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedItem?.id === item.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedItem(item)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-lg font-bold text-primary">{formatPrice(item.price)}</p>
                          <Badge className={cn("text-xs", getPriorityColor(item.priority))}>
                            {item.priority} priority
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="quick" className="space-y-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {mockQuickGifts.map((item) => (
                  <Card 
                    key={item.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedItem?.id === item.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedItem(item)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <p className="text-lg font-bold text-primary">{formatPrice(item.price)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4">
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Search our marketplace for the perfect gift
              </p>
              <Button variant="outline" className="mt-4">
                Browse Marketplace
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {selectedItem && (
          <div className="border-t pt-4">
          <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Selected:</span>
                <span className="text-primary font-bold">{formatPrice(selectedItem.price)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{selectedItem.name}</p>
              
              <Input
                placeholder="Add a personal message (optional)"
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
              />
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedItem(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendGift}
                  className="flex-1"
                >
                  Send Gift
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChatGiftModal;