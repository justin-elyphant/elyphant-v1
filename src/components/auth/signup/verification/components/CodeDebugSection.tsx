
import React from "react";

interface CodeDebugSectionProps {
  setVerificationCode: (code: string) => void;
}

const CodeDebugSection: React.FC<CodeDebugSectionProps> = ({ setVerificationCode }) => {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="mt-4 p-2 border border-dashed border-gray-300 rounded-md">
      <p className="text-xs text-gray-500 mb-2">Debug: Manually set verification code</p>
      <div className="flex gap-2">
        <input 
          type="text" 
          className="text-xs p-1 border rounded flex-1"
          placeholder="Enter code" 
          onChange={(e) => e.target.value.length === 6 && setVerificationCode(e.target.value)}
        />
      </div>
    </div>
  );
};

export default CodeDebugSection;
