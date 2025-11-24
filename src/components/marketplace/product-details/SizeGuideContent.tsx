import React from "react";
import { Link } from "react-router-dom";

interface SizeGuideContentProps {
  category?: string;
}

const SizeGuideContent: React.FC<SizeGuideContentProps> = ({ category }) => {
  return (
    <div className="space-y-4 py-3">
      <div className="text-sm text-elyphant-grey-text space-y-3">
        <p>
          Product sizing information is provided by the manufacturer. 
          We recommend checking the specific product details on Amazon 
          for the most accurate sizing charts.
        </p>
        
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 font-medium mb-1">
            💡 Personalize Your Experience
          </p>
          <p className="text-sm text-blue-700">
            Save your sizes in{" "}
            <Link 
              to="/settings?tab=profile&section=sizes" 
              className="underline font-medium hover:text-blue-900"
            >
              profile settings
            </Link>
            {" "}to get size recommendations when shopping.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SizeGuideContent;
