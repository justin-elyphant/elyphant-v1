
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface NotificationPreferences {
  priceDrops: boolean;
  newArrivals: boolean;
  recommendations: boolean;
}

interface NotificationPreferencesProps {
  notifications: NotificationPreferences;
  onChange: (key: keyof NotificationPreferences, value: boolean) => void;
}

const NotificationPreferences = ({ notifications, onChange }: NotificationPreferencesProps) => {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Notification Preferences</h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="price-drops" 
            checked={notifications.priceDrops}
            onCheckedChange={(checked) => 
              onChange('priceDrops', checked as boolean)
            }
          />
          <label htmlFor="price-drops" className="text-sm">
            Price drop alerts
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="new-arrivals" 
            checked={notifications.newArrivals}
            onCheckedChange={(checked) => 
              onChange('newArrivals', checked as boolean)
            }
          />
          <label htmlFor="new-arrivals" className="text-sm">
            New arrivals in my interests
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="recommendations" 
            checked={notifications.recommendations}
            onCheckedChange={(checked) => 
              onChange('recommendations', checked as boolean)
            }
          />
          <label htmlFor="recommendations" className="text-sm">
            Weekly recommendations
          </label>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
