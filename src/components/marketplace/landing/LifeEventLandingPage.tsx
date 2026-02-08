import React from "react";
import { useNavigate } from "react-router-dom";
import { triggerHapticFeedback } from "@/utils/haptics";
import { motion } from "framer-motion";
import { FullBleedSection } from "@/components/layout/FullBleedSection";
import { Button } from "@/components/ui/button";

interface SubCollection {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  searchTerm: string;
}

interface LifeEventConfig {
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaLabel: string;
  ctaSearchTerm: string;
  collections: SubCollection[];
}

const LIFE_EVENT_CONFIGS: Record<"wedding" | "baby", LifeEventConfig> = {
  wedding: {
    heroImage:
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80",
    heroTitle: "Wedding Gift Shop",
    heroSubtitle: "Find the perfect gift for every wedding moment",
    ctaLabel: "Shop All Wedding Gifts",
    ctaSearchTerm: "wedding gifts",
    collections: [
      {
        id: "all-wedding",
        title: "All Items",
        subtitle: "Browse everything",
        image:
          "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80",
        searchTerm: "wedding gifts",
      },
      {
        id: "bride-groom",
        title: "Bride & Groom",
        subtitle: "Gifts for the happy couple",
        image:
          "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80",
        searchTerm: "wedding gifts bride groom",
      },
      {
        id: "bridal-party",
        title: "Bridal Party",
        subtitle: "Thank your wedding crew",
        image:
          "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80",
        searchTerm: "bridesmaid groomsmen gifts",
      },
      {
        id: "registry-favorites",
        title: "Registry Favorites",
        subtitle: "Classic registry picks",
        image:
          "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
        searchTerm: "wedding registry kitchen home",
      },
      {
        id: "wedding-decor",
        title: "Wedding Décor",
        subtitle: "Elegant touches & details",
        image:
          "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=800&q=80",
        searchTerm: "wedding decorations centerpieces",
      },
      {
        id: "honeymoon",
        title: "Honeymoon",
        subtitle: "Travel-ready essentials",
        image:
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
        searchTerm: "honeymoon travel luggage couples",
      },
    ],
  },
  baby: {
    heroImage:
      "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1600&q=80",
    heroTitle: "Baby Gift Shop",
    heroSubtitle: "Everything for the newest arrival",
    ctaLabel: "Shop All Baby Gifts",
    ctaSearchTerm: "baby gifts",
    collections: [
      {
        id: "all-baby",
        title: "All Items",
        subtitle: "Browse everything",
        image:
          "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=80",
        searchTerm: "baby gifts",
      },
      {
        id: "baby-essentials",
        title: "Baby Essentials",
        subtitle: "Must-haves for new parents",
        image:
          "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80",
        searchTerm: "baby essentials must haves",
      },
      {
        id: "diapers-wipes",
        title: "Diapers & Wipes",
        subtitle: "Stock up on the basics",
        image:
          "https://images.unsplash.com/photo-1584839404054-c29ddb387edf?w=800&q=80",
        searchTerm: "baby diapers wipes pampers huggies",
      },
      {
        id: "top-baby-brands",
        title: "Top Baby Brands",
        subtitle: "Trusted names parents love",
        image:
          "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&q=80",
        searchTerm: "baby products fisher price graco",
      },
      {
        id: "nursery-decor",
        title: "Nursery Décor",
        subtitle: "Create a cozy space",
        image:
          "https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=800&q=80",
        searchTerm: "baby nursery decor crib bedding",
      },
      {
        id: "baby-clothing",
        title: "Baby Clothing",
        subtitle: "Tiny outfits & shoes",
        image:
          "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&q=80",
        searchTerm: "baby clothes onesies shoes",
      },
    ],
  },
};

interface LifeEventLandingPageProps {
  category: "wedding" | "baby";
}

const LifeEventLandingPage: React.FC<LifeEventLandingPageProps> = ({
  category,
}) => {
  const navigate = useNavigate();
  const config = LIFE_EVENT_CONFIGS[category];

  const handleCtaClick = () => {
    triggerHapticFeedback("light");
    navigate(`/marketplace?search=${encodeURIComponent(config.ctaSearchTerm)}&category=${category}`);
  };

  const handleTileClick = (collection: SubCollection) => {
    triggerHapticFeedback("light");
    navigate(`/marketplace?search=${encodeURIComponent(collection.searchTerm)}&category=${category}`);
  };

  return (
    <div className="-mx-4 -mt-6">
      {/* Full-bleed Hero */}
      <FullBleedSection
        height="large"
        contentPadding={false}
        className="relative"
      >
        <img
          src={config.heroImage}
          alt={config.heroTitle}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        {/* Gradient overlay – stronger on left for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/25" />

        <div className="relative z-10 flex flex-col justify-end h-full px-6 pb-12 md:px-12 md:pb-16 max-w-[1400px] mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight">
            {config.heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-6 max-w-lg">
            {config.heroSubtitle}
          </p>
          <div>
            <Button
              onClick={handleCtaClick}
              size="lg"
              className="bg-white text-foreground hover:bg-white/90 font-semibold px-8 rounded-full shadow-lg"
            >
              {config.ctaLabel}
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
            {config.collections.map((collection) => (
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
    </div>
  );
};

export default LifeEventLandingPage;
