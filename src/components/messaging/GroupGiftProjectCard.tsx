import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gift, DollarSign, Users, Calendar, Package } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { GroupGiftProject } from "@/services/groupGiftService";
import { formatPrice } from "@/lib/utils";

interface GroupGiftProjectCardProps {
  project: GroupGiftProject;
  onContribute?: (projectId: string) => void;
  onViewDetails?: (projectId: string) => void;
  showActions?: boolean;
}

const GroupGiftProjectCard = ({ 
  project, 
  onContribute, 
  onViewDetails, 
  showActions = true 
}: GroupGiftProjectCardProps) => {
  const progressPercentage = Math.min((project.current_amount / project.target_amount) * 100, 100);
  const remainingAmount = Math.max(project.target_amount - project.current_amount, 0);
  const contributorCount = project.contributions?.length || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'collecting':
        return 'bg-blue-500';
      case 'ready_to_purchase':
        return 'bg-green-500';
      case 'purchased':
        return 'bg-purple-500';
      case 'shipped':
        return 'bg-orange-500';
      case 'delivered':
        return 'bg-emerald-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'collecting':
        return 'Collecting Contributions';
      case 'ready_to_purchase':
        return 'Ready to Purchase';
      case 'purchased':
        return 'Purchased';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Gift className="h-8 w-8 text-primary" />
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(project.status)}`} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{project.project_name}</h3>
                {project.recipient_name && (
                  <p className="text-sm text-muted-foreground">
                    For {project.recipient_name}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {getStatusText(project.status)}
            </Badge>
          </div>

          {/* Product Info */}
          {project.target_product_name && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              {project.target_product_image && (
                <img 
                  src={project.target_product_image} 
                  alt={project.target_product_name}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">{project.target_product_name}</p>
                {project.target_product_price && (
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(project.target_product_price)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">
                {formatPrice(project.current_amount)} / {formatPrice(project.target_amount)}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progressPercentage.toFixed(0)}% funded</span>
              {remainingAmount > 0 && (
                <span>{formatPrice(remainingAmount)} remaining</span>
              )}
            </div>
          </div>

          {/* Contributors & Deadline */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{contributorCount} contributor{contributorCount !== 1 ? 's' : ''}</span>
              </div>
              {project.coordinator && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={project.coordinator.profile_image} alt={project.coordinator.name} />
                    <AvatarFallback className="text-xs">
                      {project.coordinator.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground">by {project.coordinator.name}</span>
                </div>
              )}
            </div>
            
            {project.purchase_deadline && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDistanceToNow(new Date(project.purchase_deadline), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>

          {/* Contributors List */}
          {project.contributions && project.contributions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Contributors</h4>
              <div className="grid grid-cols-2 gap-2">
                {project.contributions.map(contribution => (
                  <div key={contribution.id} className="flex items-center gap-2 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={contribution.contributor?.profile_image} alt={contribution.contributor?.name} />
                      <AvatarFallback className="text-xs">
                        {contribution.contributor?.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate flex-1">{contribution.contributor?.name}</span>
                    <span className="font-medium">${contribution.committed_amount.toFixed(0)}</span>
                    <Badge 
                      variant={contribution.contribution_status === 'paid' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {contribution.contribution_status === 'paid' ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && project.status === 'collecting' && (
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => onContribute?.(project.id)}
                className="flex-1"
                size="sm"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Contribute
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onViewDetails?.(project.id)}
                size="sm"
              >
                Details
              </Button>
            </div>
          )}

          {/* Order Link */}
          {project.order_id && project.status !== 'collecting' && (
            <Button 
              variant="outline" 
              onClick={() => onViewDetails?.(project.id)}
              className="w-full"
              size="sm"
            >
              <Package className="h-4 w-4 mr-2" />
              View Order & Tracking
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupGiftProjectCard;