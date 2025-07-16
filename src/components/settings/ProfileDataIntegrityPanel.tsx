import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, ArrowRight, Info, Heart, Calendar, Users, MapPin, User, Brain, List, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFormContext } from "react-hook-form";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useProfileDataIntegrity } from "@/hooks/common/useProfileDataIntegrity";
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

const ProfileDataIntegrityPanel: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  
  // Form context might not exist (e.g., when used on dashboard)
  let form;
  try {
    form = useFormContext();
  } catch {
    form = null;
  }
  
  const {
    issues,
    isChecking,
    checkDataIntegrity,
    hasIssues,
    hasCriticalIssues,
    hasImportantIssues,
    completionScore
  } = useProfileDataIntegrity();

  // Watch form values for real-time updates (only if form context exists)
  const formValues = form?.watch();

  // Check data integrity when component mounts and when form values change
  useEffect(() => {
    // Always use the actual profile data for integrity checks
    // Form values may not have the complete address structure
    checkDataIntegrity(false, profile);
  }, [checkDataIntegrity, profile]);

  // Setup carousel API
  useEffect(() => {
    if (!api) return;
    
    setCurrent(api.selectedScrollSnap());
    
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Determine which settings tab to open based on missing data
  const getTargetSettingsTab = () => {
    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    const importantIssues = issues.filter(issue => issue.severity === 'important');
    
    // Use the targetTab from the issue if available, otherwise fallback to field-based logic
    if (criticalIssues.length > 0) {
      return criticalIssues[0].targetTab || 'basic';
    }
    if (importantIssues.length > 0) {
      return importantIssues[0].targetTab || 'basic';
    }
    
    // Fallback for any remaining issues
    const firstIssue = issues[0];
    return firstIssue?.targetTab || 'basic';
  };

  const handleCompleteProfile = () => {
    const targetTab = getTargetSettingsTab();
    navigate('/settings', { state: { activeTab: targetTab, fromDataIntegrity: true } });
  };

  const handleSpecificAction = (issue: any) => {
    if (issue.field === 'connections') {
      navigate('/connections');
    } else if (issue.field === 'wishlists') {
      navigate('/my-wishlists');
    } else {
      const targetTab = issue.targetTab || 'basic';
      navigate('/settings', { state: { activeTab: targetTab, fromDataIntegrity: true } });
    }
  };

  const getCompletionMessage = () => {
    if (completionScore >= 100) {
      return "🎉 Profile optimized for AI recommendations and auto-gifting!";
    } else if (completionScore >= 80) {
      return `Almost ready for smart gifting! (${completionScore}% optimized)`;
    } else if (completionScore >= 60) {
      return `Good progress on profile setup (${completionScore}% optimized)`;
    } else if (completionScore >= 30) {
      return `Getting started with profile setup (${completionScore}% optimized)`;
    } else {
      return `Let's set up your profile for better AI recommendations (${completionScore}% optimized)`;
    }
  };

  const getIssueIcon = (field: string) => {
    switch (field) {
      case 'important_dates': return Calendar;
      case 'interests': return Heart;
      case 'connections': return Users;
      case 'wishlists': return List;
      case 'shipping_address': return MapPin;
      case 'dob': case 'name': case 'username': case 'bio': return User;
      default: return Brain;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'important': return 'text-orange-500';
      case 'helpful': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'important': return 'default';
      case 'helpful': return 'secondary';
      default: return 'outline';
    }
  };

  // Prepare slides data
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const importantIssues = issues.filter(i => i.severity === 'important');
  const helpfulIssues = issues.filter(i => i.severity === 'helpful');

  const slides = [];

  // Slide 1: Overview (always present)
  slides.push({
    type: 'overview',
    title: 'AI-Ready Profile Status',
    content: 'overview'
  });

  // Add issue slides based on what exists
  if (criticalIssues.length > 0) {
    slides.push({
      type: 'critical',
      title: 'Critical Items',
      content: 'critical',
      issues: criticalIssues
    });
  }

  if (importantIssues.length > 0) {
    slides.push({
      type: 'important', 
      title: 'Important Items',
      content: 'important',
      issues: importantIssues
    });
  }

  if (helpfulIssues.length > 0) {
    slides.push({
      type: 'helpful',
      title: 'Helpful Items', 
      content: 'helpful',
      issues: helpfulIssues
    });
  }

  const renderSlideContent = (slide: any) => {
    if (slide.type === 'overview') {
      return (
        <div className="flex items-center justify-between h-full">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {completionScore >= 100 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : hasCriticalIssues ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : hasImportantIssues ? (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              ) : (
                <Info className="h-5 w-5 text-blue-500" />
              )}
              <h3 className="text-lg font-semibold">AI-Ready Profile Status</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {getCompletionMessage()}
            </p>
            
            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Profile Optimization</span>
                <span>{completionScore}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-500",
                    completionScore >= 100 ? "bg-green-500" :
                    completionScore >= 80 ? "bg-blue-500" :
                    completionScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${Math.min(completionScore, 100)}%` }}
                />
              </div>
            </div>
          </div>
          
          {hasIssues && (
            <Button
              onClick={handleCompleteProfile}
              className="flex items-center gap-2 ml-4"
              size="sm"
              variant={hasCriticalIssues ? "default" : "outline"}
            >
              {hasCriticalIssues ? "Fix Critical Items" : "Optimize Profile"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    }

    // Issue slides
    const { issues: slideIssues, type } = slide;
    const getSeverityConfig = (type: string) => {
      switch (type) {
        case 'critical':
          return {
            color: 'text-red-600',
            icon: AlertTriangle,
            title: 'Critical - Required for Core Features',
            bgHover: 'hover:bg-red-50'
          };
        case 'important':
          return {
            color: 'text-orange-600',
            icon: Info,
            title: 'Important - Greatly Improves AI Recommendations',
            bgHover: 'hover:bg-orange-50'
          };
        case 'helpful':
          return {
            color: 'text-blue-600',
            icon: Heart,
            title: 'Helpful - Nice to Have for Full Experience',
            bgHover: 'hover:bg-blue-50'
          };
        default:
          return {
            color: 'text-gray-600',
            icon: Info,
            title: 'Issues',
            bgHover: 'hover:bg-gray-50'
          };
      }
    };

    const config = getSeverityConfig(type);
    const Icon = config.icon;

    return (
      <div className="space-y-2">
        <h4 className={`text-sm font-semibold ${config.color} flex items-center gap-2`}>
          <Icon className="h-4 w-4" />
          {config.title}
        </h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {slideIssues.map((issue: any, index: number) => {
            const IssueIcon = getIssueIcon(issue.field);
            return (
              <Alert 
                key={`${type}-${index}`} 
                variant={type === 'critical' ? 'destructive' : 'default'}
                className={`cursor-pointer ${config.bgHover} text-sm`} 
                onClick={() => handleSpecificAction(issue)}
              >
                <IssueIcon className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{issue.issue}</div>
                    <div className="text-xs opacity-80 mt-1 line-clamp-2">{issue.aiImpact}</div>
                  </div>
                  <Badge variant={getSeverityBadgeVariant(issue.severity)} className="ml-2 shrink-0">
                    {issue.severity}
                  </Badge>
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn(
      "border-l-4",
      completionScore >= 100 ? "border-l-green-500" : 
      completionScore >= 80 ? "border-l-blue-500" :
      completionScore >= 60 ? "border-l-yellow-500" : "border-l-red-500"
    )}>
      <CardContent className="p-4">
        <Carousel className="w-full" setApi={setApi}>
          <CarouselContent>
            {slides.map((slide, index) => (
              <CarouselItem key={index}>
                <div className="h-40 flex flex-col justify-center">
                  {renderSlideContent(slide)}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        
        {/* Interactive slide indicators */}
        {slides.length > 1 && (
          <div className="flex justify-center mt-3 space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200 hover:scale-125",
                  current === index ? "bg-primary" : "bg-muted-foreground/30"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
        
        {/* Info footer for issue slides */}
        {(hasCriticalIssues || hasImportantIssues) && (
          <Alert className="bg-blue-50 border-blue-200 mt-3">
            <Brain className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-xs">
              <strong>Why this matters:</strong> A complete profile helps our AI provide personalized gift recommendations, 
              enables auto-gifting features, and ensures friends can connect with you easily.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileDataIntegrityPanel;