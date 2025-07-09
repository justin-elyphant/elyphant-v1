import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, ArrowRight, Info, Heart, Calendar, Users, MapPin, User, Brain, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFormContext } from "react-hook-form";
import { useProfileDataIntegrity } from "@/hooks/common/useProfileDataIntegrity";
import { cn } from "@/lib/utils";

const ProfileDataIntegrityPanel: React.FC = () => {
  const navigate = useNavigate();
  
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
    // Pass form values to integrity checker for real-time updates
    checkDataIntegrity(false, formValues);
  }, [checkDataIntegrity, formValues]);

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

  return (
    <Card className={cn(
      "border-l-4",
      completionScore >= 100 ? "border-l-green-500" : 
      completionScore >= 80 ? "border-l-blue-500" :
      completionScore >= 60 ? "border-l-yellow-500" : "border-l-red-500"
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {completionScore >= 100 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : hasCriticalIssues ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : hasImportantIssues ? (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              ) : (
                <Info className="h-5 w-5 text-blue-500" />
              )}
              AI-Ready Profile Status
            </CardTitle>
            <CardDescription className="mt-1">
              {getCompletionMessage()}
            </CardDescription>
            
            {/* Progress bar */}
            <div className="mt-3">
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
      </CardHeader>
      
      {hasIssues && (
        <CardContent className="space-y-3">
          {/* Group issues by severity */}
          {issues.filter(i => i.severity === 'critical').length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Critical - Required for Core Features
              </h4>
              {issues.filter(i => i.severity === 'critical').map((issue, index) => {
                const Icon = getIssueIcon(issue.field);
                return (
                  <Alert key={`critical-${index}`} variant="destructive" className="cursor-pointer hover:bg-red-50" onClick={() => handleSpecificAction(issue)}>
                    <Icon className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{issue.issue}</div>
                        <div className="text-sm opacity-80 mt-1">{issue.aiImpact}</div>
                      </div>
                      <Badge variant={getSeverityBadgeVariant(issue.severity)}>
                        {issue.severity}
                      </Badge>
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          )}
          
          {issues.filter(i => i.severity === 'important').length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-orange-600 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Important - Greatly Improves AI Recommendations
              </h4>
              {issues.filter(i => i.severity === 'important').map((issue, index) => {
                const Icon = getIssueIcon(issue.field);
                return (
                  <Alert key={`important-${index}`} className="cursor-pointer hover:bg-orange-50" onClick={() => handleSpecificAction(issue)}>
                    <Icon className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{issue.issue}</div>
                        <div className="text-sm text-muted-foreground mt-1">{issue.aiImpact}</div>
                      </div>
                      <Badge variant={getSeverityBadgeVariant(issue.severity)}>
                        {issue.severity}
                      </Badge>
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          )}
          
          {issues.filter(i => i.severity === 'helpful').length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-blue-600 flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Helpful - Nice to Have for Full Experience
              </h4>
              {issues.filter(i => i.severity === 'helpful').map((issue, index) => {
                const Icon = getIssueIcon(issue.field);
                return (
                  <Alert key={`helpful-${index}`} className="cursor-pointer hover:bg-blue-50" onClick={() => handleSpecificAction(issue)}>
                    <Icon className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{issue.issue}</div>
                        <div className="text-sm text-muted-foreground mt-1">{issue.aiImpact}</div>
                      </div>
                      <Badge variant={getSeverityBadgeVariant(issue.severity)}>
                        {issue.severity}
                      </Badge>
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          )}
          
          {(hasCriticalIssues || hasImportantIssues) && (
            <Alert className="bg-blue-50 border-blue-200">
              <Brain className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Why this matters:</strong> A complete profile helps our AI provide personalized gift recommendations, 
                enables auto-gifting features, and ensures friends can connect with you easily.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ProfileDataIntegrityPanel;