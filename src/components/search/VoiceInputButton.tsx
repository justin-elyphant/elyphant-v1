
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

interface VoiceInputButtonProps {
  isListening: boolean;
  onVoiceInput: () => void;
  mobile?: boolean;
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  isListening,
  onVoiceInput,
  mobile = false
}) => {
  if (!mobile) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={`absolute right-12 h-8 w-8 p-0 touch-manipulation min-h-[44px] min-w-[44px] ${
        isListening ? 'text-red-500' : 'text-gray-500'
      }`}
      onClick={onVoiceInput}
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
};

export default VoiceInputButton;
