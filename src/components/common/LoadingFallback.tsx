import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LoadingFallbackProps {
  type?: 'dashboard' | 'list' | 'card' | 'form' | 'marketplace';
  count?: number;
  className?: string;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  type = 'card', 
  count = 3,
  className = "" 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'dashboard':
        return (
          <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="text-center space-y-2">
              <Skeleton className="h-8 w-64 mx-auto" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
            
            {/* Action Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-6" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="p-4">
                    <Skeleton className="h-8 w-12 mx-auto mb-2" />
                    <Skeleton className="h-3 w-20 mx-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
        
      case 'marketplace':
        return (
          <div className={`space-y-6 ${className}`}>
            {/* Search Bar */}
            <Skeleton className="h-12 w-full" />
            
            {/* Filters */}
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
            
            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
        
      case 'list':
        return (
          <div className={`space-y-3 ${className}`}>
            {[...Array(count)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        );
        
      case 'form':
        return (
          <div className={`space-y-4 ${className}`}>
            {[...Array(count)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <Skeleton className="h-10 w-32" />
          </div>
        );
        
      default: // 'card'
        return (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
            {[...Array(count)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        );
    }
  };

  return renderSkeleton();
};

export default LoadingFallback;