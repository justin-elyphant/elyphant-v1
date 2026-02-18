import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Users, 
  Target, 
  Clock, 
  Gift,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { type GroupGiftProject } from "@/services/groupGiftPaymentService";
import GroupGiftContributionModal from "./GroupGiftContributionModal";

interface GroupGiftProgressCardProps {
  project: GroupGiftProject;
  onUpdate?: () => void;
  showContributeButton?: boolean;
}

const GroupGiftProgressCard = ({ 
  project, 
  onUpdate,
  showContributeButton = true 
}: GroupGiftProgressCardProps) => {
  const [showContributionModal, setShowContributionModal] = useState(false);

  const progressPercentage = (project.current_amount / project.target_amount) * 100;
  const remainingAmount = Math.max(0, project.target_amount - project.current_amount);
  const paidContributions = project.group_gift_contributions?.filter(
    c => c.contribution_status === 'paid'
  ) || [];

  const getStatusBadge = () => {
    switch (project.status) {
      case 'collecting':
        return <Badge variant="default">Collecting Funds</Badge>;
      case 'ready_to_purchase':
        return <Badge variant="secondary">Ready to Purchase</Badge>;
      case 'purchased':
        return <Badge className="bg-green-500">Purchased</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-500">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-purple-500">Delivered</Badge>;
      default:
        return <Badge variant="outline">{project.status}</Badge>;
    }
  };

  const getStatusIcon = () => {
    switch (project.status) {
      case 'collecting':
        return <DollarSign className="h-4 w-4" />;
      case 'ready_to_purchase':
      case 'purchased':
        return <Gift className="h-4 w-4" />;
      case 'shipped':
      case 'delivered':
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const isFullyFunded = project.current_amount >= project.target_amount;
  const isExpired = project.purchase_deadline && new Date(project.purchase_deadline) < new Date();

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold mb-2">
                {project.project_name}
              </CardTitle>
              <div className="flex items-center gap-2">
                {getStatusBadge()}
                {isExpired && project.status === 'collecting' && (
                  <Badge variant="destructive">Expired</Badge>
                )}
              </div>
            </div>
            {project.target_product_image && (
              <img 
                src={project.target_product_image} 
                alt={project.target_product_name || project.project_name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
          </div>
          
          {project.target_product_name && (
            <p className="text-sm text-muted-foreground">
              {project.target_product_name}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Funding Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Funding Progress</span>
              <span className="font-mono">
                ${project.current_amount.toFixed(2)} / ${project.target_amount.toFixed(2)}
              </span>
            </div>
            
            <Progress 
              value={Math.min(progressPercentage, 100)} 
              className="h-3"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {isFullyFunded ? 'Goal reached!' : `$${remainingAmount.toFixed(2)} remaining`}
              </span>
              <span>{Math.round(progressPercentage)}% funded</span>
            </div>
          </div>

          {/* Contributors */}
          {paidContributions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Contributors ({paidContributions.length})
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {paidContributions.slice(0, 6).map((contribution) => (
                  <div key={contribution.id} className="flex items-center gap-1 text-xs">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={(contribution as any).profiles?.profile_image} />
                      <AvatarFallback className="text-xs">
                        {(contribution as any).profiles?.name?.substring(0, 2).toUpperCase() || 'UN'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      ${contribution.paid_amount?.toFixed(2)}
                    </span>
                  </div>
                ))}
                {paidContributions.length > 6 && (
                  <span className="text-xs text-muted-foreground">
                    +{paidContributions.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Deadline */}
          {project.purchase_deadline && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className={isExpired ? "text-destructive" : "text-muted-foreground"}>
                {isExpired 
                  ? "Deadline passed"
                  : `Deadline: ${formatDistanceToNow(new Date(project.purchase_deadline), { addSuffix: true })}`
                }
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {showContributeButton && 
             project.status === 'collecting' && 
             !isExpired && 
             !isFullyFunded && (
              <Button 
                onClick={() => setShowContributionModal(true)}
                className="flex-1"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Contribute
              </Button>
            )}
            
            {project.order_id && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Navigate to order tracking
                  window.open(`/orders/${project.order_id}`, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Track Order
              </Button>
            )}
          </div>

          {/* Status Messages */}
          {isFullyFunded && project.status === 'collecting' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <Gift className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Funding goal reached! Purchase will be processed automatically.
              </span>
            </div>
          )}
          
          {isExpired && project.status === 'collecting' && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                Contribution deadline has passed. Refunds will be processed if goal not met.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <GroupGiftContributionModal
        open={showContributionModal}
        onOpenChange={setShowContributionModal}
        project={project}
        onContributionSuccess={onUpdate}
      />
    </>
  );
};

export default GroupGiftProgressCard;