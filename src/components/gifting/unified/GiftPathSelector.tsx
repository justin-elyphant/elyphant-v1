import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, ShoppingBag, Zap, Clock, CheckCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface GiftPathSelectorProps {
  onSelectPath: (path: 'ai-autopilot' | 'manual-control') => void;
  className?: string;
}

export const GiftPathSelector: React.FC<GiftPathSelectorProps> = ({ 
  onSelectPath, 
  className 
}) => {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6", className)}>
      {/* AI Autopilot Path */}
      <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group touch-manipulation mobile-card">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-emerald-500/5" />
        <CardHeader className="relative p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white">
              <Brain className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
              Recommended
            </Badge>
          </div>
          <CardTitle className="text-lg md:text-xl">AI Autopilot</CardTitle>
          <CardDescription className="text-sm md:text-base">
            Set it and forget it - AI handles everything
          </CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-3 md:space-y-4 p-4 md:p-6">
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-emerald-500 flex-shrink-0" />
              <span>Nicole AI finds perfect gifts</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-emerald-500 flex-shrink-0" />
              <span>Auto-schedules based on events</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-emerald-500 flex-shrink-0" />
              <span>Approval notifications before purchase</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-emerald-500 flex-shrink-0" />
              <span>Budget management & tracking</span>
            </div>
          </div>
          
          <div className="pt-2">
            <Button 
              onClick={() => onSelectPath('ai-autopilot')}
              className="w-full min-h-[44px] bg-elyphant-gradient text-white hover:opacity-90 marketplace-touch-target text-sm md:text-base"
            >
              <Zap className="h-4 w-4 mr-2" />
              Schedule Gifts
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground text-center hidden md:block">
            Perfect for busy people who never want to miss an occasion
          </div>
        </CardContent>
      </Card>

      {/* Manual Control Path */}
      <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group touch-manipulation mobile-card">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-yellow-500/5" />
        <CardHeader className="relative p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white">
              <ShoppingBag className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <Badge variant="outline" className="text-xs">
              Traditional
            </Badge>
          </div>
          <CardTitle className="text-lg md:text-xl">Manual Control</CardTitle>
          <CardDescription className="text-sm md:text-base">
            Browse, choose, and schedule yourself
          </CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-3 md:space-y-4 p-4 md:p-6">
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-orange-500 flex-shrink-0" />
              <span>Browse marketplace products</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-orange-500 flex-shrink-0" />
              <span>Full control over gift selection</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-orange-500 flex-shrink-0" />
              <span>Schedule delivery during checkout</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-orange-500 flex-shrink-0" />
              <span>Traditional shopping experience</span>
            </div>
          </div>
          
          <div className="pt-2">
            <Button 
              onClick={() => onSelectPath('manual-control')}
              variant="outline"
              className="w-full min-h-[44px] border-orange-200 hover:bg-orange-50 marketplace-touch-target text-sm md:text-base"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Browse Marketplace
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground text-center hidden md:block">
            Ideal for those who enjoy the shopping experience
          </div>
        </CardContent>
      </Card>
    </div>
  );
};