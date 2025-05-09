
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLazyImage } from "@/hooks/useLazyImage";
import { useIsMobile } from "@/hooks/use-mobile";

interface GiftGuide {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  items: number;
}

interface ContentCollectionProps {
  title?: string;
  description?: string;
  guides?: GiftGuide[];
  variant?: "horizontal" | "grid" | "featured";
}

const giftGuides: GiftGuide[] = [
  {
    id: "guide1",
    title: "Mother's Day Gift Guide",
    description: "Perfect gifts to show mom how much you care",
    imageUrl: "https://images.unsplash.com/photo-1607184220910-966402821997?ixlib=rb-4.0.3",
    category: "Occasions",
    items: 24
  },
  {
    id: "guide2",
    title: "Tech Lover's Must-Haves",
    description: "Cutting-edge gadgets for the tech enthusiast",
    imageUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?ixlib=rb-4.0.3",
    category: "Interest",
    items: 16
  },
  {
    id: "guide3",
    title: "Gifts Under $50",
    description: "Thoughtful presents that won't break the bank",
    imageUrl: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?ixlib=rb-4.0.3",
    category: "Budget",
    items: 32
  },
  {
    id: "guide4",
    title: "Self-Care Essentials",
    description: "Wellness products for some much-needed me-time",
    imageUrl: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?ixlib=rb-4.0.3",
    category: "Wellness",
    items: 18
  },
  {
    id: "guide5",
    title: "Graduation Celebration",
    description: "Commemorate their achievement with the perfect gift",
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3",
    category: "Occasions",
    items: 20
  }
];

const ContentMarketing = ({
  title = "Gift Guides & Collections",
  description = "Curated collections for every occasion",
  guides = giftGuides,
  variant = "grid"
}: ContentCollectionProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const handleGuideClick = (guide: GiftGuide) => {
    // Navigate to the marketplace with the guide category as search term
    navigate(`/marketplace?search=${encodeURIComponent(guide.title)}&pageTitle=${encodeURIComponent(guide.title)}`);
  };
  
  if (variant === "horizontal") {
    return (
      <div className="my-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
          <Button variant="outline" onClick={() => navigate("/marketplace?tab=guides")}>
            View All
          </Button>
        </div>
        
        <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
          {guides.map((guide) => (
            <Card 
              key={guide.id}
              onClick={() => handleGuideClick(guide)} 
              className="min-w-[260px] cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="relative h-36">
                <LazyImage src={guide.imageUrl} alt={guide.title} className="w-full h-full object-cover" />
                <Badge className="absolute top-2 left-2">{guide.category}</Badge>
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium">{guide.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{guide.description}</p>
                <p className="text-xs mt-2">{guide.items} items</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (variant === "featured") {
    // Find the first guide to feature
    const featured = guides[0];
    const otherGuides = guides.slice(1, 4); // Take next 3 guides
    
    return (
      <div className="my-8">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        {description && <p className="text-muted-foreground mb-4">{description}</p>}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Featured guide - takes up 2 columns on desktop */}
          <div 
            className="lg:col-span-2 cursor-pointer"
            onClick={() => handleGuideClick(featured)}
          >
            <div className="relative h-64 lg:h-72 rounded-lg overflow-hidden">
              <LazyImage src={featured.imageUrl} alt={featured.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <Badge className="mb-2">{featured.category}</Badge>
                <h3 className="text-xl font-bold">{featured.title}</h3>
                <p className="line-clamp-2">{featured.description}</p>
                <p className="text-sm mt-2">{featured.items} items</p>
              </div>
            </div>
          </div>
          
          {/* Side guides */}
          <div className="space-y-4">
            {otherGuides.map(guide => (
              <div 
                key={guide.id}
                onClick={() => handleGuideClick(guide)}
                className="flex cursor-pointer rounded-lg overflow-hidden border hover:shadow-sm transition-shadow"
              >
                <div className="w-1/3 relative">
                  <LazyImage src={guide.imageUrl} alt={guide.title} className="w-full h-full object-cover" />
                </div>
                <div className="w-2/3 p-3">
                  <Badge className="mb-1">{guide.category}</Badge>
                  <h3 className="font-medium line-clamp-1">{guide.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{guide.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Default grid view
  return (
    <div className="my-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        <Button variant="outline" onClick={() => navigate("/marketplace?tab=guides")}>
          View All
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {guides.map((guide) => (
          <Card 
            key={guide.id}
            onClick={() => handleGuideClick(guide)} 
            className="cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="relative h-36 sm:h-40">
              <LazyImage src={guide.imageUrl} alt={guide.title} className="w-full h-full object-cover" />
              <Badge className="absolute top-2 left-2">{guide.category}</Badge>
            </div>
            <CardContent className="p-3">
              <h3 className="font-medium">{guide.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{guide.description}</p>
              <p className="text-xs mt-2">{guide.items} items</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Helper component for lazy loading images
const LazyImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  const { src: imageSrc } = useLazyImage(src, "/placeholder.svg");
  return <img src={imageSrc} alt={alt} className={className} loading="lazy" />;
};

export default ContentMarketing;
