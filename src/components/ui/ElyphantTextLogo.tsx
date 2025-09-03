import React from "react";

const ElyphantTextLogo = () => {
  return (
    <svg
      width="180"
      height="64"
      viewBox="0 0 180 64"
      className="h-16 w-auto opacity-100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 1 }}
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
          <stop offset="0%" stopColor="#9333ea" stopOpacity="1" />
          <stop offset="50%" stopColor="#7c3aed" stopOpacity="1" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="1" />
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
        style={{ opacity: 1 }}
      >
        Elyphant
      </text>
    </svg>
  );
};

export default ElyphantTextLogo;