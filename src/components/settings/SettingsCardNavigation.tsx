import React from "react";
import { User, MapPin, Ruler, Calendar, Heart, Bell, Shield, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback } from "@/utils/haptics";
import { motion } from "framer-motion";

interface SettingsSection {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

const settingsSections: SettingsSection[] = [
  {
    id: "info",
    icon: User,
    title: "My Info",
    description: "Name, email, and profile picture"
  },
  {
    id: "address",
    icon: MapPin,
    title: "My Address",
    description: "Shipping address and verification"
  },
  {
    id: "sizes",
    icon: Ruler,
    title: "My Sizes",
    description: "Clothing and shoe sizes for gift recommendations"
  },
  {
    id: "events",
    icon: Calendar,
    title: "My Events",
    description: "Important dates like birthdays and anniversaries"
  },
  {
    id: "interests",
    icon: Heart,
    title: "My Interests",
    description: "Interests for personalized gift recommendations"
  },
  {
    id: "notifications",
    icon: Bell,
    title: "My Notifications",
    description: "Email and push notification preferences"
  },
  {
    id: "privacy",
    icon: Shield,
    title: "Privacy & Sharing",
    description: "Data visibility, security, and account settings"
  }
];

interface SettingsCardNavigationProps {
  onSelectSection: (sectionId: string) => void;
}

const SettingsCardNavigation: React.FC<SettingsCardNavigationProps> = ({
  onSelectSection
}) => {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Account Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, preferences, and account settings
        </p>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  "hover:shadow-md hover:border-foreground/20",
                  "min-h-[44px]"
                )}
                onClick={() => {
                  triggerHapticFeedback('selection');
                  onSelectSection(section.id);
                }}
              >
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-2 rounded-lg bg-muted">
                        <Icon className="h-5 w-5 text-foreground" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-medium">{section.title}</h3>
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SettingsCardNavigation;
