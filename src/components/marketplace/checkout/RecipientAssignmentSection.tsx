
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const RecipientAssignmentSection: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Recipient Assignment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Assign gifts to recipients for delivery scheduling.
        </p>
      </CardContent>
    </Card>
  );
};

export default RecipientAssignmentSection;
