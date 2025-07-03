
import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ConnectionFilters } from "@/types/connection-filters";
import { RelationshipType } from "@/types/connections";

interface FilterOptionsProps {
  filters: ConnectionFilters;
  onFiltersChange: (filters: ConnectionFilters) => void;
}

const FilterOptions: React.FC<FilterOptionsProps> = ({ filters, onFiltersChange }) => {
  const clearFilters = () => {
    onFiltersChange({
      relationship: 'all',
      verificationStatus: 'all'
    });
  };
  
  const hasActiveFilters = 
    filters.relationship !== 'all' || 
    filters.verificationStatus !== 'all';
  
  const getFilterCount = () => {
    let count = 0;
    if (filters.relationship !== 'all') count++;
    if (filters.verificationStatus !== 'all') count++;
    return count;
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          Filters
          {getFilterCount() > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {getFilterCount()}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium">Filter Connections</h4>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-1">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Relationship Type</Label>
            <RadioGroup 
              value={filters.relationship} 
              onValueChange={(value) => onFiltersChange({...filters, relationship: value as RelationshipType | 'all'})}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="rel-all" />
                <Label htmlFor="rel-all">All relationships</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="friend" id="rel-friend" />
                <Label htmlFor="rel-friend">Friends</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spouse" id="rel-spouse" />
                <Label htmlFor="rel-spouse">Spouse</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cousin" id="rel-cousin" />
                <Label htmlFor="rel-cousin">Cousin</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="child" id="rel-child" />
                <Label htmlFor="rel-child">Child</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="rel-custom" />
                <Label htmlFor="rel-custom">Custom</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Separator />
          
          <div>
            <Label className="text-sm font-medium mb-2 block">Verification Status</Label>
            <RadioGroup 
              value={filters.verificationStatus} 
              onValueChange={(value) => onFiltersChange({...filters, verificationStatus: value as 'verified' | 'incomplete' | 'all'})}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="ver-all" />
                <Label htmlFor="ver-all">All statuses</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="verified" id="ver-verified" />
                <Label htmlFor="ver-verified">Fully verified</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="incomplete" id="ver-incomplete" />
                <Label htmlFor="ver-incomplete">Incomplete data</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilterOptions;
