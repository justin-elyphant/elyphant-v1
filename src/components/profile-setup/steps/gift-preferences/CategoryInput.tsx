
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface CategoryInputProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
}

const CategoryInput: React.FC<CategoryInputProps> = ({ value, onChange, onAdd }) => {
  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 space-y-2">
        <Label htmlFor="category">Gift Category, Brand, or Interest</Label>
        <Input
          id="category"
          placeholder="e.g., Books, Nike, Spa Day, Theater Tickets"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) {
              e.preventDefault();
              onAdd();
            }
          }}
        />
      </div>
      <Button type="button" size="icon" onClick={onAdd}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default CategoryInput;
