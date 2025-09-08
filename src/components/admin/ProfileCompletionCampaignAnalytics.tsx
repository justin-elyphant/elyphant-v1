import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  TrendingUp, 
  Users, 
  Clock, 
  Target,
  BarChart3,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

interface CampaignMetrics {
  totalUsersInCampaign: number;
  profileCompletionRate: number;
  emailEngagementRate: number;
  averageCompletionScore: number;
  activeEmailStages: {
    stage: string;
    count: number;
    conversionRate: number;
  }[];
}

interface EmailCampaignAnalytics {
  metrics: CampaignMetrics;
  recentActivity: {
    date: string;
    emailsSent: number;
    profileUpdates: number;
    completionImprovements: number;
  }[];
}

const ProfileCompletionCampaignAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<EmailCampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Get campaign metrics
        const { data: analyticsData, error: analyticsError } = await supabase
          .from('profile_completion_analytics')
          .select(`
            completion_score,
            email_campaign_stage,
            email_opens,
            email_clicks,
            profile_updated_after_email,
            last_email_sent_at,
            created_at
          `);

        if (analyticsError) throw analyticsError;

        // Calculate metrics
        const totalUsers = analyticsData?.length || 0;
        const usersWithCompletedProfiles = analyticsData?.filter(user => user.completion_score >= 80).length || 0;
        const usersWithEmails = analyticsData?.filter(user => user.last_email_sent_at).length || 0;
        const usersWhoEngaged = analyticsData?.filter(user => user.email_opens > 0 || user.email_clicks > 0).length || 0;
        
        const profileCompletionRate = totalUsers > 0 ? (usersWithCompletedProfiles / totalUsers) * 100 : 0;
        const emailEngagementRate = usersWithEmails > 0 ? (usersWhoEngaged / usersWithEmails) * 100 : 0;
        const averageCompletionScore = totalUsers > 0 
          ? analyticsData.reduce((acc, user) => acc + user.completion_score, 0) / totalUsers 
          : 0;

        // Group by email stages
        const stageGroups = analyticsData?.reduce((acc, user) => {
          const stage = user.email_campaign_stage || 'none';
          if (!acc[stage]) acc[stage] = [];
          acc[stage].push(user);
          return acc;
        }, {} as Record<string, any[]>) || {};

        const activeEmailStages = Object.entries(stageGroups)
          .filter(([stage]) => stage !== 'none')
          .map(([stage, users]) => ({
            stage,
            count: users.length,
            conversionRate: users.filter(u => u.profile_updated_after_email).length / users.length * 100
          }));

        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentEmails } = await supabase
          .from('email_queue')
          .select('created_at, template_id')
          .gte('created_at', sevenDaysAgo.toISOString())
          .eq('status', 'sent');

        const recentActivity = Array.from({length: 7}, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = date.toISOString().split('T')[0];
          
          const emailsOnDate = recentEmails?.filter(email => 
            email.created_at.startsWith(dateString)
          ).length || 0;

          return {
            date: dateString,
            emailsSent: emailsOnDate,
            profileUpdates: 0, // Would need additional tracking
            completionImprovements: 0 // Would need additional tracking
          };
        }).reverse();

        setAnalytics({
          metrics: {
            totalUsersInCampaign: totalUsers,
            profileCompletionRate,
            emailEngagementRate,
            averageCompletionScore,
            activeEmailStages
          },
          recentActivity
        });

      } catch (err) {
        console.error('Error fetching campaign analytics:', err);
        setError('Failed to load campaign analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error || 'No analytics data available'}</AlertDescription>
      </Alert>
    );
  }

  const { metrics, recentActivity } = analytics;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-blue-500" />
        <h2 className="text-lg font-semibold">Profile Completion Campaign Analytics</h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsersInCampaign}</div>
            <p className="text-xs text-muted-foreground">In email campaign</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.profileCompletionRate.toFixed(1)}%</div>
            <Progress value={metrics.profileCompletionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-purple-500" />
              Email Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.emailEngagementRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Opens & clicks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-500" />
              Avg. Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageCompletionScore.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Profile completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Email Campaign Stages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Campaign Stages Performance
          </CardTitle>
          <CardDescription>
            Performance of different email campaign stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.activeEmailStages.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active email campaigns yet</p>
            ) : (
              metrics.activeEmailStages.map((stage, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">
                      {stage.stage.replace('profile_reminder_', '').replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stage.count} users in this stage
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={stage.conversionRate > 50 ? 'default' : 'secondary'}>
                      {stage.conversionRate.toFixed(1)}% conversion
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Email campaign activity over the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentActivity.map((day, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="text-sm">
                  {new Date(day.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    📧 {day.emailsSent} emails
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {day.emailsSent} sent
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Alert className="bg-blue-50 border-blue-200">
        <TrendingUp className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="font-medium mb-1">Campaign Insights</div>
          <ul className="text-sm space-y-1">
            <li>• Target users with completion scores below 60% for focused campaigns</li>
            <li>• A/B test email subject lines to improve engagement rates</li>
            <li>• Follow up with users who opened emails but didn't complete profiles</li>
            <li>• Consider personalized recommendations based on missing profile elements</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ProfileCompletionCampaignAnalytics;