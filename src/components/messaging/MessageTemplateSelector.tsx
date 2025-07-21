
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MessageTemplateSelectorProps {
  selectedTemplate: string;
  onTemplateSelect: (template: string) => void;
  customMessage: string;
  onCustomMessageChange: (message: string) => void;
}

const MESSAGE_TEMPLATES = [
  "Thought you might like this!",
  "Perfect for your wishlist!",
  "Found this gift idea for you",
  "Check this out!",
  "This reminded me of you"
];

const MessageTemplateSelector = ({
  selectedTemplate,
  onTemplateSelect,
  customMessage,
  onCustomMessageChange
}: MessageTemplateSelectorProps) => {
  const isCustomSelected = selectedTemplate === 'custom';

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Message</Label>
      
      <div className="grid grid-cols-1 gap-2">
        {MESSAGE_TEMPLATES.map((template) => (
          <Button
            key={template}
            variant={selectedTemplate === template ? "default" : "outline"}
            size="sm"
            className="justify-start text-left h-auto py-2 px-3"
            onClick={() => onTemplateSelect(template)}
          >
            {template}
          </Button>
        ))}
        
        <Button
          variant={isCustomSelected ? "default" : "outline"}
          size="sm"
          className="justify-start text-left h-auto py-2 px-3"
          onClick={() => onTemplateSelect('custom')}
        >
          Custom message...
        </Button>
      </div>

      {isCustomSelected && (
        <Textarea
          placeholder="Write your custom message..."
          value={customMessage}
          onChange={(e) => onCustomMessageChange(e.target.value)}
          className="mt-2"
          rows={3}
        />
      )}
    </div>
  );
};

export default MessageTemplateSelector;
