
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Check, UserPlus, Mail } from "lucide-react";
import FacebookContactsButton from "@/components/connections/FacebookContactsButton";
import { useConnections } from "@/hooks/useConnections";
import ContextualHelp from "@/components/help/ContextualHelp";
import { toast } from "sonner";
import { createConnection } from "@/hooks/signup/services/connectionService";
import { useAuth } from "@/contexts/auth";

interface OnboardingConnectionsProps {
  onNext: () => void;
  onSkip: () => void;
}

const OnboardingConnections: React.FC<OnboardingConnectionsProps> = ({ onNext, onSkip }) => {
  const { user } = useAuth();
  const { suggestions } = useConnections();
  const [searchTerm, setSearchTerm] = useState("");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  
  // Attempt to get invitation data from URL if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invitedBy = params.get('invitedBy');
    const senderUserId = params.get('senderUserId');
    
    if (senderUserId && user?.id && invitedBy) {
      const handleInvitation = async () => {
        try {
          await createConnection(senderUserId, user.id, invitedBy);
          toast.success(`Connected with ${invitedBy}!`);
        } catch (error) {
          console.error("Error handling invitation:", error);
        }
      };
      
      handleInvitation();
    }
  }, [user]);
  
  const filteredSuggestions = suggestions.filter(suggestion => 
    suggestion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suggestion.username.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 4);

  const handleAddEmail = () => {
    if (!emailInput) return;
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (invitedEmails.includes(emailInput)) {
      toast.error("This email has already been invited");
      return;
    }
    
    setInvitedEmails([...invitedEmails, emailInput]);
    setEmailInput("");
    toast.success("Invitation sent!");
  };
  
  const handleConnectUser = async (userId: string, name: string) => {
    if (connectedUsers.includes(userId)) return;
    
    try {
      setIsConnecting(true);
      // In a real app, this would send an actual connection request
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      setConnectedUsers([...connectedUsers, userId]);
      toast.success(`Connection request sent to ${name}`);
    } catch (error) {
      toast.error(`Failed to connect with ${name}`);
      console.error("Connection error:", error);
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleConnectAll = async () => {
    setIsConnecting(true);
    try {
      // Connect with all filtered suggestions
      const promises = filteredSuggestions
        .filter(s => !connectedUsers.includes(s.id))
        .map(s => handleConnectUser(s.id, s.name));
      
      await Promise.all(promises);
      toast.success(`Connected with ${filteredSuggestions.length} people!`);
      setTimeout(() => {
        onNext();
      }, 1500);
    } catch (error) {
      console.error("Error connecting with all:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-blue-100 p-4 rounded-full">
          <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
        </div>
      </div>
      
      <h2 className="text-xl font-bold text-center mb-2">Find People You Know</h2>
      <p className="text-muted-foreground text-center mb-6">
        Connect with friends to share wishlists and gift preferences
      </p>
      
      <div className="mb-6">
        <div className="relative mb-4 flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search for people by name or username..."
            className="pl-10 pr-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ContextualHelp 
            id="search-help"
            content="Search for friends by their name or username to find and connect with them."
            title="Finding Friends"
            side="left"
            className="absolute right-3 top-1/2 -translate-y-1/2"
          />
        </div>
        
        <div className="space-y-3 mb-6">
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map(suggestion => (
              <div 
                key={suggestion.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                    {suggestion.imageUrl ? (
                      <img 
                        src={suggestion.imageUrl} 
                        alt={suggestion.name} 
                        className="w-10 h-10 rounded-full object-cover" 
                      />
                    ) : (
                      suggestion.name.substring(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{suggestion.name}</p>
                    <p className="text-sm text-muted-foreground">{suggestion.username}</p>
                  </div>
                </div>
                <Button 
                  variant={connectedUsers.includes(suggestion.id) ? "outline" : "default"}
                  size="sm" 
                  className="flex items-center gap-1"
                  disabled={connectedUsers.includes(suggestion.id) || isConnecting}
                  onClick={() => handleConnectUser(suggestion.id, suggestion.name)}
                >
                  {connectedUsers.includes(suggestion.id) ? (
                    <>
                      <Check className="h-4 w-4" />
                      Connected
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              {searchTerm ? (
                <p>No matching contacts found</p>
              ) : (
                <p>Search for people to connect with</p>
              )}
            </div>
          )}
        </div>
        
        {filteredSuggestions.length > 0 && (
          <Button 
            onClick={handleConnectAll} 
            className="w-full bg-blue-600 hover:bg-blue-700 mb-4"
            disabled={isConnecting}
          >
            Connect with All
            {isConnecting && <span className="ml-2 animate-spin">⏳</span>}
          </Button>
        )}
        
        <div className="relative mb-6">
          <hr className="border-t" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-muted-foreground text-sm">
            OR
          </div>
        </div>
        
        <div className="mb-4">
          <FacebookContactsButton />
        </div>
        
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <p className="text-sm font-medium">Invite by Email</p>
            <ContextualHelp 
              id="email-invite-help"
              content="Invite friends who aren't using the app yet. They'll receive an email with a link to sign up."
              title="Email Invitations"
              side="right"
              className="ml-1"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="friend@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleAddEmail} variant="outline">
              Invite
            </Button>
          </div>
          
          {invitedEmails.length > 0 && (
            <div className="mt-3 space-y-2">
              {invitedEmails.map((email, index) => (
                <div key={index} className="flex items-center text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 mr-1" />
                  <span>{email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onSkip} variant="ghost" className="flex-1">
          Skip for Now
        </Button>
        <Button 
          onClick={onNext} 
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default OnboardingConnections;
