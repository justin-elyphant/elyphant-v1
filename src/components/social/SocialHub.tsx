
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle, Calendar, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useActivityFeed } from "@/hooks/useActivityFeed";

const SocialHub = () => {
  const navigate = useNavigate();
  const { activities, connectionStats, loading } = useActivityFeed(5);

  return (
    <div className="space-y-6">
      {/* Social Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Social Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700">{connectionStats.accepted}</div>
              <div className="text-sm text-blue-600">Connected Friends</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <MessageCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">{activities.filter(a => a.type === 'message').length}</div>
              <div className="text-sm text-green-600">Recent Messages</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-700">{activities.length}</div>
              <div className="text-sm text-purple-600">Recent Activities</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => navigate("/connections")}
            >
              <Users className="h-6 w-6" />
              <span>Manage Connections</span>
              {connectionStats.pending > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {connectionStats.pending} pending
                </Badge>
              )}
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => navigate("/messages")}
            >
              <MessageCircle className="h-6 w-6" />
              <span>View Messages</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialHub;
