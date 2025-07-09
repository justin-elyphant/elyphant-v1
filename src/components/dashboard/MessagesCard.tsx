import React from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MessagesCard = () => {
  // TODO: Replace with real messages data when implemented
  const recentMessages = [
    {
      id: '1',
      sender: 'Sarah Johnson',
      avatar: null,
      message: 'Thanks for the birthday gift suggestion!',
      time: '2h ago',
      unread: true
    },
    {
      id: '2', 
      sender: 'Mike Chen',
      avatar: null,
      message: 'Hey, I updated my wishlist',
      time: '1d ago',
      unread: false
    }
  ];

  const unreadCount = recentMessages.filter(msg => msg.unread).length;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
              Messages
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Chat with friends about gifts and events
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/messages" className="flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">New</span>
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentMessages.length > 0 ? (
            <div className="space-y-3">
              {recentMessages.map((message) => (
                <div key={message.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {message.sender.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-medium truncate ${message.unread ? 'text-gray-900' : 'text-muted-foreground'}`}>
                        {message.sender}
                      </p>
                      <span className="text-xs text-muted-foreground">{message.time}</span>
                      {message.unread && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className={`text-sm truncate ${message.unread ? 'text-gray-700' : 'text-muted-foreground'}`}>
                      {message.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h4 className="font-medium mb-2">No messages yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Start conversations about gifts and special occasions
              </p>
            </div>
          )}
          
          <Button className="w-full" asChild>
            <Link to="/messages">View All Messages</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessagesCard;