import React from 'react';

interface ElyphantLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ElyphantLogo: React.FC<ElyphantLogoProps> = ({ className, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-12 w-auto',
    md: 'h-20 w-auto', 
    lg: 'h-28 w-auto'
  };

  return (
    <div className={`${sizeClasses[size]} ${className || ''}`}>
      <svg
        viewBox="0 0 200 60"
        className="h-full w-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="elephantGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
        
        {/* Elephant silhouette */}
        <path
          d="M15 45c0-8 4-15 12-18 2-1 4-2 6-4 3-3 5-7 9-8 4-1 8 1 11 3 2 1 4 3 7 3 3 0 6-2 9-1 3 1 5 4 6 7 1 3 1 6 3 8 2 2 5 3 6 6 1 3 0 6-1 9-1 2-2 4-1 6 1 2 3 3 3 5 0 2-2 4-4 5-2 1-4 1-6 2-3 1-5 3-8 3-3 0-6-2-9-2-4 0-8 2-12 1-4-1-7-4-9-7-2-3-3-7-2-11z"
          fill="url(#elephantGradient)"
        />
        
        {/* Elephant trunk */}
        <path
          d="M8 35c-2 2-3 5-2 8 1 3 4 5 6 7 1 1 2 2 4 2 2 0 4-1 5-3"
          stroke="url(#elephantGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Eye */}
        <circle cx="32" cy="25" r="2" fill="white" />
        
        {/* Company name */}
        <text
          x="90"
          y="35"
          fontFamily="Inter, sans-serif"
          fontSize="24"
          fontWeight="700"
          fill="url(#elephantGradient)"
          className="select-none"
        >
          Elyphant
        </text>
      </svg>
    </div>
  );
};

export default ElyphantLogo;