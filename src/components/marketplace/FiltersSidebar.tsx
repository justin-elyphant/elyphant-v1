
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCategoryFilters } from "./hooks/utils/categoryUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FiltersSidebarProps {
  onFilterChange?: (filters: Record<string, any>) => void;
}

const FiltersSidebar = ({ onFilterChange }: FiltersSidebarProps) => {
  const location = useLocation();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [categoryFilters, setCategoryFilters] = useState<Record<string, any>>({});
  
  // Get category from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get("category");
    
    // Get category-specific filters
    const availableFilters = getCategoryFilters(categoryParam);
    setCategoryFilters(availableFilters);
    
    // Initialize filters with default values
    const initialFilters: Record<string, any> = {};
    Object.keys(availableFilters).forEach(key => {
      const filter = availableFilters[key];
      if (filter.type === 'select' || filter.type === 'range') {
        initialFilters[key] = 'all';
      } else if (filter.type === 'checkbox') {
        initialFilters[key] = [];
      } else if (filter.type === 'toggle') {
        initialFilters[key] = false;
      }
    });
    
    setFilters(initialFilters);
  }, [location.search]);
  
  const handleFilterChange = (filterType: string, value: any) => {
    const updatedFilters = { ...filters, [filterType]: value };
    setFilters(updatedFilters);
    
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };
  
  const handleCheckboxChange = (filterType: string, option: string, checked: boolean) => {
    const currentValues = filters[filterType] || [];
    const updatedValues = checked 
      ? [...currentValues, option]
      : currentValues.filter((val: string) => val !== option);
    
    handleFilterChange(filterType, updatedValues);
  };
  
  const handlePriceChange = (values: number[]) => {
    setPriceRange(values as [number, number]);
    handleFilterChange('price', { min: values[0], max: values[1] });
  };
  
  const handlePriceInputChange = (type: 'min' | 'max', value: string) => {
    const numValue = parseInt(value) || 0;
    const newRange = type === 'min' 
      ? [numValue, priceRange[1]] as [number, number]
      : [priceRange[0], numValue] as [number, number];
    
    setPriceRange(newRange);
    handleFilterChange('price', { min: newRange[0], max: newRange[1] });
  };
  
  const clearAllFilters = () => {
    // Reset to initial values
    const initialFilters: Record<string, any> = {};
    Object.keys(categoryFilters).forEach(key => {
      const filter = categoryFilters[key];
      if (filter.type === 'select' || filter.type === 'range') {
        initialFilters[key] = 'all';
      } else if (filter.type === 'checkbox') {
        initialFilters[key] = [];
      } else if (filter.type === 'toggle') {
        initialFilters[key] = false;
      }
    });
    
    setFilters(initialFilters);
    setPriceRange([0, 1000]);
    
    if (onFilterChange) {
      onFilterChange(initialFilters);
    }
  };
  
  const renderFilter = (key: string, filter: any) => {
    switch (filter.type) {
      case 'select':
        return (
          <div className="mb-4" key={key}>
            <h3 className="font-medium mb-2">{filter.label}</h3>
            <Select 
              value={filters[key] || 'all'} 
              onValueChange={(value) => handleFilterChange(key, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Select ${filter.label}`} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="mb-4" key={key}>
            <h3 className="font-medium mb-2">{filter.label}</h3>
            <div className="space-y-2">
              {filter.options.map((option: any) => (
                <div className="flex items-center space-x-2" key={option.value}>
                  <Checkbox 
                    id={`${key}-${option.value}`} 
                    checked={filters[key]?.includes(option.value)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(key, option.value, checked as boolean)
                    }
                  />
                  <Label htmlFor={`${key}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'toggle':
        return (
          <div className="mb-4" key={key}>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={key} 
                checked={filters[key] || false}
                onCheckedChange={(checked) => handleFilterChange(key, checked)}
              />
              <Label htmlFor={key}>{filter.label}</Label>
            </div>
          </div>
        );
      
      case 'range':
        if (key === 'price') {
          return (
            <div className="mb-4" key={key}>
              <h3 className="font-medium mb-2">{filter.label} Range</h3>
              <Slider 
                defaultValue={[0, 1000]} 
                max={1000} 
                step={10} 
                value={priceRange}
                onValueChange={handlePriceChange}
                className="my-4"
              />
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  placeholder="Min" 
                  value={priceRange[0]}
                  onChange={(e) => handlePriceInputChange('min', e.target.value)}
                  className="w-full"
                />
                <span>to</span>
                <Input 
                  type="number" 
                  placeholder="Max" 
                  value={priceRange[1]}
                  onChange={(e) => handlePriceInputChange('max', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          );
        }
        return (
          <div className="mb-4" key={key}>
            <h3 className="font-medium mb-2">{filter.label}</h3>
            <Select 
              value={filters[key] || 'all'} 
              onValueChange={(value) => handleFilterChange(key, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Select ${filter.label}`} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  const hasActiveFilters = Object.values(filters).some(value => {
    if (Array.isArray(value) && value.length > 0) return true;
    if (typeof value === 'object' && value !== null) return true;
    if (value !== 'all' && value !== false) return true;
    return false;
  });
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Filters</CardTitle>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(categoryFilters).map(([key, filter]) => renderFilter(key, filter))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FiltersSidebar;
