import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RecipientAssignmentSectionProps {
  cartItems: any[];
  recipientAssignments: Record<string, any>;
  setRecipientAssignments: (assignments: Record<string, any>) => void;
  deliveryGroups: any[];
  setDeliveryGroups: (groups: any[]) => void;
}

const RecipientAssignmentSection: React.FC<RecipientAssignmentSectionProps> = ({
  cartItems,
  recipientAssignments,
  setRecipientAssignments,
  deliveryGroups,
  setDeliveryGroups
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gift Recipients</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Assign recipients for your gift items (optional)</p>
      </CardContent>
    </Card>
  );
};

export default RecipientAssignmentSection;