import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SmartInput } from "@/components/ui/smart-input";
import { Check, ArrowRight, Plus } from "lucide-react";
import { useProfileUpdate } from "@/contexts/profile/useProfileUpdate";
import { toast } from "sonner";
import { COMMON_INTERESTS } from "@/constants/commonInterests";

interface QuickInterestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const QUICK_INTERESTS = [
  "Technology",
  "Sports", 
  "Fashion",
  "Cooking",
  "Travel",
  "Fitness",
  "Music",
  "Gaming"
];

const QuickInterestsModal: React.FC<QuickInterestsModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateProfile } = useProfileUpdate();

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const isDuplicateInterest = (interest: string) => {
    return selectedInterests.some(existing => 
      existing.toLowerCase().replace(/\s+/g, '') === interest.toLowerCase().replace(/\s+/g, '')
    );
  };

  const addCustomInterest = () => {
    const trimmedInterest = newInterest.trim();
    if (trimmedInterest && !isDuplicateInterest(trimmedInterest)) {
      setSelectedInterests(prev => [...prev, trimmedInterest]);
      setNewInterest("");
      // Show confirmation toast
      toast.success(`Added "${trimmedInterest}" to your interests!`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomInterest();
    }
  };

  const handleSkip = () => {
    onClose();
    onComplete();
  };

  const handleContinue = async () => {
    if (selectedInterests.length === 0) {
      handleSkip();
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({ interests: selectedInterests });
      toast.success(`Added ${selectedInterests.length} interests to your profile!`);
      onClose();
      onComplete();
    } catch (error) {
      console.error('Error saving interests:', error);
      toast.error('Failed to save interests. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md mx-auto"
        aria-describedby="quick-interests-description"
      >
        <DialogHeader className="text-center space-y-3">
          <DialogTitle className="text-heading-2 text-foreground">
            Quick Setup
          </DialogTitle>
          <div id="quick-interests-description">
            <p className="text-body text-muted-foreground">
              Pick a few interests to get better gift recommendations
            </p>
            <p className="text-body-sm text-muted-foreground mt-1">
              You can always add more later in settings
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Interest Selection Grid */}
          <div className="grid grid-cols-2 gap-3">
            {QUICK_INTERESTS.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <Button
                  key={interest}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className={`
                    h-auto py-3 px-4 relative transition-all duration-200
                    ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/50'}
                  `}
                  onClick={() => toggleInterest(interest)}
                >
                  <span className="text-center">
                    {interest}
                  </span>
                  {isSelected && (
                    <Check className="h-4 w-4 absolute top-2 right-2" />
                  )}
                </Button>
              );
            })}
          </div>

          {/* Custom Interest Input */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <SmartInput
                  value={newInterest}
                  onChange={setNewInterest}
                  onKeyDown={handleKeyPress}
                  placeholder="Add a new interest (brands, hobbies, etc.)"
                  suggestions={COMMON_INTERESTS}
                  showSpellingSuggestions={true}
                  className="w-full"
                />
              </div>
              <Button
                type="button"
                onClick={addCustomInterest}
                disabled={!newInterest.trim() || isDuplicateInterest(newInterest.trim())}
                size="sm"
                className="px-3"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Selected interests count */}
          {selectedInterests.length > 0 && (
            <div className="flex justify-center">
              <Badge variant="secondary" className="text-body-sm">
                {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
              </Badge>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={handleContinue}
              disabled={isSubmitting}
              className="w-full touch-target-44"
            >
              {isSubmitting ? (
                "Saving..."
              ) : selectedInterests.length > 0 ? (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                "Skip for now"
              )}
            </Button>

            {selectedInterests.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickInterestsModal;