
import React from "react";

interface InvitationBannerProps {
  invitedBy: string | null;
}

const InvitationBanner = ({ invitedBy }: InvitationBannerProps) => {
  if (!invitedBy) return null;
  
  return (
    <div className="mb-4 p-4 bg-purple-50 rounded-md text-center">
      <p className="text-purple-700 font-medium">
        {invitedBy} has invited you to join! Sign up to connect and view your gift.
      </p>
    </div>
  );
};

export default InvitationBanner;
