
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface Category {
  label: string;
  logoUrl?: string;
  emoji?: string;
}

interface CategorySectionProps {
  title: string;
  description: string;
  categories: (string | Category)[];
  onSelect: (category: string) => void;
  renderPrefix?: (category: string | Category) => React.ReactNode;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  description,
  categories,
  onSelect,
  renderPrefix
}) => {
  const getCategoryLabel = (category: string | Category): string => {
    return typeof category === 'string' ? category : category.label;
  };

  const getLogoUrl = (category: string | Category): string | undefined => {
    return typeof category === 'string' ? undefined : category.logoUrl;
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex flex-wrap gap-2 mt-2">
        {categories.map((category, index) => {
          const label = getCategoryLabel(category);
          const logoUrl = getLogoUrl(category);
          
          return (
            <Badge
              key={index}
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-1 py-1.5"
              onClick={() => onSelect(label)}
            >
              {renderPrefix && renderPrefix(category)}
              
              {logoUrl ? (
                <div className="flex items-center gap-1.5">
                  <img 
                    src={logoUrl} 
                    alt={label} 
                    className="h-3.5 w-auto max-w-[20px] object-contain" 
                  />
                  <span className="text-xs">{label}</span>
                </div>
              ) : (
                <span>{label}</span>
              )}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySection;
