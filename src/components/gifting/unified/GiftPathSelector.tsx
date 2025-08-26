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
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", className)}>
      {/* AI Autopilot Path */}
      <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-emerald-500/5" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white">
              <Brain className="h-6 w-6" />
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
              Recommended
            </Badge>
          </div>
          <CardTitle className="text-xl">AI Autopilot</CardTitle>
          <CardDescription className="text-base">
            Set it and forget it - AI handles everything
          </CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Nicole AI finds perfect gifts</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Auto-schedules based on events</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Approval notifications before purchase</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Budget management & tracking</span>
            </div>
          </div>
          
          <div className="pt-2">
            <Button 
              onClick={() => onSelectPath('ai-autopilot')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Set Up Auto-Gifting
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            Perfect for busy people who never want to miss an occasion
          </div>
        </CardContent>
      </Card>

      {/* Manual Control Path */}
      <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-yellow-500/5" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <Badge variant="outline">
              Traditional
            </Badge>
          </div>
          <CardTitle className="text-xl">Manual Control</CardTitle>
          <CardDescription className="text-base">
            Browse, choose, and schedule yourself
          </CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-orange-500" />
              <span>Browse marketplace products</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-orange-500" />
              <span>Full control over gift selection</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-orange-500" />
              <span>Schedule delivery during checkout</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-orange-500" />
              <span>Traditional shopping experience</span>
            </div>
          </div>
          
          <div className="pt-2">
            <Button 
              onClick={() => onSelectPath('manual-control')}
              variant="outline"
              className="w-full border-orange-200 hover:bg-orange-50"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Browse Marketplace
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            Ideal for those who enjoy the shopping experience
          </div>
        </CardContent>
      </Card>
    </div>
  );
};