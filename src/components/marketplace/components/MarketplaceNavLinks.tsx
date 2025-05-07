
import React from "react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "react-router-dom";
import { GiftOccasion } from "../utils/upcomingOccasions";

interface MarketplaceNavLinksProps {
  upcomingOccasions: GiftOccasion[];
}

const MarketplaceNavLinks: React.FC<MarketplaceNavLinksProps> = ({ upcomingOccasions }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleOccasionClick = (searchTerm: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("search", searchTerm);
    setSearchParams(params);
  };

  return (
    <div className="flex gap-6 mt-4 text-sm overflow-x-auto pb-2">
      {upcomingOccasions.map((occasion) => (
        <Button
          key={occasion.name}
          variant="link"
          className="text-muted-foreground hover:text-foreground whitespace-nowrap"
          onClick={() => handleOccasionClick(occasion.searchTerm)}
        >
          {occasion.name} Gifts
        </Button>
      ))}
      <Button variant="link" className="text-muted-foreground hover:text-foreground whitespace-nowrap">
        Home Favorites
      </Button>
      <Button variant="link" className="text-muted-foreground hover:text-foreground whitespace-nowrap">
        Fashion Finds
      </Button>
      <Button variant="link" className="text-muted-foreground hover:text-foreground whitespace-nowrap">
        Gift Cards
      </Button>
    </div>
  );
};

export default MarketplaceNavLinks;
