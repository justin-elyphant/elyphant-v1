import React from "react";
import { useNavigate } from "react-router-dom";
import { triggerHapticFeedback } from "@/utils/haptics";
import { motion } from "framer-motion";
import StandardBreadcrumb, { BreadcrumbItem } from "@/components/shared/StandardBreadcrumb";
import { type CollectionTile } from "./CuratedCollectionTiles";

interface CategoryLandingHeaderProps {
  title: string;
  subtitle?: string;
  productCount: number;
  breadcrumbs: BreadcrumbItem[];
  siblingCollections?: CollectionTile[];
  currentCollectionId?: string;
}

const CategoryLandingHeader: React.FC<CategoryLandingHeaderProps> = ({
  title,
  subtitle,
  productCount,
  breadcrumbs,
  siblingCollections,
  currentCollectionId,
}) => {
  const navigate = useNavigate();

  const handleTileClick = (tile: CollectionTile) => {
    triggerHapticFeedback("light");
    navigate(tile.navigateTo);
  };

  // Filter out the current collection from siblings
  const visibleSiblings = siblingCollections?.filter(
    (tile) => tile.id !== currentCollectionId
  );

  return (
    <div className="mb-8 pt-6">
      <StandardBreadcrumb items={breadcrumbs} className="mb-3" />

      <h1 className="text-3xl font-bold text-foreground mb-1">{title}</h1>

      {subtitle && (
        <p className="text-lg text-muted-foreground mb-1">{subtitle}</p>
      )}

      <p className="text-sm text-muted-foreground mb-4">
        {productCount} {productCount === 1 ? "product" : "products"} found
      </p>

      {/* Horizontal sibling collection carousel – Quick Pick categories only */}
      {visibleSiblings && visibleSiblings.length > 0 && (
        <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="flex gap-3 w-max">
            {visibleSiblings.map((tile) => (
              <motion.button
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                className="relative w-36 md:w-44 aspect-[3/4] rounded-lg overflow-hidden group touch-manipulation text-left flex-shrink-0"
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <img
                  src={tile.image}
                  alt={tile.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-sm md:text-base font-semibold text-white mb-0.5">
                    {tile.title}
                  </h3>
                  <p className="text-xs text-white/80">{tile.subtitle}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryLandingHeader;
