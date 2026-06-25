import React from "react";
import elyphantLogo from "@/assets/elyphant-logo.png.asset.json";

const ElyphantTextLogo = () => {
  return (
    <div className="flex items-center justify-start">
      <img
        src={elyphantLogo.url}
        alt="Elyphant"
        className="h-12 lg:h-14 w-auto"
      />
    </div>

  );
};

export default ElyphantTextLogo;
