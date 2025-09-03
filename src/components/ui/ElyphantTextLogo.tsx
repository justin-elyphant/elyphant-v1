import React from "react";

const ElyphantTextLogo = () => {
  return (
    <div className="h-16 w-auto opacity-100 flex items-center justify-center">
      <span
        className="text-4xl font-bold tracking-tight"
        style={{
          background: 'linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '-0.02em',
        }}
      >
        Elyphant
      </span>
    </div>
  );
};

export default ElyphantTextLogo;