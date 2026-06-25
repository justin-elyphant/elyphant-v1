import React from "react";
import elyphantLogo from "@/assets/elyphant-logo.png.asset.json";

const ElyphantTextLogo = () => {
  return (
    <div className="h-10 lg:h-12 w-auto flex items-center justify-start pl-1 lg:pl-0">
      <img
        src={elyphantLogo.url}
        alt="Elyphant"
        className="h-8 lg:h-10 w-auto"
      />
    </div>
  );
};

export default ElyphantTextLogo;
