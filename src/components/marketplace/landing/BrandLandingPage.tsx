import React from "react";
import { useNavigate } from "react-router-dom";
import { triggerHapticFeedback } from "@/utils/haptics";
import { motion } from "framer-motion";
import { FullBleedSection } from "@/components/layout/FullBleedSection";
import { Button } from "@/components/ui/button";
import BrandAllItems from "./BrandAllItems";
import { BrandData, BrandSubCollection } from "@/constants/brandData";

interface BrandLandingPageProps {
  brand: BrandData;
}

const BrandLandingPage: React.FC<BrandLandingPageProps> = ({ brand }) => {
  const navigate = useNavigate();

  const handleCtaClick = () => {
    triggerHapticFeedback("light");
    navigate(`/marketplace?search=${encodeURIComponent(brand.searchTerm)}&title=${encodeURIComponent(brand.name)}`);
  };

  const handleTileClick = (collection: BrandSubCollection) => {
    triggerHapticFeedback("light");
    const titleParam = encodeURIComponent(collection.title);
    navigate(`/marketplace?search=${encodeURIComponent(collection.searchTerm)}&title=${titleParam}`);
  };

  return (
    <div className="-mx-4 -mt-6">
      {/* Full-bleed Hero */}
      <FullBleedSection height="large" contentPadding={false} className="relative">
        <img
          src={brand.heroImage}
          alt={brand.heroTagline}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/25" />

        <div className="relative z-10 flex flex-col justify-end h-full pt-20 px-6 pb-12 md:px-12 md:pb-16 max-w-[1400px] mx-auto">
          {/* Brand Logo */}
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl shadow-lg flex items-center justify-center p-3 mb-4">
            <img
              src={brand.logo}
              alt={`${brand.name} logo`}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight">
            {brand.heroTagline}
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-6 max-w-lg">
            {brand.description}
          </p>
          <div>
            <Button
              onClick={handleCtaClick}
              size="lg"
              className="bg-white text-foreground hover:bg-white/90 font-semibold px-8 rounded-full shadow-lg"
            >
              {brand.ctaText}
            </Button>
          </div>
        </div>
      </FullBleedSection>

      {/* Sub-Collection Carousel */}
      <section className="px-4 md:px-6 max-w-[1400px] mx-auto mt-10 mb-12">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6">
          Shop the Collection
        </h2>

        <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="flex gap-3 md:gap-4 w-max">
            {brand.collections.map((collection) => (
              <motion.button
                key={collection.id}
                onClick={() => handleTileClick(collection)}
                className="relative w-40 md:w-52 aspect-[3/4] rounded-lg overflow-hidden group touch-manipulation text-left flex-shrink-0"
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <img
                  src={collection.image}
                  alt={collection.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-base md:text-lg font-semibold text-white mb-0.5">
                    {collection.title}
                  </h3>
                  <p className="text-xs md:text-sm text-white/80">
                    {collection.subtitle}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* All Brand Items Grid */}
      <BrandAllItems brandName={brand.name} brandSearchTerm={brand.searchTerm} />
    </div>
  );
};

export default BrandLandingPage;
