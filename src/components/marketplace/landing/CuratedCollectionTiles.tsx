import React from "react";
import { useNavigate } from "react-router-dom";
import { triggerHapticFeedback } from "@/utils/haptics";
import { motion } from "framer-motion";

export interface CollectionTile {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  navigateTo: string;
}

export const TILES: CollectionTile[] = [
  {
    id: "gifts-for-her",
    title: "Gifts for Her",
    subtitle: "Thoughtfully curated picks",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80",
    navigateTo: "/marketplace?giftsForHer=true",
  },
  {
    id: "gifts-for-him",
    title: "Gifts for Him",
    subtitle: "Something for every guy",
    image: "https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?w=800&q=80",
    navigateTo: "/marketplace?giftsForHim=true",
  },
  {
    id: "under-50",
    title: "Under $50",
    subtitle: "Great gifts, great prices",
    image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=80",
    navigateTo: "/marketplace?giftsUnder50=true",
  },
  {
    id: "luxury",
    title: "Luxury Gifts",
    subtitle: "Premium selections",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    navigateTo: "/marketplace?luxuryCategories=true",
  },
];

const CuratedCollectionTiles: React.FC = () => {
  const navigate = useNavigate();

  const handleTileClick = (tile: CollectionTile) => {
    triggerHapticFeedback('light');
    navigate(tile.navigateTo);
  };

  return (
    <section className="space-y-6 mb-12">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        Shop by Collection
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {TILES.map((tile) => (
          <motion.button
            key={tile.id}
            onClick={() => handleTileClick(tile)}
            className="relative aspect-[3/4] md:aspect-[3/4] lg:aspect-[3/4] rounded-lg overflow-hidden group touch-manipulation text-left"
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <img
              src={tile.image}
              alt={tile.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            {/* Text */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
              <h3 className="text-lg md:text-xl font-semibold text-white mb-0.5">
                {tile.title}
              </h3>
              <p className="text-sm text-white/80">{tile.subtitle}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
};

export default CuratedCollectionTiles;
