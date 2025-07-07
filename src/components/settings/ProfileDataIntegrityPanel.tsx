import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, ArrowRight, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfileDataIntegrity } from "@/hooks/common/useProfileDataIntegrity";

const ProfileDataIntegrityPanel: React.FC = () => {
  const navigate = useNavigate();
  const {
    issues,
    isChecking,
    checkDataIntegrity,
    hasIssues,
    hasCriticalIssues
  } = useProfileDataIntegrity();

  // Automatically check data integrity when component mounts
  useEffect(() => {
    checkDataIntegrity(false);
  }, [checkDataIntegrity]);

  // Determine which settings tab to open based on missing data
  const getTargetSettingsTab = () => {
    const criticalIssues = issues.filter(issue => issue.severity === 'error');
    const nameEmailIssues = criticalIssues.filter(issue => 
      issue.field === 'name' || issue.field === 'email'
    );
    const addressIssues = issues.filter(issue => 
      issue.field === 'shipping_address'
    );
    const usernameIssues = issues.filter(issue => 
      issue.field === 'username'
    );

    if (nameEmailIssues.length > 0) return 'basic';
    if (addressIssues.length > 0) return 'address';
    if (usernameIssues.length > 0) return 'basic';
    return 'basic'; // Default to basic info tab
  };

  const handleCompleteProfile = () => {
    const targetTab = getTargetSettingsTab();
    navigate('/settings', { state: { activeTab: targetTab, fromDataIntegrity: true } });
  };

  const getCompletionMessage = () => {
    const completionPercentage = Math.round(
      ((issues.length > 0 ? Math.max(0, 5 - issues.length) : 5) / 5) * 100
    );
    
    if (completionPercentage === 100) {
      return "Your profile is complete and properly formatted";
    }
    
    return `Complete your profile to unlock all features (${completionPercentage}% complete)`;
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {hasIssues ? (
                <AlertTriangle className={`h-5 w-5 ${hasCriticalIssues ? 'text-red-500' : 'text-yellow-500'}`} />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              Profile Data Status
            </CardTitle>
            <CardDescription>
              {getCompletionMessage()}
            </CardDescription>
          </div>
          {hasIssues && (
            <Button
              onClick={handleCompleteProfile}
              className="flex items-center gap-2"
              size="sm"
            >
              Complete Your Profile
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      {hasIssues && (
        <CardContent className="space-y-3">
          {issues.map((issue, index) => (
            <Alert key={index} variant={issue.severity === 'error' ? 'destructive' : 'default'}>
              <Info className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <strong>{issue.field}:</strong> {issue.issue}
                </div>
                <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'}>
                  {issue.severity}
                </Badge>
              </AlertDescription>
            </Alert>
          ))}
          
          {hasCriticalIssues && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Some features may not work properly until these issues are resolved.
                Click "Complete Your Profile" above to fix these issues.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ProfileDataIntegrityPanel;