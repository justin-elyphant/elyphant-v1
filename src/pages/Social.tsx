import React from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import SocialHubCard from "@/components/dashboard/SocialHubCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const Social = () => {
  return (
    <SidebarLayout>
      <div className="container max-w-6xl mx-auto py-4 sm:py-8 px-3 sm:px-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Social Hub
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Connect with friends, manage relationships, and view social activity
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Connections
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <SocialHubCard />
          </TabsContent>

          <TabsContent value="connections" className="space-y-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Manage Connections</h3>
              <p className="text-muted-foreground mb-4">
                View and manage all your friend connections
              </p>
              <Button asChild>
                <Link to="/connections">
                  Go to Connections
                </Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Messages</h3>
              <p className="text-muted-foreground mb-4">
                Chat with your friends and connections
              </p>
              <Button asChild>
                <Link to="/messages">
                  Go to Messages
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
};

export default Social;