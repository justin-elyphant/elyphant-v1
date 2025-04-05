
import React from "react";

const TroubleshootingGuide = () => {
  return (
    <div className="text-sm text-center text-gray-600">
      <p className="mb-2">Having trouble?</p>
      <ul className="list-disc text-left ml-6 space-y-1">
        <li>Check your spam or junk folder</li>
        <li>Make sure your email address was entered correctly</li>
        <li>Try using a different browser if the verification link doesn't work</li>
        <li>The verification link works best on the same device you signed up on</li>
      </ul>
    </div>
  );
};

export default TroubleshootingGuide;
