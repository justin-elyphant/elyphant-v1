
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface PastEventsFiltersProps {
  filterYear: string;
  setFilterYear: (year: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  availableYears: string[];
  availableTypes: string[];
}

const PastEventsFilters = ({
  filterYear,
  setFilterYear,
  filterType,
  setFilterType,
  searchTerm,
  setSearchTerm,
  availableYears,
  availableTypes,
}: PastEventsFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search events or people..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <Select value={filterYear} onValueChange={setFilterYear}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years</SelectItem>
          {availableYears.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filterType} onValueChange={setFilterType}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Event Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {availableTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PastEventsFilters;
