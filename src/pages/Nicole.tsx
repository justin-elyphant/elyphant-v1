import React from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import NicoleActivityFeed from "@/components/dashboard/nicole/NicoleActivityFeed";
import { Button } from "@/components/ui/button";
import { Brain, MessageCircle, Settings, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Nicole = () => {
  const handleOpenNicole = () => {
    console.log("Opening Nicole AI interface");
    window.dispatchEvent(new CustomEvent('triggerNicole', {
      detail: {
        capability: 'general_assistance',
        selectedIntent: 'chat',
        source: 'nicole-page',
        autoGreeting: true,
        greetingContext: {
          greeting: 'general-welcome',
          activeMode: 'chat'
        }
      }
    }));
  };

  return (
    <SidebarLayout>
      <div className="container max-w-6xl mx-auto py-4 sm:py-8 px-3 sm:px-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            Nicole AI Assistant
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Your AI-powered gift discovery and personalization assistant
          </p>
        </div>

        <div className="grid gap-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                  Chat with Nicole
                </CardTitle>
                <CardDescription>
                  Get personalized gift recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleOpenNicole} className="w-full">
                  Start Conversation
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-green-500" />
                  AI Preferences
                </CardTitle>
                <CardDescription>
                  Customize Nicole's behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/settings?section=ai">
                    Manage Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  Gift Analytics
                </CardTitle>
                <CardDescription>
                  View recommendation insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/gifting?tab=analytics">
                    View Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Nicole's Activity Feed */}
          <NicoleActivityFeed showAll={true} />
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Nicole;