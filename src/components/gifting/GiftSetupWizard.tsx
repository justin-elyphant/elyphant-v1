
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowLeft, ArrowRight, Gift, User, Calendar, Heart, DollarSign, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PrefilledRecipient {
  name: string;
  relationship: string;
  connectionId?: string;
}

interface GiftSetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledRecipient?: PrefilledRecipient;
}

export const GiftSetupWizard: React.FC<GiftSetupWizardProps> = ({ 
  open, 
  onOpenChange,
  prefilledRecipient 
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  // Form state
  const [recipientName, setRecipientName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [occasion, setOccasion] = useState("");
  const [budget, setBudget] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [giftPreferences, setGiftPreferences] = useState<string[]>([]);

  // Initialize with prefilled data when modal opens
  useEffect(() => {
    if (open && prefilledRecipient) {
      setRecipientName(prefilledRecipient.name);
      setRelationship(prefilledRecipient.relationship);
      // Reset other fields for new gift
      setOccasion("");
      setBudget("");
      setSpecialRequests("");
      setGiftPreferences([]);
      setCurrentStep(2); // Skip recipient step since it's prefilled
    } else if (open && !prefilledRecipient) {
      // Reset all fields for new gift
      setRecipientName("");
      setRelationship("");
      setOccasion("");
      setBudget("");
      setSpecialRequests("");
      setGiftPreferences([]);
      setCurrentStep(1);
    }
  }, [open, prefilledRecipient]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const giftData = {
      recipientName,
      relationship,
      occasion,
      budget,
      specialRequests,
      giftPreferences,
      connectionId: prefilledRecipient?.connectionId
    };
    
    console.log("Gift setup data:", giftData);
    toast.success(`Gift setup complete! We'll find the perfect gift for ${recipientName}.`);
    onOpenChange(false);
    
    // Navigate to marketplace with gift context
    navigate(`/marketplace?gift-setup=true&recipient=${encodeURIComponent(recipientName)}&occasion=${encodeURIComponent(occasion)}&budget=${budget}`);
  };

  const togglePreference = (preference: string) => {
    setGiftPreferences(prev => 
      prev.includes(preference) 
        ? prev.filter(p => p !== preference)
        : [...prev, preference]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return recipientName.trim() && relationship;
      case 2:
        return occasion;
      case 3:
        return budget;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-600" />
            Gift Setup Wizard
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i + 1 <= currentStep 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div className={`w-8 h-1 mx-1 ${
                  i + 1 < currentStep ? 'bg-purple-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Recipient Details */}
        {currentStep === 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Who is this gift for?</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipient-name">Recipient Name</Label>
                  <Input
                    id="recipient-name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Enter recipient's name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="relationship">Your Relationship</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="family">Family Member</SelectItem>
                      <SelectItem value="spouse">Spouse/Partner</SelectItem>
                      <SelectItem value="colleague">Colleague</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Occasion */}
        {currentStep === 2 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">What's the occasion?</h3>
              </div>
              
              <Select value={occasion} onValueChange={setOccasion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an occasion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="anniversary">Anniversary</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="graduation">Graduation</SelectItem>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="just-because">Just Because</SelectItem>
                  <SelectItem value="thank-you">Thank You</SelectItem>
                  <SelectItem value="congratulations">Congratulations</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              
              {prefilledRecipient && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700">
                    🎁 Sending a gift to <strong>{prefilledRecipient.name}</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Budget */}
        {currentStep === 3 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">What's your budget?</h3>
              </div>
              
              <Select value={budget} onValueChange={setBudget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-25">Under $25</SelectItem>
                  <SelectItem value="25-50">$25 - $50</SelectItem>
                  <SelectItem value="50-100">$50 - $100</SelectItem>
                  <SelectItem value="100-200">$100 - $200</SelectItem>
                  <SelectItem value="200-500">$200 - $500</SelectItem>
                  <SelectItem value="over-500">Over $500</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Final Details */}
        {currentStep === 4 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Any special requests?</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="special-requests">Special Requests (Optional)</Label>
                  <Textarea
                    id="special-requests"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any specific preferences, colors, styles, or other details..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label>Gift Categories of Interest</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['Tech', 'Books', 'Fashion', 'Home', 'Sports', 'Art', 'Food', 'Experience'].map(pref => (
                      <Badge
                        key={pref}
                        variant={giftPreferences.includes(pref) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => togglePreference(pref)}
                      >
                        {pref}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || (prefilledRecipient && currentStep === 2)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          {currentStep < totalSteps ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed()}>
              <Gift className="h-4 w-4 mr-2" />
              Find Gifts
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
