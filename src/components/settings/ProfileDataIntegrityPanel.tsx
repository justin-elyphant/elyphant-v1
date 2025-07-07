import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, RefreshCw, Info } from "lucide-react";
import { useProfileDataIntegrity } from "@/hooks/common/useProfileDataIntegrity";

const ProfileDataIntegrityPanel: React.FC = () => {
  const {
    issues,
    isChecking,
    checkDataIntegrity,
    refreshData,
    hasIssues,
    hasCriticalIssues
  } = useProfileDataIntegrity();

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
              {hasIssues
                ? `${issues.length} issue(s) detected with your profile data`
                : "Your profile data is complete and properly formatted"
              }
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => checkDataIntegrity(true)}
              disabled={isChecking}
            >
              {isChecking ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Check
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
            >
              Refresh Data
            </Button>
          </div>
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
                Critical issues detected. Some features may not work properly until these are resolved.
                Please update your profile information or contact support if you need assistance.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ProfileDataIntegrityPanel;