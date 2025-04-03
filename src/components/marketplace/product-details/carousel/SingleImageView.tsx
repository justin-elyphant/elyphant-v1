
import React from "react";

interface SingleImageViewProps {
  imageSrc: string;
  altText: string;
}

const SingleImageView = ({ imageSrc, altText }: SingleImageViewProps) => {
  return (
    <div className="aspect-square relative">
      <img 
        src={imageSrc} 
        alt={altText}
        className="w-full h-full object-contain rounded-md"
        onError={(e) => {
          console.error("Image failed to load:", imageSrc);
          e.currentTarget.src = "/placeholder.svg";
        }}
      />
    </div>
  );
};

export default SingleImageView;
