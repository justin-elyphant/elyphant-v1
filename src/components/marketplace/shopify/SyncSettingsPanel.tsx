
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product } from "@/contexts/ProductContext";

interface SyncSettingsProps {
  products: Product[];
  lastSyncTime: Date | null;
  syncSettings: {
    autoSync: boolean;
    markup: number;
    importImages: boolean;
    importVariants: boolean;
  };
  onSyncSettingChange: (key: string, value: any) => void;
  onSyncNow: () => void;
  isLoading: boolean;
}

const SyncSettingsPanel = ({ 
  products, 
  lastSyncTime, 
  syncSettings, 
  onSyncSettingChange, 
  onSyncNow, 
  isLoading 
}: SyncSettingsProps) => {
  
  const formatLastSyncTime = () => {
    if (!lastSyncTime) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };
  
  return (
    <>
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Products</p>
              <p className="font-medium">{products.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Sync</p>
              <p className="font-medium">{formatLastSyncTime()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Price Markup</p>
              <div className="flex items-center gap-2">
                <Select 
                  defaultValue={syncSettings.markup.toString()} 
                  onValueChange={(value) => onSyncSettingChange('markup', parseInt(value))}
                >
                  <SelectTrigger className="h-7 w-20">
                    <SelectValue placeholder="Markup" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                    <SelectItem value="40">40%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Auto-Sync</p>
              <p className="font-medium">{syncSettings.autoSync ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSyncNow} 
          disabled={isLoading}
        >
          {isLoading ? "Syncing..." : "Sync Now"}
        </Button>
        <Button variant="outline" size="sm">
          Product Settings
        </Button>
      </div>
    </>
  );
};

export default SyncSettingsPanel;
