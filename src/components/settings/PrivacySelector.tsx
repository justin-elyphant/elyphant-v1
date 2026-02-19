
import React from "react";
import { Label } from "@/components/ui/label";
import { SharingLevel } from "@/types/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PrivacySelectorProps {
  value: SharingLevel;
  onChange: (value: SharingLevel) => void;
  label: string;
  description?: string;
}

const PrivacySelector = ({ value, onChange, label, description }: PrivacySelectorProps) => {
  return (
    <div className="flex justify-between items-start">
      <div>
        <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>{label}</Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <Select
        value={value}
        onValueChange={(newValue) => onChange(newValue as SharingLevel)}
      >
        <SelectTrigger className="w-[180px]" id={label.toLowerCase().replace(/\s+/g, '-')}>
          <SelectValue placeholder="Select privacy level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="private">Only Me</SelectItem>
          <SelectItem value="friends">Connections Only</SelectItem>
          <SelectItem value="public">Everyone</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default PrivacySelector;
