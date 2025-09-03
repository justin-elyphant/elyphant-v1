import React from "react";

const ElyphantTextLogo = () => {
  return (
    <div className="h-12 md:h-16 w-auto opacity-100 flex items-center justify-start pl-1 md:pl-0 gap-2 md:gap-3">
      <img 
        src="/lovable-uploads/9b4f3dc7-ff8b-46c4-9eb3-56681e8c73b9.png" 
        alt="Elyphant logo" 
        className="h-8 md:h-12 w-auto"
      />
      <span
        className="text-2xl md:text-4xl font-bold tracking-tight"
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