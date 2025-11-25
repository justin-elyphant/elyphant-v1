import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUnifiedProfile } from "@/hooks/useUnifiedProfile";
import { useConnectionsAdapter } from "@/hooks/useConnectionsAdapter";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import {
  Gift,
  User,
  Heart,
  Sparkles,
  Users,
  MapPin,
  CreditCard,
  ChevronRight,
} from "lucide-react";

const OverviewTab = () => {
  const { user } = useAuth();
  const { profile } = useUnifiedProfile();
  const { friends } = useConnectionsAdapter();
  const { wishlists } = useUnifiedWishlistSystem();
  const [autoGiftCount, setAutoGiftCount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);

  // Fetch AI gifts count
  useEffect(() => {
    if (!user) return;
    
    const fetchAutoGifts = async () => {
      const { data, error } = await supabase
        .from("auto_gifting_rules")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)
        .eq("is_active", true);
      
      if (!error && data) {
        setAutoGiftCount(data.length);
      }
    };

    fetchAutoGifts();
  }, [user]);

  // Fetch payment method
  useEffect(() => {
    if (!user) return;
    
    const fetchPaymentMethod = async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .single();
      
      if (!error && data) {
        setPaymentMethod(data);
      }
    };

    fetchPaymentMethod();
  }, [user]);

  const cards = [
    {
      title: "Upcoming AI Gifts",
      icon: Gift,
      link: "/dashboard?tab=auto-gifts",
      description: autoGiftCount > 0 
        ? `${autoGiftCount} active ${autoGiftCount === 1 ? 'rule' : 'rules'}` 
        : "No active AI gifts",
      gradient: true,
    },
    {
      title: "My Profile",
      icon: User,
      link: "/settings?tab=profile",
      description: profile?.name || "Complete your profile",
    },
    {
      title: "My Wishlists",
      icon: Heart,
      link: "/wishlists",
      description: wishlists?.length 
        ? `${wishlists.length} ${wishlists.length === 1 ? 'wishlist' : 'wishlists'}` 
        : "Create your first wishlist",
    },
    {
      title: "My Interests",
      icon: Sparkles,
      link: "/settings?tab=interests",
      description: Array.isArray(profile?.interests) && profile.interests.length > 0
        ? `${profile.interests.length} interests` 
        : "Add your interests",
    },
    {
      title: "Connections",
      icon: Users,
      link: "/connections",
      description: friends?.length 
        ? `${friends.length} ${friends.length === 1 ? 'connection' : 'connections'}` 
        : "Connect with friends",
    },
    {
      title: "Shipping Address",
      icon: MapPin,
      link: "/settings?tab=address",
      description: profile?.shipping_address && typeof profile.shipping_address === 'object' && 'address_line1' in profile.shipping_address && profile.shipping_address.address_line1
        ? `${(profile.shipping_address as any).city}, ${(profile.shipping_address as any).state}` 
        : "Add shipping address",
    },
    {
      title: "Payment Method",
      icon: CreditCard,
      link: "/settings?tab=payment",
      description: paymentMethod 
        ? `•••• ${paymentMethod.last_four}` 
        : "Add payment method",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.title}
            to={card.link}
            className="group block"
          >
            <div className="card-unified hover:shadow-md transition-all duration-200 h-full">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`flex-shrink-0 ${card.gradient ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-sky-500' : 'text-muted-foreground'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-heading-4 mb-1">{card.title}</h3>
                    <p className="text-body-sm text-muted-foreground truncate">
                      {card.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 ml-2" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default OverviewTab;
