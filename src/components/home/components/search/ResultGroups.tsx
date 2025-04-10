
import React from "react";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { Check, Package, User, Calendar } from "lucide-react";
import ProductResultItem from "./ProductResultItem";

interface ResultGroupsProps {
  searchTerm: string;
  groupedResults: Record<string, any[]>;
  filteredProducts: any[];
  friendsData: { id: string; name: string }[];
  experiencesData: { id: string; name: string }[];
  onSelect: (value: string) => void;
  loading: boolean;
}

const ResultGroups = ({
  searchTerm,
  groupedResults,
  filteredProducts,
  friendsData,
  experiencesData,
  onSelect,
  loading
}: ResultGroupsProps) => {
  if (!searchTerm || loading) return null;

  // Get products from both sources - grouped results (from Zinc API) and filtered local products
  const productsToShow = [
    ...(groupedResults.products || []),
    ...filteredProducts
  ].slice(0, 4); // Limit to 4 items

  const shouldShowProducts = productsToShow.length > 0;
  const shouldShowFriends = friendsData.length > 0 && searchTerm.length > 2;
  const shouldShowExperiences = experiencesData.length > 0 && searchTerm.length > 2;

  if (!shouldShowProducts && !shouldShowFriends && !shouldShowExperiences) {
    return null;
  }

  return (
    <>
      {shouldShowProducts && (
        <CommandGroup heading="Products">
          {productsToShow.map((product) => (
            <ProductResultItem
              key={product.id}
              product={product}
              onSelect={() => onSelect(product.title || product.name)}
            />
          ))}
        </CommandGroup>
      )}

      {shouldShowFriends && (
        <CommandGroup heading="Friends">
          {friendsData
            .filter((friend) =>
              friend.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((friend) => (
              <CommandItem
                key={friend.id}
                value={friend.name}
                onSelect={() => onSelect(friend.name)}
              >
                <User className="mr-2 h-4 w-4" />
                <span>{friend.name}</span>
              </CommandItem>
            ))}
        </CommandGroup>
      )}

      {shouldShowExperiences && (
        <CommandGroup heading="Experiences">
          {experiencesData
            .filter((exp) =>
              exp.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((exp) => (
              <CommandItem
                key={exp.id}
                value={exp.name}
                onSelect={() => onSelect(exp.name)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span>{exp.name}</span>
              </CommandItem>
            ))}
        </CommandGroup>
      )}
    </>
  );
};

export default ResultGroups;
