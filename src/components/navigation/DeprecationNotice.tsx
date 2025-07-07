import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface DeprecationNoticeProps {
  component: string;
  replacement: string;
  message?: string;
}

const DeprecationNotice: React.FC<DeprecationNoticeProps> = ({ 
  component, 
  replacement, 
  message 
}) => {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-amber-900">Component Deprecated</CardTitle>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            Legacy
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-amber-700">
          <strong>{component}</strong> has been deprecated and replaced with <strong>{replacement}</strong>.
          {message && (
            <>
              <br />
              <span className="mt-2 block">{message}</span>
            </>
          )}
        </CardDescription>
      </CardContent>
    </Card>
  );
};

export default DeprecationNotice;