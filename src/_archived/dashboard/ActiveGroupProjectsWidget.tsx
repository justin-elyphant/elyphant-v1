import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Clock, DollarSign, Gift, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { GroupGiftProject, GroupGiftContribution } from "@/services/groupGiftPaymentService";

interface GroupProjectWithDetails extends GroupGiftProject {
  group_chat: {
    name: string;
    avatar_url?: string;
  };
  group_gift_contributions: (GroupGiftContribution & {
    profiles: {
      name: string;
      profile_image?: string;
    };
  })[];
}

const ActiveGroupProjectsWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<GroupProjectWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActiveProjects();
    }
  }, [user]);

  const fetchActiveProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('group_gift_projects')
        .select(`
          *,
          group_chats!inner(name, avatar_url),
          group_gift_contributions(
            *,
            profiles(name, profile_image)
          ),
          group_chat_members!inner(user_id)
        `)
        .eq('group_chat_members.user_id', user?.id)
        .in('status', ['collecting', 'ready_to_purchase'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Cast and format the data to match expected types
      const formattedProjects = (data || []).map(project => ({
        ...project,
        group_chat: Array.isArray(project.group_chats) && project.group_chats.length > 0 
          ? project.group_chats[0] 
          : { name: 'Unknown Group', avatar_url: null },
        group_gift_contributions: Array.isArray(project.group_gift_contributions) 
          ? project.group_gift_contributions 
          : [],
        delivery_address: project.delivery_address as any
      }));
      setProjects(formattedProjects as GroupProjectWithDetails[]);
    } catch (error) {
      console.error('Error fetching active projects:', error);
      toast.error('Failed to load active projects');
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'collecting':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'ready_to_purchase':
        return 'bg-green-500/10 text-green-600 border-green-200';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const formatDaysRemaining = (deadline?: string) => {
    if (!deadline) return null;
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Group Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Active Group Projects
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/group-chats')}
          className="text-muted-foreground hover:text-foreground"
        >
          View All
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No active group projects</p>
            <p className="text-xs mt-1">Start a group gift in your chats</p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/group-chats/${project.group_chat_id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={project.group_chat.avatar_url} />
                    <AvatarFallback>
                      {project.group_chat.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-sm">{project.project_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {project.group_chat.name}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(project.status || 'collecting')}`}
                >
                  {project.status === 'collecting' ? 'Collecting' : 'Ready'}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    ${project.current_amount || 0} / ${project.target_amount}
                  </span>
                </div>
                <Progress 
                  value={getProgressPercentage(project.current_amount || 0, project.target_amount)} 
                  className="h-2"
                />
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>{project.group_gift_contributions?.length || 0} contributors</span>
                  </div>
                  {project.purchase_deadline && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDaysRemaining(project.purchase_deadline)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveGroupProjectsWidget;