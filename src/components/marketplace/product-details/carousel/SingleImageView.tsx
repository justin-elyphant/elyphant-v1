
import React from "react";

interface SingleImageViewProps {
  imageSrc: string;
  altText: string;
  onImageClick?: () => void;
}

const SingleImageView = ({ imageSrc, altText, onImageClick }: SingleImageViewProps) => {
  return (
    <div className="aspect-square relative group">
      <img 
        src={imageSrc} 
        alt={altText}
        className="w-full h-full object-contain rounded-md cursor-pointer transition-transform hover:scale-105"
        onError={(e) => {
          console.error("Image failed to load:", imageSrc);
          e.currentTarget.src = "/placeholder.svg";
        }}
        onClick={onImageClick}
      />
    </div>
  );
};

export default SingleImageView;
