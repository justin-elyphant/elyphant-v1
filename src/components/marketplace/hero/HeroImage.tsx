
import React from "react";

interface HeroImageProps {
  isMobile: boolean;
  imageSrc: string;
  altText: string;
}

const HeroImage: React.FC<HeroImageProps> = ({ isMobile, imageSrc, altText }) => {
  return (
    <div className={`${isMobile ? 'text-center' : 'text-right'}`}>
      <img 
        src={imageSrc} 
        alt={altText} 
        className="rounded-lg shadow-lg max-h-72 inline-block"
      />
    </div>
  );
};

export default HeroImage;
