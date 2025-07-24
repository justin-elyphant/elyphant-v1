import React from "react";
import { useUnifiedDataIntegrity } from "@/hooks/useUnifiedDataIntegrity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UnifiedDataIntegrityExample() {
  const {
    isValidating,
    hasIssues,
    issues,
    hasWarnings,
    warnings,
    validateDataConsistency,
    fixIssues,
    refresh,
    clearCache
  } = useUnifiedDataIntegrity({
    autoValidateOnMount: true,
    showToasts: true
  });

  const handleValidate = async () => {
    await validateDataConsistency({ showToasts: true });
  };

  const handleAutoFix = async () => {
    await fixIssues();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Data Integrity Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${hasIssues ? 'bg-destructive' : 'bg-primary'}`} />
          <span>{hasIssues ? 'Issues Found' : 'All Good'}</span>
        </div>

        {hasIssues && (
          <div className="space-y-2">
            <h4 className="font-medium">Issues:</h4>
            {issues.map((issue, index) => (
              <p key={index} className="text-sm text-muted-foreground">{issue}</p>
            ))}
          </div>
        )}

        {hasWarnings && (
          <div className="space-y-2">
            <h4 className="font-medium">Warnings:</h4>
            {warnings.map((warning, index) => (
              <p key={index} className="text-sm text-muted-foreground">{warning}</p>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleValidate} 
            disabled={isValidating}
            size="sm"
          >
            {isValidating ? "Validating..." : "Check"}
          </Button>
          
          <Button 
            onClick={handleAutoFix} 
            disabled={isValidating || !hasIssues}
            variant="outline"
            size="sm"
          >
            Auto Fix
          </Button>
          
          <Button 
            onClick={refresh} 
            variant="ghost"
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}