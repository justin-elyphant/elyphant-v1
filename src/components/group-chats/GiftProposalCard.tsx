import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Heart, X, Clock, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { UnifiedMessage } from "@/services/UnifiedMessagingService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GiftProposalCardProps {
  message: UnifiedMessage;
  currentUserId: string;
  onVoteUpdate?: () => void;
}

const GiftProposalCard = ({ message, currentUserId, onVoteUpdate }: GiftProposalCardProps) => {
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();

  const votes = message.votes || [];
  const totalVotes = votes.length;
  const approveVotes = votes.filter(v => v.vote_type === 'approve').length;
  const rejectVotes = votes.filter(v => v.vote_type === 'reject').length;
  const maybeVotes = votes.filter(v => v.vote_type === 'maybe').length;

  const currentUserVote = votes.find(v => v.user_id === currentUserId);
  const approvalPercentage = totalVotes > 0 ? (approveVotes / totalVotes) * 100 : 0;

  const handleVote = async (voteType: 'approve' | 'reject' | 'maybe') => {
    if (isVoting) return;
    
    setIsVoting(true);
    try {
      const { error } = await supabase
        .from('gift_proposal_votes')
        .upsert({
          message_id: message.id,
          user_id: currentUserId,
          vote_type: voteType
        });

      if (error) throw error;
      
      toast("Vote recorded successfully!");
      onVoteUpdate?.();
    } catch (error) {
      console.error('Error voting:', error);
      toast("Failed to record vote");
    } finally {
      setIsVoting(false);
    }
  };

  const proposalData = message.proposal_data;
  if (!proposalData) return null;

  const getVoteButtonClass = (voteType: string) => {
    const isSelected = currentUserVote?.vote_type === voteType;
    return cn(
      "flex-1 h-8 text-xs",
      isSelected && voteType === 'approve' && "bg-green-500 text-white hover:bg-green-600",
      isSelected && voteType === 'reject' && "bg-red-500 text-white hover:bg-red-600", 
      isSelected && voteType === 'maybe' && "bg-yellow-500 text-white hover:bg-yellow-600",
      !isSelected && "variant-outline"
    );
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            🎁 Gift Proposal
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Product Info */}
        <div className="flex gap-3">
          {proposalData.product_image && (
            <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={proposalData.product_image} 
                alt={proposalData.product_name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{proposalData.product_name}</h4>
            <p className="text-lg font-bold text-primary">${proposalData.product_price}</p>
            {proposalData.description && (
              <p className="text-xs text-muted-foreground mt-1">{proposalData.description}</p>
            )}
          </div>
        </div>

        {/* Voting Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
            </span>
            <span className="text-green-600 font-medium">
              {approvalPercentage.toFixed(0)}% approval
            </span>
          </div>
          
          <Progress value={approvalPercentage} className="h-2" />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="text-green-600">👍 {approveVotes}</span>
            <span className="text-yellow-600">🤔 {maybeVotes}</span>
            <span className="text-red-600">👎 {rejectVotes}</span>
          </div>
        </div>

        {/* Deadline */}
        {proposalData.deadline && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Deadline: {new Date(proposalData.deadline).toLocaleDateString()}
          </div>
        )}

        {/* Voting Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={isVoting}
            onClick={() => handleVote('approve')}
            className={getVoteButtonClass('approve')}
          >
            👍 Approve
          </Button>
          <Button
            size="sm"
            disabled={isVoting}
            onClick={() => handleVote('maybe')}
            className={getVoteButtonClass('maybe')}
          >
            🤔 Maybe
          </Button>
          <Button
            size="sm"
            disabled={isVoting}
            onClick={() => handleVote('reject')}
            className={getVoteButtonClass('reject')}
          >
            👎 Reject
          </Button>
        </div>

        {/* Voters List */}
        {votes.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium">Votes:</h5>
            <div className="space-y-1">
              {votes.map((vote) => (
                <div key={vote.id} className="flex items-center justify-between text-xs">
                  <span>{vote.voter_name || 'Anonymous'}</span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      vote.vote_type === 'approve' && "border-green-500 text-green-700",
                      vote.vote_type === 'reject' && "border-red-500 text-red-700",
                      vote.vote_type === 'maybe' && "border-yellow-500 text-yellow-700"
                    )}
                  >
                    {vote.vote_type === 'approve' && '👍 Approve'}
                    {vote.vote_type === 'reject' && '👎 Reject'}
                    {vote.vote_type === 'maybe' && '🤔 Maybe'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GiftProposalCard;