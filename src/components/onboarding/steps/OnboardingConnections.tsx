
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Check, UserPlus } from "lucide-react";
import FacebookContactsButton from "@/components/connections/FacebookContactsButton";
import { useConnections } from "@/hooks/useConnections";
import { toast } from "sonner";

interface OnboardingConnectionsProps {
  onNext: () => void;
  onSkip: () => void;
}

const OnboardingConnections: React.FC<OnboardingConnectionsProps> = ({ onNext, onSkip }) => {
  const { suggestions } = useConnections();
  const [searchTerm, setSearchTerm] = useState("");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  
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
  
  const handleConnectAll = () => {
    toast.success(`Connected with ${filteredSuggestions.length} people!`);
    onNext();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-blue-100 p-4 rounded-full">
          <Users className="h-8 w-8 text-blue-600" />
        </div>
      </div>
      
      <h2 className="text-xl font-bold text-center mb-2">Find People You Know</h2>
      <p className="text-muted-foreground text-center mb-6">
        Connect with friends to share wishlists and gift preferences
      </p>
      
      <div className="mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search for people by name or username..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="space-y-3 mb-6">
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map(suggestion => (
              <div key={suggestion.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                    {suggestion.name.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{suggestion.name}</p>
                    <p className="text-sm text-muted-foreground">{suggestion.username}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <UserPlus className="h-4 w-4" />
                  Connect
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No matching contacts found</p>
            </div>
          )}
        </div>
        
        {filteredSuggestions.length > 0 && (
          <Button 
            onClick={handleConnectAll} 
            className="w-full bg-blue-600 hover:bg-blue-700 mb-4"
          >
            Connect with All
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
          <p className="text-sm font-medium mb-2">Invite by Email</p>
          <div className="flex gap-2">
            <Input
              placeholder="friend@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="flex-1"
            />
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
      
      <div className="flex gap-3">
        <Button onClick={onSkip} variant="ghost" className="flex-1">
          Skip for Now
        </Button>
        <Button onClick={onNext} className="flex-1 bg-blue-600 hover:bg-blue-700">
          Continue
        </Button>
      </div>
    </div>
  );
};

export default OnboardingConnections;
