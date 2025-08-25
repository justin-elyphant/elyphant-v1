import React from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import ProfileDataIntegrityPanel from "@/components/settings/ProfileDataIntegrityPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, User, MapPin, Heart, Calendar, Users, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { useProfileDataIntegrity } from "@/hooks/common/useProfileDataIntegrity";

const ProfileComplete = () => {
  const { completionScore, issues, hasIssues } = useProfileDataIntegrity();

  const completionSteps = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Name, email, and profile picture',
      icon: User,
      targetTab: 'basic',
      fields: ['first_name', 'last_name', 'username', 'bio']
    },
    {
      id: 'shipping',
      title: 'Shipping Address',
      description: 'Where gifts should be delivered',
      icon: MapPin,
      targetTab: 'address',
      fields: ['shipping_address']
    },
    {
      id: 'interests',
      title: 'Interests & Preferences',
      description: 'Help AI understand your tastes',
      icon: Heart,
      targetTab: 'interests',
      fields: ['interests']
    },
    {
      id: 'dates',
      title: 'Important Dates',
      description: 'Birthday and special occasions',
      icon: Calendar,
      targetTab: 'dates',
      fields: ['date_of_birth', 'important_dates']
    },
    {
      id: 'connections',
      title: 'Connect with Friends',
      description: 'Build your social network',
      icon: Users,
      href: '/connections',
      fields: ['connections']
    }
  ];

  const getStepStatus = (step: any) => {
    const stepIssues = issues.filter(issue => 
      step.fields.some(field => issue.field === field)
    );
    
    if (stepIssues.length === 0) return 'complete';
    if (stepIssues.some(issue => issue.severity === 'critical')) return 'critical';
    if (stepIssues.some(issue => issue.severity === 'important')) return 'important';
    return 'helpful';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'critical':
        return <span className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">!</span>;
      case 'important':
        return <span className="h-5 w-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">!</span>;
      default:
        return <span className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">?</span>;
    }
  };

  return (
    <SidebarLayout>
      <div className="container max-w-4xl mx-auto py-4 sm:py-8 px-3 sm:px-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Optimize your profile for better AI recommendations and auto-gifting features
          </p>
        </div>

        {/* Profile Data Integrity Panel */}
        <div className="mb-8">
          <ProfileDataIntegrityPanel />
        </div>

        {/* Completion Steps */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Profile Setup Steps</h2>
          </div>

          <div className="grid gap-4">
            {completionSteps.map((step) => {
              const status = getStepStatus(step);
              const Icon = step.icon;
              
              return (
                <Card key={step.id} className="transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-muted">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{step.title}</CardTitle>
                          <CardDescription>{step.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStepIcon(status)}
                        <Button 
                          variant={status === 'complete' ? 'outline' : 'default'}
                          size="sm"
                          asChild
                        >
                          {step.href ? (
                            <Link to={step.href}>
                              {status === 'complete' ? 'Review' : 'Complete'}
                            </Link>
                          ) : (
                            <Link to={`/settings?section=${step.targetTab}`}>
                              {status === 'complete' ? 'Review' : 'Complete'}
                            </Link>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Summary Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  Profile {completionScore}% Complete
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {completionScore >= 80 
                    ? "Great! Your profile is optimized for AI recommendations."
                    : "Complete more sections to unlock better AI features."
                  }
                </p>
                <div className="flex gap-3 justify-center">
                  <Button asChild>
                    <Link to="/dashboard">
                      Back to Dashboard
                    </Link>
                  </Button>
                  {hasIssues && (
                    <Button variant="outline" asChild>
                      <Link to="/settings">
                        Fix Remaining Issues
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ProfileComplete;