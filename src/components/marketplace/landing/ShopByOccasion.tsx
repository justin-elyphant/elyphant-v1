import React from "react";
import { useNavigate } from "react-router-dom";
import { triggerHapticFeedback } from "@/utils/haptics";
import { motion } from "framer-motion";
import { Gift, Heart, PartyPopper, Baby, Sparkles, Calendar } from "lucide-react";

interface Occasion {
  id: string;
  label: string;
  icon: React.ElementType;
  searchTerm: string;
}

const OCCASIONS: Occasion[] = [
  { id: "birthday", label: "Birthday", icon: PartyPopper, searchTerm: "birthday gifts" },
  { id: "anniversary", label: "Anniversary", icon: Heart, searchTerm: "anniversary gifts" },
  { id: "valentines", label: "Valentine's Day", icon: Heart, searchTerm: "valentines day gifts" },
  { id: "wedding", label: "Wedding", icon: Sparkles, searchTerm: "wedding gifts" },
  { id: "baby-shower", label: "Baby Shower", icon: Baby, searchTerm: "baby shower gifts" },
  { id: "just-because", label: "Just Because", icon: Gift, searchTerm: "just because gifts" },
];

const ShopByOccasion: React.FC = () => {
  const navigate = useNavigate();

  const handleOccasionClick = (occasion: Occasion) => {
    triggerHapticFeedback('light');
    navigate(`/marketplace?search=${encodeURIComponent(occasion.searchTerm)}`);
  };

  return (
    <section className="space-y-6 mb-12">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        Shop by Occasion
      </h2>
      <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {OCCASIONS.map((occasion) => {
          const Icon = occasion.icon;
          return (
            <motion.button
              key={occasion.id}
              onClick={() => handleOccasionClick(occasion)}
              className="flex flex-col items-center justify-center gap-2 p-4 min-h-[80px] rounded-lg border border-border bg-background shadow-sm touch-manipulation transition-colors hover:bg-muted"
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs md:text-sm font-medium text-foreground text-center leading-tight">
                {occasion.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};

export default ShopByOccasion;
