
import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BioSectionProps {
  bio: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const BioSection = ({ bio, onChange }: BioSectionProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="bio">Bio</Label>
      <Textarea
        id="bio"
        name="bio"
        placeholder="Tell us about yourself and what you're interested in..."
        rows={4}
        value={bio}
        onChange={onChange}
      />
    </div>
  );
};

export default BioSection;
