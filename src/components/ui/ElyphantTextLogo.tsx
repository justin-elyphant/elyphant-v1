import React from "react";

const ElyphantTextLogo = () => {
  return (
    <svg
      width="180"
      height="64"
      viewBox="0 0 180 64"
      className="h-16 w-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="elyphantGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="#9333ea" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="28"
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
        fill="url(#elyphantGradient)"
        letterSpacing="-0.02em"
      >
        Elyphant
      </text>
    </svg>
  );
};

export default ElyphantTextLogo;