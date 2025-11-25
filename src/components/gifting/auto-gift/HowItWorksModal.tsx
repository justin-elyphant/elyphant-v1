import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Brain, 
  ShoppingBag, 
  Package, 
  Heart,
  CheckCircle
} from "lucide-react";

interface HowItWorksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ open, onOpenChange }) => {
  const steps = [
    {
      icon: Calendar,
      title: "Set Up Your Schedule",
      description: "Choose a recipient and occasion (birthday, anniversary, holiday). Set your budget and gift preferences once.",
      badge: "Step 1"
    },
    {
      icon: Brain,
      title: "AI Learns Preferences",
      description: "Our AI analyzes their wishlist, interests, sizes, and past gifts to understand what they'll love.",
      badge: "Step 2"
    },
    {
      icon: ShoppingBag,
      title: "Smart Gift Selection",
      description: "7 days before the occasion, our AI selects the perfect gift within your budget and sends you an approval notification.",
      badge: "Step 3"
    },
    {
      icon: CheckCircle,
      title: "Review & Approve",
      description: "Review the AI's selection via email or app. Approve with one click, or swap for an alternative suggestion.",
      badge: "Step 4"
    },
    {
      icon: Package,
      title: "Automatic Delivery",
      description: "Once approved, we handle payment, shipping, and tracking. The gift arrives on time with your personal message.",
      badge: "Step 5"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6">
          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-purple-600 to-sky-500 text-white border-0">
              AI GIFTING
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-bold">How AI Gifting Works</DialogTitle>
          <p className="text-muted-foreground">
            Set it up once, and we'll handle gift-giving for that person forever—automatically.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-sky-500 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {step.badge}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg space-y-4">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">Wishlist Priority</h4>
              <p className="text-sm text-muted-foreground">
                We prioritize items from their wishlist to ensure they get exactly what they want.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">Budget Control</h4>
              <p className="text-sm text-muted-foreground">
                Set spending limits per occasion. Our AI finds the perfect gift within your budget range.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">Full Control</h4>
              <p className="text-sm text-muted-foreground">
                You approve every gift before it ships. Pause, edit, or cancel rules anytime.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksModal;
