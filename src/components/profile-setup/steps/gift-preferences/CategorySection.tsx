
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getSuggestedCategories, CATEGORIES } from './utils';
import ImportanceSelector from './ImportanceSelector';
import { GiftPreference } from '@/types/profile';

interface CategorySectionProps {
  selectedPreferences: GiftPreference[];
  onAddPreference: (preference: GiftPreference) => void;
  onRemovePreference: (category: string) => void;
  onUpdateImportance: (category: string, importance: 'low' | 'medium' | 'high') => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  selectedPreferences,
  onAddPreference,
  onRemovePreference,
  onUpdateImportance,
}) => {
  const [customCategory, setCustomCategory] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);

  const suggestedCategories = getSuggestedCategories();
  const displayCategories = showAllCategories ? CATEGORIES : suggestedCategories;
  
  // Filter out categories that are already selected
  const selectedCategoryNames = selectedPreferences.map(pref => pref.category);
  const availableCategories = displayCategories.filter(
    category => !selectedCategoryNames.includes(category)
  );

  const handleAddCustomCategory = () => {
    if (customCategory.trim() && !selectedCategoryNames.includes(customCategory.trim())) {
      onAddPreference({
        category: customCategory.trim(),
        importance: 'medium'
      });
      setCustomCategory('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Selected Categories</h3>
        {selectedPreferences.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories selected yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedPreferences.map((pref) => (
              <div key={pref.category} className="flex items-center bg-muted p-2 rounded-md">
                <span>{pref.category}</span>
                <ImportanceSelector
                  value={pref.importance}
                  onChange={(importance) => onUpdateImportance(pref.category, importance)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemovePreference(pref.category)}
                  className="h-8 w-8 p-0 ml-2"
                >
                  &times;
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Suggested Categories</h3>
        <div className="flex flex-wrap gap-2">
          {availableCategories.map((category) => (
            <Badge
              key={category}
              variant="outline"
              className="px-3 py-1 cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => onAddPreference({ category, importance: 'medium' })}
            >
              {category}
            </Badge>
          ))}
          {!showAllCategories && (
            <Button
              variant="link"
              size="sm"
              className="mt-1"
              onClick={() => setShowAllCategories(true)}
            >
              Show more...
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Add Custom Category</h3>
        <div className="flex space-x-2">
          <Input
            placeholder="Enter custom category"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={handleAddCustomCategory}>Add</Button>
        </div>
      </div>
    </div>
  );
};

export default CategorySection;
